import { prisma } from './prisma';
import { logger } from '../utils/logger';
import { ProcessTask, TaskStatus, TaskType, Prisma } from '@prisma/client';
import { storage } from './storage';
import { smartExtractPdfText, OcrMode } from './pdf-service';
import { parseArticlesFromText, analyzeJudicialReviewAmar } from './ai-service';
import { searchJudicialReviews, ScrapedDecision } from './judicial-review-search';
import { normalizeArticleNumber } from './judicial-review';
import { computeMd5, findCachedVersion } from './pdf-cache';

// ─── Typed Payload Interfaces ────────────────────────────────────────────────

interface UploadPdfPayload {
  storagePath: string;
  originalFileUrl: string | null;
  regulationType: string;
  number: string;
  year: string;
  title: string;
  existingRegulationId?: string | null;
  ocrMode?: OcrMode;
}

interface SyncJrPayload {
  regulationId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function assertUploadPayload(payload: unknown): UploadPdfPayload {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid task payload');
  const p = payload as Record<string, unknown>;
  if (!p.storagePath) throw new Error('Missing storagePath in payload');
  if (!p.regulationType) throw new Error('Missing regulationType in payload');
  if (!p.number) throw new Error('Missing number in payload');
  if (!p.year) throw new Error('Missing year in payload');
  return p as unknown as UploadPdfPayload;
}

function assertSyncJrPayload(payload: unknown): SyncJrPayload {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid task payload');
  const p = payload as Record<string, unknown>;
  if (!p.regulationId) throw new Error('Missing regulationId in payload');
  return p as unknown as SyncJrPayload;
}

// ─── State ───────────────────────────────────────────────────────────────────

let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

// ─── Task Handlers ───────────────────────────────────────────────────────────

// Task registry for extensible execution
export type TaskHandler = (task: ProcessTask) => Promise<unknown>;
export const taskHandlers: Record<TaskType, TaskHandler> = {
  UPLOAD_PDF: async (task: ProcessTask) => {
    logger.info(`Starting UPLOAD_PDF processing for task ${task.id}`);
    const {
      storagePath,
      originalFileUrl,
      regulationType,
      number,
      year,
      title,
      existingRegulationId,
      ocrMode = 'AUTO'
    } = assertUploadPayload(task.payload);

    // Helper to update progress and result message
    const onProgress = async (msg: string) => {
      logger.info(`Task ${task.id} progress update: ${msg}`);
      let progress = 30;
      if (msg.includes('Docling')) progress = 30;
      else if (msg.includes('digital')) progress = 40;
      else if (msg.includes('Vision OCR') || msg.includes('FORCE')) progress = 50;
      else if (msg.includes('Chunk')) {
        const match = msg.match(/Chunk OCR (\d+) dari (\d+)/);
        if (match) {
          const current = parseInt(match[1]);
          const total = parseInt(match[2]);
          progress = Math.round(50 + (current / total) * 30); // 50% to 80%
        }
      } else if (msg.includes('AI/Regex')) progress = 85;
      else if (msg.includes('Menyimpan')) progress = 95;

      await prisma.processTask.update({
        where: { id: task.id },
        data: {
          progress,
          result: { message: msg }
        }
      });
    };

    await onProgress('Mulai memproses berkas PDF...');

    // Download PDF from MinIO
    const fileStream = await storage.getFileStream(storagePath);
    const pdfBuffer = await streamToBuffer(fileStream);

    // ── PERF-01: MD5 cache dedup ──────────────────────────────────────────
    const md5Hash = computeMd5(pdfBuffer);
    const cached = await findCachedVersion(md5Hash);
    if (cached && cached.rawText) {
      logger.info(`Cache hit for MD5 ${md5Hash} → version ${cached.id}. Skipping extraction.`);
      await onProgress('File PDF identik ditemukan di cache. Menggunakan hasil ekstraksi sebelumnya...');
      return {
        success: true,
        message: `Dokumen sudah ada (cache hit). Menggunakan teks dari versi sebelumnya (${cached.fullTitle}).`,
        regulationId: cached.regulationId,
        versionId: cached.id,
        parsedArticles: 0,
        textLength: cached.rawText.length,
        fromCache: true
      };
    }

    // Smart PDF text extraction
    let rawText = '';
    let extractionMethod = '';

    try {
      const extractResult = await smartExtractPdfText(pdfBuffer, onProgress, ocrMode);
      rawText = extractResult.text;
      extractionMethod = extractResult.method;
    } catch (extractError) {
      logger.error('Extraction failed:', extractError);
      throw extractError;
    }

    if (!rawText || rawText.trim().length < 100) {
      throw new Error(`Gagal membaca teks (hanya ${rawText?.length ?? 0} karakter). PDF mungkin terproteksi atau gambar buram.`);
    }

    await onProgress(`Teks terekstrak (${extractionMethod}): ${rawText.length} karakter. Menjalankan parsing pasal...`);

    // Get or create regulation type
    let regType = await prisma.regulationType.findFirst({
      where: { shortName: regulationType }
    });

    if (!regType) {
      const typeNames: Record<string, string> = {
        'UU': 'Undang-Undang',
        'PP': 'Peraturan Pemerintah',
        'Perpres': 'Peraturan Presiden',
        'Permen': 'Peraturan Menteri',
        'Perda': 'Peraturan Daerah'
      };
      regType = await prisma.regulationType.create({
        data: {
          shortName: regulationType,
          name: typeNames[regulationType] ?? regulationType
        }
      });
    }

    // Get or create regulation
    let regulation = null;
    if (existingRegulationId) {
      regulation = await prisma.regulation.findUnique({ where: { id: existingRegulationId } });
    }

    if (!regulation) {
      regulation = await prisma.regulation.findFirst({
        where: {
          title: { contains: title, mode: 'insensitive' },
          typeId: regType.id
        }
      });
    }

    if (!regulation) {
      regulation = await prisma.regulation.create({
        data: {
          title,
          description: `${regulationType} tentang ${title}`,
          typeId: regType.id
        }
      });
    }

    // Check for existing version
    const existingVersion = await prisma.regulationVersion.findFirst({
      where: {
        regulationId: regulation.id,
        number,
        year: parseInt(year)
      }
    });

    if (existingVersion) {
      throw new Error(`${regulationType} No. ${number} Tahun ${year} sudah ada dalam sistem`);
    }

    // Handle previous version
    const previousVersion = await prisma.regulationVersion.findFirst({
      where: {
        regulationId: regulation.id,
        status: 'ACTIVE'
      },
      orderBy: { year: 'desc' }
    });

    // Parse articles using AI
    await onProgress('Menggunakan AI/Regex untuk menstrukturkan pasal...');
    let parsedArticles: { number: string; content: string }[] = [];
    try {
      parsedArticles = await parseArticlesFromText(rawText);
    } catch (e) {
      logger.error('Parsing articles from text failed:', e);
    }

    // Deduplicate parsed article numbers
    const seenNumbers = new Set<string>();
    const uniqueArticles = parsedArticles.reduce<Array<{ number: string; content: string }>>((acc, article) => {
      const key = article.number.trim();
      if (!key || seenNumbers.has(key)) {
        return acc;
      }
      seenNumbers.add(key);
      acc.push({ number: key, content: article.content });
      return acc;
    }, []);

    // Create new version and replace status atomically
    const fullTitle = `${regulationType} Nomor ${number} Tahun ${year} tentang ${title}`;
    await onProgress(`Menyimpan ${uniqueArticles.length} pasal ke database...`);

    let dbRawText = rawText;
    if (extractionMethod !== 'docling') {
      dbRawText = `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${extractionMethod}). Struktur tabel mungkin tidak terurai dengan sempurna.]\n\n${rawText}`;
    }

    const currentRegulation = regulation;

    const version = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (previousVersion) {
        await tx.regulationVersion.update({
          where: { id: previousVersion.id },
          data: { status: 'AMENDED' }
        });
      }

      const createdVersion = await tx.regulationVersion.create({
        data: {
          regulationId: currentRegulation.id,
          number,
          year: parseInt(year),
          fullTitle,
          rawText: dbRawText,
          extractionMethod,
          status: 'ACTIVE',
          amendsId: previousVersion?.id,
          originalFileUrl,
          pdfMd5Hash: md5Hash,
          ocrMode
        }
      });

      if (uniqueArticles.length > 0) {
        await tx.article.createMany({
          data: uniqueArticles.map((article, index) => ({
            versionId: createdVersion.id,
            articleNumber: article.number,
            content: article.content,
            status: 'ACTIVE' as const,
            orderIndex: index
          }))
        });
      }

      return createdVersion;
    });

    return {
      success: true,
      message: `${fullTitle} berhasil diproses`,
      regulationId: currentRegulation.id,
      versionId: version.id,
      parsedArticles: uniqueArticles.length,
      textLength: rawText.length
    };
  },
  SYNC_JR: async (task: ProcessTask) => {
    logger.info(`Starting SYNC_JR processing for task ${task.id}`);
    const { regulationId } = assertSyncJrPayload(task.payload);

    // Helper to update progress and result message
    const onProgress = async (progress: number, msg: string) => {
      logger.info(`Task ${task.id} progress update: ${progress}% - ${msg}`);
      await prisma.processTask.update({
        where: { id: task.id },
        data: {
          progress,
          result: { message: msg }
        }
      });
    };

    await onProgress(20, 'Mencari informasi regulasi di database...');

    const regulation = await prisma.regulation.findUnique({
      where: { id: regulationId },
      include: {
        type: true,
        versions: {
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
          include: {
            articles: {
              select: { id: true, articleNumber: true }
            }
          }
        }
      }
    });

    if (!regulation) {
      throw new Error('Regulation not found');
    }

    await onProgress(30, `Mencari putusan judicial review di MK/MA untuk ${regulation.title}...`);

    const latestVersion = regulation.versions[0];
    const candidates = await searchJudicialReviews({
      regulationType: regulation.type.shortName,
      regulationTitle: regulation.title,
      number: latestVersion?.number,
      year: latestVersion?.year
    });

    if (!candidates.length) {
      return {
        success: true,
        message: 'Tidak ditemukan kandidat putusan JR dari pencarian otomatis.',
        synced: 0,
        created: 0,
        updated: 0
      };
    }

    await onProgress(60, `Ditemukan ${candidates.length} kandidat putusan. Menganalisis amar putusan menggunakan AI...`);

    const articleLookup = new Map<string, string>();
    const allArticleNumbers: string[] = [];
    for (const version of regulation.versions) {
      for (const article of version.articles) {
        const key = normalizeArticleNumber(article.articleNumber);
        if (!articleLookup.has(key)) {
          articleLookup.set(key, article.id);
        }
        if (!allArticleNumbers.includes(article.articleNumber)) {
          allArticleNumbers.push(article.articleNumber);
        }
      }
    }

    let createdCount = 0;
    let updatedCount = 0;

    // Process each candidate and run LLM analysis
    const analyzedCandidates: ScrapedDecision[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      await onProgress(
        Math.round(60 + (i / candidates.length) * 30),
        `Menganalisis putusan ${i + 1}/${candidates.length}: ${candidate.decisionNumber}...`
      );

      try {
        const analysis = await analyzeJudicialReviewAmar(candidate.amarText, allArticleNumbers);
        analyzedCandidates.push({
          ...candidate,
          outcome: analysis.outcome,
          impacts: analysis.impacts
        });
      } catch (err) {
        logger.error(`AI analysis failed for decision ${candidate.decisionNumber}, using heuristics fallback`, err);
        analyzedCandidates.push(candidate);
      }
    }

    await onProgress(95, 'Menyimpan hasil ke database...');

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const candidate of analyzedCandidates) {
        const existing = await tx.judicialReviewCase.findFirst({
          where: {
            forum: candidate.forum,
            decisionNumber: candidate.decisionNumber
          }
        });

        if (existing) {
          await tx.judicialReviewCase.update({
            where: { id: existing.id },
            data: {
              regulationId,
              decisionDate: candidate.decisionDate,
              amarText: candidate.amarText,
              sourceUrl: candidate.sourceUrl,
              rawText: candidate.rawText,
              outcome: candidate.outcome,
              impacts: {
                deleteMany: {},
                create: candidate.impacts.map((impact) => ({
                  articleNumber: impact.articleNumber,
                  articleId: articleLookup.get(normalizeArticleNumber(impact.articleNumber)) ?? null,
                  disposition: impact.disposition,
                  notes: 'notes' in impact ? (impact.notes as string | null) : null,
                  amarExcerpt: impact.amarExcerpt ?? null
                }))
              }
            }
          });
          updatedCount += 1;
        } else {
          await tx.judicialReviewCase.create({
            data: {
              regulationId,
              forum: candidate.forum,
              decisionNumber: candidate.decisionNumber,
              decisionDate: candidate.decisionDate,
              amarText: candidate.amarText,
              sourceUrl: candidate.sourceUrl,
              rawText: candidate.rawText,
              outcome: candidate.outcome,
              impacts: {
                create: candidate.impacts.map((impact) => ({
                  articleNumber: impact.articleNumber,
                  articleId: articleLookup.get(normalizeArticleNumber(impact.articleNumber)) ?? null,
                  disposition: impact.disposition,
                  notes: 'notes' in impact ? (impact.notes as string | null) : null,
                  amarExcerpt: impact.amarExcerpt ?? null
                }))
              }
            }
          });
          createdCount += 1;
        }
      }
    });

    return {
      success: true,
      message: `Berhasil menyinkronkan ${candidates.length} putusan judicial review.`,
      synced: candidates.length,
      created: createdCount,
      updated: updatedCount
    };
  }
};

// ─── Worker Loop ─────────────────────────────────────────────────────────────

/**
 * Polls the database for the next PENDING task, marks it as PROCESSING,
 * and processes it with the appropriate handler.
 */
export async function processNextTask(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  // Track current task we are processing to update its failure state if needed
  let activeTaskId: string | null = null;

  try {
    // Find the oldest pending task
    const task = await prisma.processTask.findFirst({
      where: { status: TaskStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    if (!task) {
      isProcessing = false;
      return;
    }

    activeTaskId = task.id;
    logger.info(`Starting background task ${task.id} (${task.type})`);

    // Atomically mark the task as PROCESSING
    await prisma.processTask.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.PROCESSING,
        progress: 10, // Start progress at 10%
      },
    });

    const handler = taskHandlers[task.type];
    if (!handler) {
      throw new Error(`No handler registered for task type: ${task.type}`);
    }

    // Execute the task handler
    const result = await handler(task);

    // Update status to SUCCESS
    await prisma.processTask.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.SUCCESS,
        progress: 100,
        result: (result as Prisma.InputJsonValue) ?? Prisma.DbNull,
      },
    });

    logger.info(`Task ${task.id} completed successfully`);
  } catch (error: unknown) {
    logger.error('Error executing background task:', error);

    // Attempt to mark the current task as FAILED
    if (activeTaskId) {
      try {
        const message = error instanceof Error ? error.message : String(error);
        await prisma.processTask.update({
          where: { id: activeTaskId },
          data: {
            status: TaskStatus.FAILED,
            error: message,
          },
        });
      } catch (updateError) {
        logger.error(`Failed to update task status to FAILED for task ${activeTaskId}:`, updateError);
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Starts the background worker loop using recursive setTimeout.
 */
export function startWorker(intervalMs = 3000): void {
  if (workerInterval) {
    logger.warn('Background worker is already running.');
    return;
  }

  logger.info('Starting background task worker...');

  async function tick() {
    await processNextTask();
    if (workerInterval !== null) {
      workerInterval = setTimeout(tick, intervalMs);
    }
  }

  workerInterval = setTimeout(tick, intervalMs);
}

/**
 * Stops the background worker loop.
 */
export function stopWorker(): void {
  if (workerInterval) {
    clearTimeout(workerInterval);
    workerInterval = null;
    logger.info('Background task worker stopped.');
  }
}

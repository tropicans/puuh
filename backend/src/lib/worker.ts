import { prisma } from './prisma';
import { logger } from '../utils/logger';
import { ProcessTask, TaskStatus, TaskType } from '@prisma/client';
import { storage } from './storage';
import { smartExtractPdfText } from './pdf-service';
import { parseArticlesFromText } from './ai-service';

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

// Task registry for extensible execution
export type TaskHandler = (task: ProcessTask) => Promise<any>;
export const taskHandlers: Record<TaskType, TaskHandler> = {
  UPLOAD_PDF: async (task: ProcessTask) => {
    logger.info(`Starting UPLOAD_PDF processing for task ${task.id}`);
    if (!task.payload || typeof task.payload !== 'object') {
      throw new Error('Invalid task payload');
    }

    const {
      storagePath,
      originalFileUrl,
      regulationType,
      number,
      year,
      title,
      existingRegulationId
    } = task.payload as any;

    if (!storagePath) {
      throw new Error('Missing storagePath in payload');
    }

    // Helper to update progress and result message
    const onProgress = async (msg: string) => {
      logger.info(`Task ${task.id} progress update: ${msg}`);
      let progress = 30;
      if (msg.includes('Docling')) progress = 30;
      else if (msg.includes('digital')) progress = 40;
      else if (msg.includes('Vision OCR')) progress = 50;
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

    // Smart PDF text extraction
    let rawText = '';
    let extractionMethod = '';

    try {
      const extractResult = await smartExtractPdfText(pdfBuffer, onProgress);
      rawText = extractResult.text;
      extractionMethod = extractResult.method;
    } catch (extractError) {
      logger.error('Extraction failed:', extractError);
      throw extractError;
    }

    if (!rawText || rawText.trim().length < 100) {
      throw new Error(`Gagal membaca teks (hanya ${rawText?.length || 0} karakter). PDF mungkin terproteksi atau gambar buram.`);
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
          name: typeNames[regulationType] || regulationType
        }
      });
    }

    // Get or create regulation
    let regulation;
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

    const version = await prisma.$transaction(async (tx: any) => {
      if (previousVersion) {
        await tx.regulationVersion.update({
          where: { id: previousVersion.id },
          data: { status: 'AMENDED' }
        });
      }

      const createdVersion = await tx.regulationVersion.create({
        data: {
          regulationId: regulation!.id,
          number,
          year: parseInt(year),
          fullTitle,
          rawText: dbRawText,
          extractionMethod,
          status: 'ACTIVE',
          amendsId: previousVersion?.id,
          originalFileUrl
        }
      });

      if (uniqueArticles.length > 0) {
        await tx.article.createMany({
          data: uniqueArticles.map((article, index) => ({
            versionId: createdVersion.id,
            articleNumber: article.number,
            content: article.content,
            status: 'ACTIVE',
            orderIndex: index
          }))
        });
      }

      return createdVersion;
    });

    return {
      success: true,
      message: `${fullTitle} berhasil diproses`,
      regulationId: regulation!.id,
      versionId: version.id,
      parsedArticles: uniqueArticles.length,
      textLength: rawText.length
    };
  },
  SYNC_JR: async (task: ProcessTask) => {
    logger.info(`Running SYNC_JR placeholder for task ${task.id}`);
    return { message: 'SYNC_JR stub executed successfully', payload: task.payload };
  }
};

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
        result: result ?? null,
      },
    });

    logger.info(`Task ${task.id} completed successfully`);
  } catch (error: any) {
    logger.error('Error executing background task:', error);
    
    // Attempt to mark the current task as FAILED
    if (activeTaskId) {
      try {
        await prisma.processTask.update({
          where: { id: activeTaskId },
          data: {
            status: TaskStatus.FAILED,
            error: error?.message || String(error),
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

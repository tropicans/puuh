import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { storage } from '../lib/storage';
import { smartExtractPdfText } from '../lib/pdf-service';
import { parseArticlesFromText } from '../lib/ai-service';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

const uploadSchema = z.object({
  regulationType: z.string().min(1, 'Jenis peraturan harus diisi'),
  number: z.string().min(1, 'Nomor peraturan harus diisi'),
  year: z.string().regex(/^\d{4}$/, 'Tahun harus 4 digit angka'),
  title: z.string().optional(),
  existingRegulationId: z.string().optional().nullable(),
});

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'File harus diupload.' });
  }

  // MIME type and file extension validation
  const ALLOWED_MIMES = ['application/pdf'];
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return res.status(400).json({ success: false, message: 'Hanya file PDF yang diterima.' });
  }

  const fileName = file.originalname.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    return res.status(400).json({ success: false, message: 'Ekstensi file harus .pdf.' });
  }

  const result = uploadSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.issues.map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, message: `Validation Error: ${errorMsg}` });
  }

  const { regulationType, number, year } = result.data;
  let title = result.data.title;
  const existingRegulationId = result.data.existingRegulationId;

  // Auto-generate title if not provided
  if (!title) {
    title = `${regulationType} Nomor ${number} Tahun ${year}`;
  }

  // Configure response headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Try flushing headers if using compression
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const send = (data: unknown) => {
    res.write(JSON.stringify(data) + '\n');
  };

  try {
    send({ type: 'progress', message: 'Mulai memproses PDF...' });

    // Extract text using smart fallback chain
    let rawText = '';
    let extractionMethod = '';

    try {
      const extractResult = await smartExtractPdfText(file.buffer, (msg) => {
        send({ type: 'progress', message: msg });
      });
      rawText = extractResult.text;
      extractionMethod = extractResult.method;
    } catch (extractError) {
      console.error('Extraction failed:', extractError);
    }

    if (!rawText || rawText.trim().length < 100) {
      send({
        type: 'error',
        message: `Gagal membaca teks (hanya ${rawText?.length || 0} karakter). PDF mungkin terproteksi atau gambar buram.`
      });
      res.end();
      return;
    }

    send({ type: 'progress', message: `Teks terekstrak (${extractionMethod}): ${rawText.length} karakter. Identifikasi pasal...` });

    // Database operations
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
      send({
        type: 'error',
        message: `${regulationType} No. ${number} Tahun ${year} sudah ada dalam sistem`
      });
      res.end();
      return;
    }

    // Handle previous version
    const previousVersion = await prisma.regulationVersion.findFirst({
      where: {
        regulationId: regulation.id,
        status: 'ACTIVE'
      },
      orderBy: { year: 'desc' }
    });

    // Upload to MinIO
    let originalFileUrl = null;
    try {
      const filename = `regulations/${year}/${regulationType.replace(/\s+/g, '_')}_${number}_${Date.now()}.pdf`;
      console.log(`Uploading to MinIO: ${filename}`);
      originalFileUrl = await storage.uploadFile(filename, file.buffer, 'application/pdf');
      send({ type: 'progress', message: 'File PDF berhasil diupload ke MinIO Storage.' });
    } catch (uploadErr) {
      console.error('MinIO upload failed:', uploadErr);
      send({ type: 'progress', message: '⚠️ Gagal upload ke MinIO (lanjut parsing text saja).' });
    }

    // Parse articles
    send({ type: 'progress', message: 'Menggunakan AI/Regex untuk menstrukturkan pasal...' });
    let parsedArticles: { number: string; content: string }[] = [];
    try {
      parsedArticles = await parseArticlesFromText(rawText);
    } catch (e) {
      console.error('Parsing error:', e);
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
    send({ type: 'progress', message: `Menyimpan ${uniqueArticles.length} pasal ke database...` });

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

    // Success response
    send({
      type: 'success',
      data: {
        success: true,
        message: `${fullTitle} berhasil diupload`,
        regulationId: regulation!.id,
        versionId: version.id,
        parsedArticles: uniqueArticles.length,
        textLength: rawText.length
      }
    });
    res.end();

  } catch (error) {
    console.error('Stream processing error:', error);
    send({
      type: 'error',
      message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    });
    res.end();
  }
});

export default router;

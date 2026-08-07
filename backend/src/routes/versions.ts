import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { updateVersionSchema } from '../utils/validations';
import { parseArticlesFromText } from '../lib/ai-service';
import { cleanPdfText } from '../utils/text';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// GET single version
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const version = await prisma.regulationVersion.findUnique({
      where: { id },
      include: {
        regulation: { include: { type: true } },
        articles: { orderBy: { orderIndex: 'asc' } }
      }
    });

    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    return res.json({ success: true, version });
  } catch (error) {
    logger.error('Error fetching version:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch version' });
  }
});

// POST create version (ADMIN only)
router.post('/', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { regulationId, number, year, fullTitle, effectiveDate, pdfPath, rawText, amendsId } = req.body;
    if (!regulationId || !number || !year || !fullTitle) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    let parsedEffectiveDate: Date | undefined;
    if (effectiveDate) {
      const asDate = new Date(effectiveDate);
      if (!Number.isNaN(asDate.getTime())) {
        parsedEffectiveDate = asDate;
      }
    }

    const version = await prisma.$transaction(async (tx: any) => {
      if (amendsId) {
        await tx.regulationVersion.update({
          where: { id: amendsId },
          data: { status: 'AMENDED' }
        });
      }

      return tx.regulationVersion.create({
        data: {
          regulationId,
          number,
          year: parseInt(year.toString()),
          fullTitle,
          status: 'ACTIVE',
          ...(parsedEffectiveDate && { effectiveDate: parsedEffectiveDate }),
          ...(pdfPath && { pdfPath }),
          ...(rawText && { rawText }),
          ...(amendsId && { amendsId })
        },
        include: {
          regulation: true
        }
      });
    });

    return res.json({ success: true, data: version });
  } catch (error) {
    logger.error('Error creating version:', error);
    return res.status(500).json({ success: false, error: 'Failed to create version' });
  }
});

// PUT update version metadata (ADMIN only)
router.put('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = updateVersionSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ success: false, error: payload.error.issues.map((i) => i.message).join(', ') });
    }

    const { number, year, fullTitle, status, effectiveDate } = payload.data;

    let parsedEffectiveDate: Date | undefined;
    if (effectiveDate) {
      const asDate = new Date(effectiveDate);
      if (Number.isNaN(asDate.getTime())) {
        return res.status(400).json({ success: false, error: 'effectiveDate tidak valid' });
      }
      parsedEffectiveDate = asDate;
    }

    const version = await prisma.regulationVersion.update({
      where: { id },
      data: {
        ...(number && { number }),
        ...(year !== undefined && { year }),
        ...(fullTitle && { fullTitle }),
        ...(status && { status }),
        ...(parsedEffectiveDate && { effectiveDate: parsedEffectiveDate })
      }
    });

    return res.json({ success: true, version });
  } catch (error) {
    logger.error('Error updating version:', error);
    return res.status(500).json({ success: false, error: 'Failed to update version' });
  }
});

// PUT update version status (ADMIN only)
router.put('/:id/status', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['ACTIVE', 'AMENDED', 'REVOKED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const version = await prisma.regulationVersion.update({
      where: { id },
      data: { status }
    });

    return res.json({ success: true, data: version });
  } catch (error) {
    logger.error('Error updating version status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update version status' });
  }
});

// DELETE version (ADMIN only)
router.delete('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.regulationVersion.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting version:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete version' });
  }
});

// POST reparse version text with AI (ADMIN only)
router.post('/:id/reparse', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const version = await prisma.regulationVersion.findUnique({
      where: { id },
      include: { articles: true }
    });

    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    if (!version.rawText || version.rawText.length < 100) {
      return res.status(400).json({ success: false, error: 'No raw text stored for this version' });
    }

    let parsedArticles: { number: string; content: string }[] = [];
    try {
      const cleanedText = cleanPdfText(version.rawText);
      parsedArticles = await parseArticlesFromText(cleanedText);
    } catch (e) {
      logger.error('AI parsing error in reparse:', e);
      return res.status(500).json({
        success: false,
        error: 'AI parsing failed: ' + (e instanceof Error ? e.message : 'Unknown error')
      });
    }

    const uniqueArticlesMap = new Map<string, { number: string; content: string }>();
    parsedArticles.forEach((article) => {
      const key = article.number.trim();
      if (uniqueArticlesMap.has(key)) {
        const existing = uniqueArticlesMap.get(key)!;
        existing.content += '\n\n' + article.content;
      } else {
        uniqueArticlesMap.set(key, { ...article, number: key });
      }
    });

    const uniqueArticles = Array.from(uniqueArticlesMap.values());

    if (uniqueArticles.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Re-parse tidak menghasilkan pasal. Pasal lama dipertahankan.'
      });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.article.deleteMany({ where: { versionId: id } });
      await tx.article.createMany({
        data: uniqueArticles.map((article, index) => ({
          versionId: id,
          articleNumber: article.number,
          content: article.content,
          status: 'ACTIVE',
          orderIndex: index
        }))
      });
    });

    return res.json({
      success: true,
      message: `Berhasil mengekstrak ${uniqueArticles.length} pasal`,
      articlesCount: uniqueArticles.length
    });
  } catch (error) {
    logger.error('Error reparsing version:', error);
    return res.status(500).json({ success: false, error: 'Failed to re-parse version' });
  }
});

// POST reupload version PDF (ADMIN only)
router.post('/:id/reupload', authMiddleware('ADMIN'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const version = await prisma.regulationVersion.findUnique({
      where: { id },
      include: { articles: true }
    });

    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    let rawText = '';
    let numPages = 0;
    try {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(file.buffer);
      rawText = pdfData.text || '';
      numPages = pdfData.numpages || 0;
    } catch (e) {
      logger.error('PDF re-parse error:', e);
      return res.status(400).json({
        success: false,
        error: 'Gagal membaca PDF. Pastikan file tidak corrupt.'
      });
    }

    if (!rawText || rawText.trim().length < 100) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat membaca teks dari PDF. Mungkin hasil scan?'
      });
    }

    let parsedArticles: { number: string; content: string }[] = [];
    try {
      parsedArticles = await parseArticlesFromText(rawText);
    } catch (e) {
      logger.error('AI parsing error in reupload:', e);
      return res.status(500).json({
        success: false,
        error: 'AI parsing gagal. Data lama dipertahankan.'
      });
    }

    const dedupedMap = new Map<string, { number: string; content: string }>();
    for (const article of parsedArticles) {
      const key = article.number.trim();
      if (!key) continue;
      if (!dedupedMap.has(key)) {
        dedupedMap.set(key, { number: key, content: article.content });
      }
    }
    const uniqueArticles = Array.from(dedupedMap.values());

    if (uniqueArticles.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Re-upload tidak menghasilkan pasal. Data lama dipertahankan.'
      });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.regulationVersion.update({
        where: { id },
        data: { rawText }
      });

      await tx.article.deleteMany({ where: { versionId: id } });

      await tx.article.createMany({
        data: uniqueArticles.map((article, index) => ({
          versionId: id,
          articleNumber: article.number,
          content: article.content,
          status: 'ACTIVE',
          orderIndex: index
        }))
      });
    });

    return res.json({
      success: true,
      message: `PDF berhasil diupload ulang. Ditemukan ${uniqueArticles.length} pasal.`,
      textLength: rawText.length,
      numPages,
      articlesCount: uniqueArticles.length
    });
  } catch (error) {
    logger.error('Error re-uploading version:', error);
    return res.status(500).json({ success: false, error: 'Failed to re-upload version' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { storage } from '../lib/storage';
import { smartExtractPdfText } from '../lib/pdf-service';
import { parseArticlesFromText } from '../lib/ai-service';
import { authMiddleware } from '../middleware/auth';

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
  ocrMode: z.enum(['AUTO', 'FORCE', 'SKIP']).optional().default('AUTO'),
});

router.post('/', authMiddleware('ADMIN'), upload.single('file'), async (req: Request, res: Response) => {
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

  const { regulationType, number, year, ocrMode } = result.data;
  let title = result.data.title;
  const existingRegulationId = result.data.existingRegulationId;

  // Auto-generate title if not provided
  if (!title) {
    title = `${regulationType} Nomor ${number} Tahun ${year}`;
  }

  // Upload to MinIO first
  let originalFileUrl = null;
  const filename = `regulations/${year}/${regulationType.replace(/\s+/g, '_')}_${number}_${Date.now()}.pdf`;
  
  try {
    console.log(`Uploading to MinIO: ${filename}`);
    originalFileUrl = await storage.uploadFile(filename, file.buffer, 'application/pdf');
  } catch (uploadErr) {
    console.error('MinIO upload failed during route handler:', uploadErr);
    return res.status(500).json({ success: false, message: 'Gagal mengupload file PDF ke storage.' });
  }

  try {
    // Create a new ProcessTask in database
    const task = await prisma.processTask.create({
      data: {
        type: 'UPLOAD_PDF',
        status: 'PENDING',
        progress: 0,
        payload: {
          storagePath: filename,
          originalFileUrl,
          regulationType,
          number,
          year,
          title,
          existingRegulationId,
          ocrMode
        }
      }
    });

    return res.status(202).json({
      success: true,
      taskId: task.id,
      message: 'Upload berhasil. Pemrosesan dokumen sedang berjalan di latar belakang.'
    });
  } catch (dbErr) {
    console.error('Failed to queue background task:', dbErr);
    return res.status(500).json({ success: false, message: 'Gagal mengantrekan tugas pemrosesan.' });
  }
});

export default router;

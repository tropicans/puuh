import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET database status (ADMIN only)
router.get('/', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const regulationCount = await prisma.regulation.count();
    const versionCount = await prisma.regulationVersion.count();
    const articleCount = await prisma.article.count();

    return res.json({
      success: true,
      connected: true,
      stats: {
        regulations: regulationCount,
        versions: versionCount,
        articles: articleCount
      }
    });
  } catch (error) {
    logger.error('Database connection error in status check:', error);
    return res.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Gagal terhubung ke database'
    });
  }
});

export default router;

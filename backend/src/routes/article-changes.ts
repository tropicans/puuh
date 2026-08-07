import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// POST create article change record (ADMIN only)
router.post('/', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { articleId, changeType, oldContent, newContent, diffHtml, changedInYear, notes } = req.body;
    if (!articleId || !changeType || changedInYear === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const change = await prisma.articleChange.create({
      data: {
        articleId,
        changeType,
        oldContent,
        newContent,
        diffHtml,
        changedInYear: parseInt(changedInYear.toString()),
        notes
      }
    });

    return res.json({ success: true, data: change });
  } catch (error) {
    logger.error('Error creating article change:', error);
    return res.status(500).json({ success: false, error: 'Failed to record article change' });
  }
});

export default router;

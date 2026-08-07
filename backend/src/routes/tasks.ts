import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET status of a background task
router.get('/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.processTask.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    return res.json({
      success: true,
      task: {
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        error: task.error,
        result: task.result,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching task status:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch task status' });
  }
});

export default router;

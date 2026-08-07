import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { updateArticleSchema } from '../utils/validations';
import { logger } from '../utils/logger';

const router = Router();

// GET articles by versionId
router.get('/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const articles = await prisma.article.findMany({
      where: { versionId },
      orderBy: { orderIndex: 'asc' },
      include: {
        changes: true
      }
    });
    return res.json({ success: true, data: articles });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch articles' });
  }
});

// POST bulk create/overwrite articles (ADMIN only)
router.post('/versions/:versionId', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const { articles } = req.body;
    if (!Array.isArray(articles)) {
      return res.status(400).json({ success: false, error: 'Articles must be an array' });
    }

    await prisma.article.deleteMany({ where: { versionId } });

    const createdArticles = await prisma.article.createMany({
      data: articles.map((article: any, index: number) => ({
        versionId,
        articleNumber: article.articleNumber,
        content: article.content,
        status: article.status || 'ACTIVE',
        orderIndex: index
      }))
    });

    return res.json({ success: true, data: createdArticles });
  } catch (error) {
    logger.error('Error bulk creating articles:', error);
    return res.status(500).json({ success: false, error: 'Failed to create articles' });
  }
});

// PUT update single article (ADMIN only)
router.put('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = updateArticleSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ success: false, error: payload.error.issues.map((i) => i.message).join(', ') });
    }

    const { content, articleNumber } = payload.data;

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(content && { content }),
        ...(articleNumber && { articleNumber })
      }
    });

    return res.json({ success: true, article });
  } catch (error) {
    logger.error('Error updating article:', error);
    return res.status(500).json({ success: false, error: 'Failed to update article' });
  }
});

// DELETE single article (ADMIN only)
router.delete('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.article.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting article:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete article' });
  }
});

export default router;

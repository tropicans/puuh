import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { updateJudicialReviewSchema, upsertJudicialReviewImpactSchema } from '../utils/validations';
import { logger } from '../utils/logger';

const router = Router();

// PUT update judicial review case or its impacts (ADMIN only)
router.put('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const impactPayload = upsertJudicialReviewImpactSchema.safeParse(body);
    if (impactPayload.success) {
      const updated = await prisma.judicialReviewCase.update({
        where: { id },
        data: {
          impacts: {
            deleteMany: {},
            create: impactPayload.data.impacts.map((impact: any) => ({
              articleNumber: impact.articleNumber,
              disposition: impact.disposition,
              effectiveDate: impact.effectiveDate ? new Date(impact.effectiveDate) : undefined,
              notes: impact.notes,
              amarExcerpt: impact.amarExcerpt
            }))
          }
        },
        include: {
          impacts: {
            orderBy: { articleNumber: 'asc' }
          }
        }
      });

      return res.json({ success: true, review: updated });
    }

    const payload = updateJudicialReviewSchema.safeParse(body);
    if (!payload.success) {
      return res.status(400).json({
        success: false,
        error: payload.error.issues.map((issue) => issue.message).join(', ')
      });
    }

    const decisionDate = payload.data.decisionDate ? new Date(payload.data.decisionDate) : undefined;
    if (decisionDate && Number.isNaN(decisionDate.getTime())) {
      return res.status(400).json({ success: false, error: 'decisionDate tidak valid' });
    }

    const review = await prisma.judicialReviewCase.update({
      where: { id },
      data: {
        ...(payload.data.forum && { forum: payload.data.forum }),
        ...(payload.data.decisionNumber && { decisionNumber: payload.data.decisionNumber }),
        ...(payload.data.petitionSummary !== undefined && { petitionSummary: payload.data.petitionSummary }),
        ...(payload.data.amarText && { amarText: payload.data.amarText }),
        ...(payload.data.sourceUrl !== undefined && { sourceUrl: payload.data.sourceUrl }),
        ...(payload.data.rawText !== undefined && { rawText: payload.data.rawText }),
        ...(payload.data.outcome && { outcome: payload.data.outcome }),
        ...(decisionDate && { decisionDate })
      },
      include: {
        impacts: {
          orderBy: { articleNumber: 'asc' }
        }
      }
    });

    return res.json({ success: true, review });
  } catch (error) {
    logger.error('Error updating judicial review:', error);
    return res.status(500).json({ success: false, error: 'Failed to update judicial review' });
  }
});

// DELETE judicial review case (ADMIN only)
router.delete('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.judicialReviewCase.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting judicial review:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete judicial review' });
  }
});

export default router;

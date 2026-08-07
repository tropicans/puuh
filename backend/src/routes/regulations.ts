import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { updateRegulationSchema, createJudicialReviewSchema } from '../utils/validations';
import { normalizeArticleNumber, getDefaultForumByRegulationType, inferOutcomeFromAmar, buildImpactsFromAmar } from '../lib/judicial-review';
import { searchJudicialReviews } from '../lib/judicial-review-search';
import { logger } from '../utils/logger';

const router = Router();

// GET all regulations (simple listing)
router.get('/', async (req: Request, res: Response) => {
  try {
    const regulations = await prisma.regulation.findMany({
      include: {
        type: true,
        versions: {
          orderBy: { year: 'asc' },
          include: {
            _count: { select: { articles: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ regulations });
  } catch (error) {
    logger.error('Error fetching regulations:', error);
    return res.status(500).json({ error: 'Failed to fetch regulations' });
  }
});

// GET filtered regulations (search + pagination)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const typeId = req.query.typeId as string | undefined;
    const yearStr = req.query.year as string | undefined;
    const regulationId = req.query.regulationId as string | undefined;
    const page = parseInt(req.query.page as string || '1');
    const pageSize = parseInt(req.query.pageSize as string || '10');
    const skip = (page - 1) * pageSize;

    const year = yearStr ? parseInt(yearStr) : undefined;
    const where: any = {};

    if (typeId && typeId !== 'all') {
      where.typeId = typeId;
    }

    if (q && year) {
      where.versions = {
        some: {
          AND: [
            { year },
            {
              OR: [
                { fullTitle: { contains: q, mode: 'insensitive' } },
                { rawText: { contains: q, mode: 'insensitive' } },
              ],
            },
          ],
        },
      };
    } else if (year) {
      where.versions = {
        some: { year },
      };
    } else if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        {
          versions: {
            some: {
              OR: [
                { fullTitle: { contains: q, mode: 'insensitive' } },
                { rawText: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (regulationId) {
      where.id = regulationId;
    }

    const [regulations, totalCount] = await Promise.all([
      prisma.regulation.findMany({
        where,
        include: {
          type: true,
          versions: {
            orderBy: [
              { year: 'asc' },
              { createdAt: 'asc' }
            ],
            include: {
              articles: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  id: true,
                  articleNumber: true,
                  content: true,
                  status: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.regulation.count({ where }),
    ]);

    return res.json({
      regulations,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    });
  } catch (error) {
    logger.error('Error searching regulations:', error);
    return res.status(500).json({ error: 'Failed to search regulations' });
  }
});

// GET filter options (types & years)
router.get('/filter-options', async (req: Request, res: Response) => {
  try {
    const [types, yearsResult] = await Promise.all([
      prisma.regulationType.findMany({ orderBy: { shortName: 'asc' } }),
      prisma.regulationVersion.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ]);

    return res.json({
      types,
      years: yearsResult.map((y) => y.year),
    });
  } catch (error) {
    logger.error('Error fetching filter options:', error);
    return res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// GET all regulation types
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = await prisma.regulationType.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, data: types });
  } catch (error) {
    logger.error('Error fetching regulation types:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch regulation types' });
  }
});

// POST create regulation type (ADMIN only)
router.post('/types', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, shortName } = req.body;
    if (!name || !shortName) {
      return res.status(400).json({ success: false, error: 'Name and shortName are required' });
    }

    const type = await prisma.regulationType.create({
      data: { name, shortName }
    });
    return res.json({ success: true, data: type });
  } catch (error) {
    logger.error('Error creating regulation type:', error);
    return res.status(500).json({ success: false, error: 'Failed to create regulation type' });
  }
});

// GET single regulation detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const regulation = await prisma.regulation.findUnique({
      where: { id },
      include: {
        type: true,
        versions: {
          orderBy: { year: 'asc' },
          include: {
            articles: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        judicialReviews: {
          include: {
            impacts: {
              orderBy: { articleNumber: 'asc' }
            }
          },
          orderBy: [{ decisionDate: 'desc' }, { createdAt: 'desc' }]
        }
      }
    });

    if (!regulation) {
      return res.status(404).json({ error: 'Regulation not found' });
    }

    return res.json({ regulation });
  } catch (error) {
    logger.error('Error fetching regulation:', error);
    return res.status(500).json({ error: 'Failed to fetch regulation' });
  }
});

// POST create regulation (ADMIN only)
router.post('/', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { title, description, typeId } = req.body;
    if (!title || !typeId) {
      return res.status(400).json({ success: false, error: 'Title and typeId are required' });
    }

    const regulation = await prisma.regulation.create({
      data: { title, description, typeId },
      include: { type: true }
    });

    return res.json({ success: true, data: regulation });
  } catch (error) {
    logger.error('Error creating regulation:', error);
    return res.status(500).json({ success: false, error: 'Failed to create regulation' });
  }
});

// PUT update regulation (ADMIN only)
router.put('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = updateRegulationSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ success: false, error: payload.error.issues.map((i) => i.message).join(', ') });
    }

    const { title, description, typeId } = payload.data;

    const regulation = await prisma.regulation.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(typeId && { typeId })
      },
      include: { type: true }
    });

    return res.json({ success: true, regulation });
  } catch (error) {
    logger.error('Error updating regulation:', error);
    return res.status(500).json({ success: false, error: 'Failed to update regulation' });
  }
});

// DELETE regulation (ADMIN only)
router.delete('/:id', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.regulation.delete({
      where: { id }
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting regulation:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete regulation' });
  }
});

// GET judicial reviews for a regulation
router.get('/:id/judicial-reviews', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviews = await prisma.judicialReviewCase.findMany({
      where: { regulationId: id },
      include: {
        impacts: {
          orderBy: { articleNumber: 'asc' }
        }
      },
      orderBy: [{ decisionDate: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json({ success: true, reviews });
  } catch (error) {
    logger.error('Error fetching judicial reviews:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch judicial reviews' });
  }
});

// POST create judicial review case (ADMIN only)
router.post('/:id/judicial-reviews', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = createJudicialReviewSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ success: false, error: payload.error.issues.map((i) => i.message).join(', ') });
    }

    const regulation = await prisma.regulation.findUnique({
      where: { id },
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
      return res.status(404).json({ success: false, error: 'Regulation not found' });
    }

    const decisionDate = payload.data.decisionDate ? new Date(payload.data.decisionDate) : undefined;
    if (decisionDate && Number.isNaN(decisionDate.getTime())) {
      return res.status(400).json({ success: false, error: 'decisionDate tidak valid' });
    }

    const forum = payload.data.forum || getDefaultForumByRegulationType(regulation.type.shortName);
    const outcome = payload.data.outcome || inferOutcomeFromAmar(payload.data.amarText);
    const autoImpacts = buildImpactsFromAmar(payload.data.amarText, outcome);
    const sourceImpacts: any[] = payload.data.impacts || autoImpacts;

    const articleLookup = new Map<string, string>();
    for (const version of regulation.versions) {
      for (const article of version.articles) {
        const key = normalizeArticleNumber(article.articleNumber);
        if (!articleLookup.has(key)) {
          articleLookup.set(key, article.id);
        }
      }
    }

    const review = await prisma.judicialReviewCase.create({
      data: {
        regulationId: id,
        forum,
        decisionNumber: payload.data.decisionNumber,
        decisionDate,
        petitionSummary: payload.data.petitionSummary,
        amarText: payload.data.amarText,
        sourceUrl: payload.data.sourceUrl,
        rawText: payload.data.rawText,
        outcome,
        impacts: sourceImpacts.length
          ? {
              create: sourceImpacts.map((impact) => {
                const parsedEffectiveDate = impact.effectiveDate ? new Date(impact.effectiveDate) : undefined;
                return {
                  articleNumber: impact.articleNumber,
                  articleId: articleLookup.get(normalizeArticleNumber(impact.articleNumber)),
                  disposition: impact.disposition,
                  effectiveDate: parsedEffectiveDate && !Number.isNaN(parsedEffectiveDate.getTime())
                    ? parsedEffectiveDate
                    : undefined,
                  notes: impact.notes,
                  amarExcerpt: impact.amarExcerpt
                };
              })
            }
          : undefined
      },
      include: {
        impacts: {
          orderBy: { articleNumber: 'asc' }
        }
      }
    });

    return res.status(201).json({ success: true, review });
  } catch (error) {
    logger.error('Error creating judicial review:', error);
    return res.status(500).json({ success: false, error: 'Failed to create judicial review' });
  }
});

// POST sync judicial review (ADMIN only)
router.post('/:id/judicial-reviews/sync', authMiddleware('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const regulation = await prisma.regulation.findUnique({
      where: { id },
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
      return res.status(404).json({ success: false, error: 'Regulation not found' });
    }

    const latestVersion = regulation.versions[0];
    const candidates = await searchJudicialReviews({
      regulationType: regulation.type.shortName,
      regulationTitle: regulation.title,
      number: latestVersion?.number,
      year: latestVersion?.year
    });

    if (!candidates.length) {
      return res.json({
        success: true,
        message: 'Tidak ditemukan kandidat putusan JR dari pencarian otomatis.',
        synced: 0
      });
    }

    const articleLookup = new Map<string, string>();
    for (const version of regulation.versions) {
      for (const article of version.articles) {
        const key = normalizeArticleNumber(article.articleNumber);
        if (!articleLookup.has(key)) {
          articleLookup.set(key, article.id);
        }
      }
    }

    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx: any) => {
      for (const candidate of candidates) {
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
              regulationId: id,
              decisionDate: candidate.decisionDate,
              amarText: candidate.amarText,
              sourceUrl: candidate.sourceUrl,
              rawText: candidate.rawText,
              outcome: candidate.outcome,
              impacts: {
                deleteMany: {},
                create: candidate.impacts.map((impact) => ({
                  articleNumber: impact.articleNumber,
                  articleId: articleLookup.get(normalizeArticleNumber(impact.articleNumber)),
                  disposition: impact.disposition,
                  amarExcerpt: impact.amarExcerpt
                }))
              }
            }
          });
          updatedCount += 1;
        } else {
          await tx.judicialReviewCase.create({
            data: {
              regulationId: id,
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
                  articleId: articleLookup.get(normalizeArticleNumber(impact.articleNumber)),
                  disposition: impact.disposition,
                  amarExcerpt: impact.amarExcerpt
                }))
              }
            }
          });
          createdCount += 1;
        }
      }
    });

    return res.json({
      success: true,
      synced: candidates.length,
      created: createdCount,
      updated: updatedCount
    });
  } catch (error) {
    logger.error('Error syncing judicial reviews:', error);
    return res.status(500).json({ success: false, error: 'Failed to sync judicial reviews' });
  }
});

export default router;

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { normalizeArticleNumber } from '@/lib/judicial-review';
import { searchJudicialReviews } from '@/lib/judicial-review-search';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

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
            return NextResponse.json({ success: false, error: 'Regulation not found' }, { status: 404 });
        }

        const latestVersion = regulation.versions[0];
        const candidates = await searchJudicialReviews({
            regulationType: regulation.type.shortName,
            regulationTitle: regulation.title,
            number: latestVersion?.number,
            year: latestVersion?.year
        });

        if (!candidates.length) {
            return NextResponse.json({
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        return NextResponse.json({
            success: true,
            synced: candidates.length,
            created: createdCount,
            updated: updatedCount
        });
    } catch (error) {
        console.error('Error syncing judicial reviews:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to sync judicial reviews' },
            { status: 500 }
        );
    }
}

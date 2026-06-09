import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { createJudicialReviewSchema } from '@/lib/validations';
import {
    buildImpactsFromAmar,
    getDefaultForumByRegulationType,
    inferOutcomeFromAmar,
    normalizeArticleNumber
} from '@/lib/judicial-review';

type ImpactInput = {
    articleNumber: string;
    disposition: 'INVALIDATED' | 'UPHELD' | 'CONDITIONALLY_VALID' | 'CONDITIONALLY_INVALID' | 'NO_DIRECT_EFFECT';
    effectiveDate?: string;
    notes?: string;
    amarExcerpt?: string;
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const reviews = await prisma.judicialReviewCase.findMany({
            where: { regulationId: id },
            include: {
                impacts: {
                    orderBy: { articleNumber: 'asc' }
                }
            },
            orderBy: [{ decisionDate: 'desc' }, { createdAt: 'desc' }]
        });

        return NextResponse.json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching judicial reviews:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch judicial reviews' },
            { status: 500 }
        );
    }
}

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
        const payload = createJudicialReviewSchema.safeParse(await request.json());
        if (!payload.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: payload.error.issues.map((issue) => issue.message).join(', ')
                },
                { status: 400 }
            );
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
            return NextResponse.json({ success: false, error: 'Regulation not found' }, { status: 404 });
        }

        const decisionDate = payload.data.decisionDate ? new Date(payload.data.decisionDate) : undefined;
        if (decisionDate && Number.isNaN(decisionDate.getTime())) {
            return NextResponse.json({ success: false, error: 'decisionDate tidak valid' }, { status: 400 });
        }

        const forum = payload.data.forum || getDefaultForumByRegulationType(regulation.type.shortName);
        const outcome = payload.data.outcome || inferOutcomeFromAmar(payload.data.amarText);
        const autoImpacts = buildImpactsFromAmar(payload.data.amarText, outcome);
        const sourceImpacts: ImpactInput[] = payload.data.impacts || autoImpacts;
        const incomingImpacts: ImpactInput[] = sourceImpacts.map((impact) => ({
            articleNumber: impact.articleNumber,
            disposition: impact.disposition,
            effectiveDate: impact.effectiveDate,
            notes: impact.notes,
            amarExcerpt: impact.amarExcerpt
        }));

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
                impacts: incomingImpacts.length
                    ? {
                        create: incomingImpacts.map((impact) => {
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

        return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (error) {
        console.error('Error creating judicial review:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create judicial review' },
            { status: 500 }
        );
    }
}

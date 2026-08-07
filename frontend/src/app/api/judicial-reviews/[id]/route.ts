import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { updateJudicialReviewSchema, upsertJudicialReviewImpactSchema } from '@/lib/validations';

export async function PUT(
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
        const body = await request.json();

        const impactPayload = upsertJudicialReviewImpactSchema.safeParse(body);
        if (impactPayload.success) {
            const updated = await prisma.judicialReviewCase.update({
                where: { id },
                data: {
                    impacts: {
                        deleteMany: {},
                        create: impactPayload.data.impacts.map((impact) => ({
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

            return NextResponse.json({ success: true, review: updated });
        }

        const payload = updateJudicialReviewSchema.safeParse(body);
        if (!payload.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: payload.error.issues.map((issue) => issue.message).join(', ')
                },
                { status: 400 }
            );
        }

        const decisionDate = payload.data.decisionDate ? new Date(payload.data.decisionDate) : undefined;
        if (decisionDate && Number.isNaN(decisionDate.getTime())) {
            return NextResponse.json({ success: false, error: 'decisionDate tidak valid' }, { status: 400 });
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

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Error updating judicial review:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update judicial review' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        await prisma.judicialReviewCase.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting judicial review:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete judicial review' },
            { status: 500 }
        );
    }
}

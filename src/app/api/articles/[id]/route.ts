import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { updateArticleSchema } from '@/lib/validations';

// UPDATE article
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
        const payload = updateArticleSchema.safeParse(await request.json());
        if (!payload.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: payload.error.issues.map((issue) => issue.message).join(', ')
                },
                { status: 400 }
            );
        }

        const { content, articleNumber } = payload.data;

        const article = await prisma.article.update({
            where: { id },
            data: {
                ...(content && { content }),
                ...(articleNumber && { articleNumber })
            }
        });

        return NextResponse.json({ success: true, article });
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update article' },
            { status: 500 }
        );
    }
}

// DELETE article
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

        await prisma.article.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete article' },
            { status: 500 }
        );
    }
}

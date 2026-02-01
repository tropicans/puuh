import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// UPDATE article
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { content, articleNumber } = body;

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

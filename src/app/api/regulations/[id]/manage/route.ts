import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// UPDATE regulation
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { title, description, typeId } = body;

        const regulation = await prisma.regulation.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(typeId && { typeId })
            },
            include: { type: true }
        });

        return NextResponse.json({ success: true, regulation });
    } catch (error) {
        console.error('Error updating regulation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update regulation' },
            { status: 500 }
        );
    }
}

// DELETE regulation (and all versions)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.regulation.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting regulation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete regulation' },
            { status: 500 }
        );
    }
}

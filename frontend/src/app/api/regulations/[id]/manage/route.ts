import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { updateRegulationSchema } from '@/lib/validations';

// UPDATE regulation
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
        const payload = updateRegulationSchema.safeParse(await request.json());
        if (!payload.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: payload.error.issues.map((issue) => issue.message).join(', ')
                },
                { status: 400 }
            );
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
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

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

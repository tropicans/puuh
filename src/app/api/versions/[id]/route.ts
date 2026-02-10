import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

// UPDATE regulation version
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

        const { number, year, fullTitle, status, effectiveDate } = body;

        const version = await prisma.regulationVersion.update({
            where: { id },
            data: {
                ...(number && { number }),
                ...(year && { year: parseInt(year) }),
                ...(fullTitle && { fullTitle }),
                ...(status && { status }),
                ...(effectiveDate && { effectiveDate: new Date(effectiveDate) })
            }
        });

        return NextResponse.json({ success: true, version });
    } catch (error) {
        console.error('Error updating version:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update version' },
            { status: 500 }
        );
    }
}

// DELETE regulation version
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

        await prisma.regulationVersion.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting version:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete version' },
            { status: 500 }
        );
    }
}

// GET single version
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

        const version = await prisma.regulationVersion.findUnique({
            where: { id },
            include: {
                regulation: { include: { type: true } },
                articles: { orderBy: { orderIndex: 'asc' } }
            }
        });

        if (!version) {
            return NextResponse.json(
                { success: false, error: 'Version not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, version });
    } catch (error) {
        console.error('Error fetching version:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch version' },
            { status: 500 }
        );
    }
}

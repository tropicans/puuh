import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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
                }
            }
        });

        if (!regulation) {
            return NextResponse.json(
                { error: 'Regulation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ regulation });
    } catch (error) {
        console.error('Error fetching regulation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch regulation' },
            { status: 500 }
        );
    }
}

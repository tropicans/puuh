import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const regulations = await prisma.regulation.findMany({
            include: {
                type: true,
                versions: {
                    orderBy: { year: 'desc' },
                    include: {
                        _count: { select: { articles: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ regulations });
    } catch (error) {
        console.error('Error fetching regulations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch regulations' },
            { status: 500 }
        );
    }
}

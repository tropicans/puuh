import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type RegulationFilters = {
    q?: string;
    typeId?: string;
    year?: number;
    regulationId?: string;
    page?: number;
    pageSize?: number;
};

export async function getFilteredRegulations(filters: RegulationFilters) {
    const { q, typeId, year, regulationId, page = 1, pageSize = 10 } = filters;
    const skip = (page - 1) * pageSize;

    const where: Prisma.RegulationWhereInput = {};

    if (typeId && typeId !== 'all') {
        where.typeId = typeId;
    }

    if (regulationId) {
        where.id = regulationId;
    }

    if (year) {
        where.versions = {
            some: {
                AND: [
                    year ? { year } : {},
                    q
                        ? {
                            OR: [
                                { fullTitle: { contains: q, mode: 'insensitive' } },
                                { rawText: { contains: q, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                ],
            },
        };
    } else if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { versions: { some: { fullTitle: { contains: q, mode: 'insensitive' } } } },
            { versions: { some: { rawText: { contains: q, mode: 'insensitive' } } } }
        ];
    }

    const [regulations, totalCount] = await Promise.all([
        prisma.regulation.findMany({
            where,
            include: {
                type: true,
                versions: {
                    orderBy: { year: 'asc' },
                    include: {
                        articles: {
                            orderBy: { orderIndex: 'asc' },
                            select: {
                                id: true,
                                articleNumber: true,
                                status: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.regulation.count({ where }),
    ]);

    return {
        regulations,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
    };
}

export async function getFilterOptions() {
    const [types, yearsResult] = await Promise.all([
        prisma.regulationType.findMany({ orderBy: { shortName: 'asc' } }),
        prisma.regulationVersion.findMany({
            select: { year: true },
            distinct: ['year'],
            orderBy: { year: 'desc' },
        }),
    ]);

    return {
        types,
        years: yearsResult.map((y) => y.year),
    };
}

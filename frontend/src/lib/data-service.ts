import prisma from '@/lib/prisma';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (typeId && typeId !== 'all') {
        where.typeId = typeId;
    }

    if (q && year) {
        where.versions = {
            some: {
                AND: [
                    { year },
                    {
                        OR: [
                            { fullTitle: { contains: q, mode: 'insensitive' } },
                            { rawText: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
        };
    } else if (year) {
        where.versions = {
            some: { year },
        };
    } else if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            {
                versions: {
                    some: {
                        OR: [
                            { fullTitle: { contains: q, mode: 'insensitive' } },
                            { rawText: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                },
            },
        ];
    }

    if (regulationId) {
        where.id = regulationId;
    }

    const [regulations, totalCount] = await Promise.all([
        prisma.regulation.findMany({
            where,
            include: {
                type: true,
                versions: {
                    orderBy: [
                        { year: 'asc' },
                        { createdAt: 'asc' }
                    ],
                    include: {
                        articles: {
                            orderBy: { orderIndex: 'asc' },
                            select: {
                                id: true,
                                articleNumber: true,
                                content: true,
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
        years: yearsResult.map((y: { year: number }) => y.year),
    };
}

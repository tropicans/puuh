// Canonical types for UI components
// Re-export Prisma types where possible, define UI-specific interfaces here

import type { Prisma } from '@prisma/client';

export type Regulation = Prisma.RegulationGetPayload<{
    include: { type: true; versions: { include: { _count: { select: { articles: true } } } } }
}>;

export type RegulationVersion = Prisma.RegulationVersionGetPayload<{
    include: { regulation: { include: { type: true } }; articles: { include: { changes: true } } }
}>;

export interface VersionWithArticles {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    effectiveDate: Date | null;
    status: string;
    rawText: string | null;
    originalFileUrl: string | null;
    amendsId: string | null;
    articles: ArticleWithStatus[];
}

export interface ArticleWithStatus {
    id: string;
    articleNumber: string;
    content: string;
    status: string;
    orderIndex: number;
}

export interface RegulationListItem {
    id: string;
    title: string;
    description: string | null;
    type: { id: string; shortName: string; name: string };
    _count: { versions: number };
    versions: Array<{
        id: string;
        number: string;
        year: number;
        fullTitle: string;
        status: string;
        effectiveDate: Date | null;
        articles: ArticleWithStatus[];
    }>;
    createdAt: Date;
}

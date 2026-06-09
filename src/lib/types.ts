// Canonical types for UI components
// Define UI-specific interfaces here (Prisma v7 doesn't export Prisma namespace)

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

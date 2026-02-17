export function transformRegulation(reg: {
    id: string;
    title: string;
    description: string | null;
    type: { name: string; shortName: string };
    versions: Array<{
        id: string;
        number: string;
        year: number;
        fullTitle: string;
        status: string;
        effectiveDate: Date | null;
        pdfPath: string | null;
        articles: Array<{
            id: string;
            articleNumber: string;
            content: string;
            status: string;
        }>;
    }>;
}) {
    return {
        id: reg.id,
        title: reg.title,
        type: reg.type.shortName,
        description: reg.description || '',
        versions: reg.versions.map(v => ({
            id: v.id,
            number: v.number,
            year: v.year,
            fullTitle: v.fullTitle,
            status: v.status.toLowerCase() as 'active' | 'amended' | 'revoked',
            effectiveDate: v.effectiveDate?.toISOString() || '',
            pdfPath: v.pdfPath || undefined,
            articles: v.articles.map(a => ({
                id: a.id,
                number: a.articleNumber,
                content: a.content,
                status: a.status.toLowerCase() as 'active' | 'modified' | 'deleted' | 'new'
            }))
        }))
    };
}

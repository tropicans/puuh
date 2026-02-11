import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseArticlesFromText } from '@/lib/ai-service';
import { cleanPdfText } from '@/lib/utils';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

// Re-parse articles from stored rawText
export async function POST(
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

        // Get version with rawText
        const version = await prisma.regulationVersion.findUnique({
            where: { id },
            include: {
                articles: true
            }
        });

        if (!version) {
            return NextResponse.json(
                { success: false, error: 'Version not found' },
                { status: 404 }
            );
        }

        if (!version.rawText || version.rawText.length < 100) {
            return NextResponse.json(
                { success: false, error: 'No raw text stored for this version' },
                { status: 400 }
            );
        }

        console.log(`Re-parsing version ${id}, rawText length: ${version.rawText.length}`);

        // Parse with AI
        let parsedArticles: { number: string; content: string }[] = [];
        try {
            // Clean text first
            const cleanedText = cleanPdfText(version.rawText);
            parsedArticles = await parseArticlesFromText(cleanedText);
            console.log(`AI parsed ${parsedArticles.length} articles (from cleaned text)`);
        } catch (e) {
            console.error('AI parsing error:', e);
            return NextResponse.json({
                success: false,
                error: 'AI parsing failed: ' + (e instanceof Error ? e.message : 'Unknown error')
            }, { status: 500 });
        }

        // Deduplicate articles merging content if number exists
        const uniqueArticlesMap = new Map<string, { number: string; content: string }>();

        parsedArticles.forEach(article => {
            // Normalize article number (trim)
            const key = article.number.trim();
            if (uniqueArticlesMap.has(key)) {
                // Merge content with existing
                const existing = uniqueArticlesMap.get(key)!;
                existing.content += '\n\n' + article.content;
            } else {
                uniqueArticlesMap.set(key, { ...article, number: key });
            }
        });

        const uniqueArticles = Array.from(uniqueArticlesMap.values());

        if (uniqueArticles.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Re-parse tidak menghasilkan pasal. Pasal lama dipertahankan.'
            }, { status: 422 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.article.deleteMany({ where: { versionId: id } });
            await tx.article.createMany({
                data: uniqueArticles.map((article, index) => ({
                    versionId: id,
                    articleNumber: article.number,
                    content: article.content,
                    status: 'ACTIVE' as const,
                    orderIndex: index
                }))
            });
        });

        return NextResponse.json({
            success: true,
            message: `Berhasil mengekstrak ${uniqueArticles.length} pasal`,
            articlesCount: uniqueArticles.length
        });

    } catch (error) {
        console.error('Re-parse error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to re-parse'
        }, { status: 500 });
    }
}

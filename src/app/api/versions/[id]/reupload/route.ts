import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseArticlesFromText } from '@/lib/ai-service';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

// Re-upload PDF file to update rawText and re-parse articles
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
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Check if version exists
        const version = await prisma.regulationVersion.findUnique({
            where: { id },
            include: { articles: true }
        });

        if (!version) {
            return NextResponse.json(
                { success: false, error: 'Version not found' },
                { status: 404 }
            );
        }

        // Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let rawText = '';
        let numPages = 0;
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(buffer);
            rawText = pdfData.text || '';
            numPages = pdfData.numpages || 0;
            console.log(`PDF re-uploaded: ${rawText.length} chars, ${numPages} pages`);
        } catch (e) {
            console.error('Error parsing PDF:', e);
            return NextResponse.json({
                success: false,
                error: 'Gagal membaca PDF. Pastikan file tidak corrupt.'
            }, { status: 400 });
        }

        if (!rawText || rawText.trim().length < 100) {
            return NextResponse.json({
                success: false,
                error: 'Tidak dapat membaca teks dari PDF. Mungkin hasil scan?'
            }, { status: 400 });
        }

        // Parse with AI
        let parsedArticles: { number: string; content: string }[] = [];
        try {
            console.log('Parsing articles with AI...');
            parsedArticles = await parseArticlesFromText(rawText);
            console.log(`AI parsed ${parsedArticles.length} articles`);
        } catch (e) {
            console.error('AI parsing error:', e);
            return NextResponse.json({
                success: false,
                error: 'AI parsing gagal. Data lama dipertahankan.'
            }, { status: 500 });
        }

        // Deduplicate by article number before replacing existing records
        const dedupedMap = new Map<string, { number: string; content: string }>();
        for (const article of parsedArticles) {
            const key = article.number.trim();
            if (!key) continue;
            if (!dedupedMap.has(key)) {
                dedupedMap.set(key, { number: key, content: article.content });
            }
        }
        const uniqueArticles = Array.from(dedupedMap.values());

        if (uniqueArticles.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Re-upload tidak menghasilkan pasal. Data lama dipertahankan.'
            }, { status: 422 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.regulationVersion.update({
                where: { id },
                data: { rawText: rawText.substring(0, 100000) }
            });

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
            message: `PDF berhasil diupload ulang. Ditemukan ${uniqueArticles.length} pasal.`,
            textLength: rawText.length,
            numPages,
            articlesCount: uniqueArticles.length
        });

    } catch (error) {
        console.error('Re-upload error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to re-upload'
        }, { status: 500 });
    }
}

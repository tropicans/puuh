import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseArticlesFromText } from '@/lib/ai-service';

// Re-upload PDF file to update rawText and re-parse articles
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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

        // Update rawText in database
        await prisma.regulationVersion.update({
            where: { id },
            data: { rawText: rawText.substring(0, 100000) }
        });

        // Delete old articles
        if (version.articles.length > 0) {
            await prisma.article.deleteMany({
                where: { versionId: id }
            });
            console.log(`Deleted ${version.articles.length} old articles`);
        }

        // Parse with AI
        let parsedArticles: { number: string; content: string }[] = [];
        try {
            console.log('Parsing articles with AI...');
            parsedArticles = await parseArticlesFromText(rawText);
            console.log(`AI parsed ${parsedArticles.length} articles`);
        } catch (e) {
            console.error('AI parsing error:', e);
        }

        // Save new articles
        if (parsedArticles.length > 0) {
            await prisma.article.createMany({
                data: parsedArticles.map((article, index) => ({
                    versionId: id,
                    articleNumber: article.number,
                    content: article.content,
                    status: 'ACTIVE' as const,
                    orderIndex: index
                }))
            });
        }

        return NextResponse.json({
            success: true,
            message: `PDF berhasil diupload ulang. Ditemukan ${parsedArticles.length} pasal.`,
            textLength: rawText.length,
            numPages,
            articlesCount: parsedArticles.length
        });

    } catch (error) {
        console.error('Re-upload error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to re-upload'
        }, { status: 500 });
    }
}

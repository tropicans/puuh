import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import rateLimit from '@/lib/rate-limit';
import { uploadSchema } from '@/lib/validations';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

// Initialize rate limiter: 10 requests per minute
const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Rate Limiting Check
        const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
        try {
            await limiter.check(NextResponse, 10, ip); // 10 requests per minute
        } catch {
            return NextResponse.json(
                { success: false, message: 'Rate limit exceeded. Coba lagi nanti.' },
                { status: 429 }
            );
        }

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch (formDataError) {
            const message = formDataError instanceof Error ? formDataError.message : 'Gagal membaca form data upload.';
            const normalizedMessage = message.toLowerCase();
            const isBodyTooLarge =
                normalizedMessage.includes('too large') ||
                normalizedMessage.includes('payload too large') ||
                normalizedMessage.includes('request entity too large') ||
                normalizedMessage.includes('content length') ||
                normalizedMessage.includes('size limit') ||
                normalizedMessage.includes('file too large');

            return NextResponse.json(
                {
                    success: false,
                    message: isBodyTooLarge
                        ? 'Ukuran request terlalu besar. Maksimum upload 20MB per file.'
                        : 'Format upload tidak valid. Coba upload ulang file PDF.'
                },
                { status: isBodyTooLarge ? 413 : 400 }
            );
        }

        const file = formData.get('file') as File | null;

        // Zod Validation
        const result = uploadSchema.safeParse({
            regulationType: formData.get('regulationType'),
            number: formData.get('number'),
            year: formData.get('year'),
            title: formData.get('title') || undefined,
            existingRegulationId: formData.get('existingRegulationId') || undefined,
        });

        if (!result.success) {
            const errorMsg = result.error.issues.map((e) => e.message).join(', ');
            return NextResponse.json(
                { success: false, message: `Validation Error: ${errorMsg}` },
                { status: 400 }
            );
        }

        if (!file) {
            return NextResponse.json(
                { success: false, message: `File harus diupload.` },
                { status: 400 }
            );
        }

        const { regulationType, number, year } = result.data;
        let title = result.data.title;
        const existingRegulationId = result.data.existingRegulationId;

        // Auto-generate title if not provided
        if (!title) {
            title = `${regulationType} Nomor ${number} Tahun ${year}`;
        }

        // File size check
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileSizeMB = buffer.length / (1024 * 1024);
        const MAX_SIZE_MB = 20;

        if (fileSizeMB > MAX_SIZE_MB) {
            return NextResponse.json({
                success: false,
                message: `File terlalu besar (${fileSizeMB.toFixed(1)}MB). Maksimum ${MAX_SIZE_MB}MB.`
            }, { status: 400 });
        }

        console.log(`Starting stream processing for: ${file.name}`);

        // Create stream for progress updates
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: unknown) => {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                };

                try {
                    send({ type: 'progress', message: 'Mulai memproses PDF...' });

                    // Extract text using smart fallback chain
                    let rawText = '';
                    let extractionMethod = '';

                    try {
                        const { smartExtractPdfText } = await import('@/lib/pdf-service');

                        const onProgress = (msg: string) => {
                            send({ type: 'progress', message: msg });
                        };

                        const result = await smartExtractPdfText(buffer, onProgress);
                        rawText = result.text;
                        extractionMethod = result.method;
                    } catch (extractError) {
                        console.error('Extraction failed:', extractError);
                    }

                    if (!rawText || rawText.trim().length < 100) {
                        send({
                            type: 'error',
                            message: `Gagal membaca teks (hanya ${rawText?.length || 0} karakter). PDF mungkin terproteksi atau gambar buram.`
                        });
                        controller.close();
                        return;
                    }

                    send({ type: 'progress', message: `Teks terekstrak (${extractionMethod}): ${rawText.length} karakter. Identifikasi pasal...` });

                    // Database operations
                    // Get or create regulation type
                    let regType = await prisma.regulationType.findFirst({
                        where: { shortName: regulationType }
                    });

                    if (!regType) {
                        const typeNames: Record<string, string> = {
                            'UU': 'Undang-Undang',
                            'PP': 'Peraturan Pemerintah',
                            'Perpres': 'Peraturan Presiden',
                            'Permen': 'Peraturan Menteri',
                            'Perda': 'Peraturan Daerah'
                        };
                        regType = await prisma.regulationType.create({
                            data: {
                                shortName: regulationType,
                                name: typeNames[regulationType] || regulationType
                            }
                        });
                    }

                    // Get or create regulation
                    let regulation;
                    if (existingRegulationId) {
                        regulation = await prisma.regulation.findUnique({ where: { id: existingRegulationId } });
                    }

                    if (!regulation) {
                        regulation = await prisma.regulation.findFirst({
                            where: {
                                title: { contains: title, mode: 'insensitive' },
                                typeId: regType.id
                            }
                        });
                    }

                    if (!regulation) {
                        regulation = await prisma.regulation.create({
                            data: {
                                title,
                                description: `${regulationType} tentang ${title}`,
                                typeId: regType.id
                            }
                        });
                    }

                    // Check for existing version
                    const existingVersion = await prisma.regulationVersion.findFirst({
                        where: {
                            regulationId: regulation.id,
                            number,
                            year: parseInt(year)
                        }
                    });

                    if (existingVersion) {
                        send({
                            type: 'error',
                            message: `${regulationType} No. ${number} Tahun ${year} sudah ada dalam sistem`
                        });
                        controller.close();
                        return;
                    }

                    // Handle previous version
                    const previousVersion = await prisma.regulationVersion.findFirst({
                        where: {
                            regulationId: regulation.id,
                            status: 'ACTIVE'
                        },
                        orderBy: { year: 'desc' }
                    });

                    if (previousVersion) {
                        await prisma.regulationVersion.update({
                            where: { id: previousVersion.id },
                            data: { status: 'AMENDED' }
                        });
                    }

                    // Upload to MinIO
                    let originalFileUrl = null;
                    try {
                        const { storage } = await import('@/lib/storage');
                        const filename = `regulations/${year}/${regulationType.replace(/\s+/g, '_')}_${number}_${Date.now()}.pdf`;
                        console.log(`Uploading to MinIO: ${filename}`);
                        originalFileUrl = await storage.uploadFile(filename, buffer, 'application/pdf');
                        send({ type: 'progress', message: 'File PDF berhasil diupload ke MinIO Storage.' });
                    } catch (uploadErr) {
                        console.error('MinIO upload failed:', uploadErr);
                        send({ type: 'progress', message: '⚠️ Gagal upload ke MinIO (lanjut parsing text saja).' });
                    }

                    // Create new version
                    const fullTitle = `${regulationType} Nomor ${number} Tahun ${year} tentang ${title}`;
                    const version = await prisma.regulationVersion.create({
                        data: {
                            regulationId: regulation.id,
                            number,
                            year: parseInt(year),
                            fullTitle,
                            rawText: rawText.substring(0, 100000),
                            status: 'ACTIVE',
                            amendsId: previousVersion?.id,
                            originalFileUrl: originalFileUrl // Store MinIO URL
                        }
                    });

                    // Parse articles
                    send({ type: 'progress', message: 'Menggunakan AI/Regex untuk menstrukturkan pasal...' });
                    let parsedArticles: { number: string; content: string }[] = [];
                    try {
                        const { parseArticlesFromText } = await import('@/lib/ai-service');
                        parsedArticles = await parseArticlesFromText(rawText);
                    } catch (e) {
                        console.error('Parsing error:', e);
                    }

                    // Save articles
                    if (parsedArticles.length > 0) {
                        send({ type: 'progress', message: `Menyimpan ${parsedArticles.length} pasal ke database...` });

                        // Deduplicate
                        const seenNumbers = new Set();
                        const uniqueArticles = parsedArticles.filter(a => {
                            if (seenNumbers.has(a.number)) return false;
                            seenNumbers.add(a.number);
                            return true;
                        });

                        await prisma.article.createMany({
                            data: uniqueArticles.map((article, index) => ({
                                versionId: version.id,
                                articleNumber: article.number,
                                content: article.content,
                                status: 'ACTIVE',
                                orderIndex: index
                            }))
                        });
                    }

                    // Success response
                    send({
                        type: 'success',
                        data: {
                            success: true,
                            message: `${fullTitle} berhasil diupload`,
                            regulationId: regulation.id,
                            versionId: version.id,
                            parsedArticles: parsedArticles.length,
                            textLength: rawText.length
                        }
                    });
                    controller.close();

                } catch (error) {
                    console.error('Stream processing error:', error);
                    send({
                        type: 'error',
                        message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
                    });
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Upload init error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menginisialisasi upload'
        }, { status: 500 });
    }
}

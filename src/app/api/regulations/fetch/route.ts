import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchRegulation, parseRegulationInput } from '@/lib/regulation-fetcher';
import { parseArticlesFromText } from '@/lib/ai-service';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (type: string, data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(JSON.stringify({ type, ...data }) + '\n'));
            };

            const sendProgress = (message: string) => {
                send('progress', { message });
            };

            try {
                // Auth check
                const user = await getCurrentUser();
                if (!user) {
                    send('error', { message: 'Unauthorized' });
                    controller.close();
                    return;
                }
                if (!isAdminRole(user.role)) {
                    send('error', { message: 'Forbidden' });
                    controller.close();
                    return;
                }

                const body = await request.json();
                const { type, number, year, title, query, existingRegulationId } = body;

                // If query provided, parse it first
                let regInfo = { type, number, year: parseInt(year) };

                if (query && !type) {
                    sendProgress('Memahami input pencarian...');
                    const parsed = await parseRegulationInput(query);
                    if (!parsed) {
                        send('error', { message: 'Tidak dapat memahami input. Format: "Perpres 82 2018"' });
                        controller.close();
                        return;
                    }
                    regInfo = parsed;
                    sendProgress(`Dipahami: ${parsed.type} No. ${parsed.number} Tahun ${parsed.year}`);
                }

                if (!regInfo.type || !regInfo.number || !regInfo.year) {
                    send('error', { message: 'Perlu jenis peraturan, nomor, dan tahun' });
                    controller.close();
                    return;
                }

                // Fetch regulation from internet with progress streaming
                const fetchResult = await fetchRegulation(regInfo, sendProgress);

                if (!fetchResult.success || !fetchResult.rawText) {
                    send('error', { message: fetchResult.error || 'Gagal mengambil dokumen' });
                    controller.close();
                    return;
                }

                sendProgress('Menyimpan ke database...');

                // Get or create regulation type
                let regType = await prisma.regulationType.findFirst({
                    where: { shortName: regInfo.type }
                });

                if (!regType) {
                    const typeNames: Record<string, string> = {
                        'UU': 'Undang-Undang',
                        'PP': 'Peraturan Pemerintah',
                        'Perpres': 'Peraturan Presiden',
                        'Permen': 'Peraturan Menteri',
                        'Perda': 'Peraturan Daerah',
                        'Permendagri': 'Peraturan Menteri Dalam Negeri',
                        'Permenkes': 'Peraturan Menteri Kesehatan',
                        'Kepres': 'Keputusan Presiden',
                        'Inpres': 'Instruksi Presiden',
                    };
                    regType = await prisma.regulationType.create({
                        data: {
                            shortName: regInfo.type,
                            name: typeNames[regInfo.type] || regInfo.type
                        }
                    });
                }

                // Create or find regulation group
                const regTitle = title || fetchResult.title || `${regInfo.type} ${regInfo.number}/${regInfo.year}`;
                let regulation;

                if (existingRegulationId) {
                    // Adding version to existing regulation
                    regulation = await prisma.regulation.findUnique({
                        where: { id: existingRegulationId }
                    });
                    if (!regulation) {
                        send('error', { message: 'Regulasi tidak ditemukan' });
                        controller.close();
                        return;
                    }
                } else {
                    regulation = await prisma.regulation.findFirst({
                        where: {
                            typeId: regType.id,
                            versions: {
                                some: {
                                    number: regInfo.number,
                                    year: regInfo.year
                                }
                            }
                        }
                    });

                    if (!regulation) {
                        regulation = await prisma.regulation.create({
                            data: {
                                title: regTitle,
                                description: `${regInfo.type} tentang ${regTitle}`,
                                typeId: regType.id
                            }
                        });
                    }
                }

                // Check existing version
                const existingVersion = await prisma.regulationVersion.findFirst({
                    where: {
                        regulationId: regulation.id,
                        number: regInfo.number,
                        year: regInfo.year
                    }
                });

                if (existingVersion) {
                    send('error', { message: `${regInfo.type} No. ${regInfo.number} Tahun ${regInfo.year} sudah ada` });
                    controller.close();
                    return;
                }

                // Create version
                const fullTitle = `${regInfo.type} Nomor ${regInfo.number} Tahun ${regInfo.year}`;
                sendProgress(`Menyimpan: ${fullTitle}...`);

                const version = await prisma.regulationVersion.create({
                    data: {
                        regulationId: regulation.id,
                        number: regInfo.number,
                        year: regInfo.year,
                        fullTitle,
                        rawText: fetchResult.rawText.substring(0, 100000),
                        status: 'ACTIVE'
                    }
                });

                // Parse articles with AI
                let articlesCount = 0;
                try {
                    sendProgress('AI sedang mengekstrak pasal-pasal...');
                    const articles = await parseArticlesFromText(fetchResult.rawText);
                    sendProgress(`AI menemukan ${articles.length} pasal, menyimpan...`);

                    if (articles.length > 0) {
                        await prisma.article.createMany({
                            data: articles.map((article, index) => ({
                                versionId: version.id,
                                articleNumber: article.number,
                                content: article.content,
                                status: 'ACTIVE' as const,
                                orderIndex: index
                            }))
                        });
                        articlesCount = articles.length;
                    }
                } catch (e) {
                    console.error('AI parsing error:', e);
                    sendProgress('Peringatan: gagal parsing pasal dengan AI');
                }

                send('success', {
                    data: {
                        message: `${fullTitle} berhasil ditambahkan`,
                        regulationId: regulation.id,
                        versionId: version.id,
                        sourceUrl: fetchResult.sourceUrl,
                        numPages: fetchResult.numPages,
                        parsedArticles: articlesCount
                    }
                });

            } catch (error) {
                console.error('Fetch error:', error);
                send('error', { message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
            }

            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });
}

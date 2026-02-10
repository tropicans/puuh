import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchRegulation, parseRegulationInput } from '@/lib/regulation-fetcher';
import { parseArticlesFromText } from '@/lib/ai-service';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { type, number, year, title, query } = body;

        // If query provided, parse it first
        let regInfo = { type, number, year: parseInt(year) };

        if (query && !type) {
            const parsed = await parseRegulationInput(query);
            if (!parsed) {
                return NextResponse.json({
                    success: false,
                    message: 'Tidak dapat memahami input. Format: "Perpres 82 2018"'
                }, { status: 400 });
            }
            regInfo = parsed;
        }

        if (!regInfo.type || !regInfo.number || !regInfo.year) {
            return NextResponse.json({
                success: false,
                message: 'Perlu jenis peraturan, nomor, dan tahun'
            }, { status: 400 });
        }

        // Fetch regulation from internet
        console.log(`Fetching: ${regInfo.type} No. ${regInfo.number} Tahun ${regInfo.year}`);
        const fetchResult = await fetchRegulation(regInfo);

        if (!fetchResult.success || !fetchResult.rawText) {
            return NextResponse.json({
                success: false,
                message: fetchResult.error || 'Gagal mengambil dokumen'
            }, { status: 404 });
        }

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
                'Perda': 'Peraturan Daerah'
            };
            regType = await prisma.regulationType.create({
                data: {
                    shortName: regInfo.type,
                    name: typeNames[regInfo.type] || regInfo.type
                }
            });
        }

        // Create or find regulation group
        const regTitle = title || `${regInfo.type} ${regInfo.number}/${regInfo.year}`;
        let regulation = await prisma.regulation.findFirst({
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

        // Check existing version
        const existingVersion = await prisma.regulationVersion.findFirst({
            where: {
                regulationId: regulation.id,
                number: regInfo.number,
                year: regInfo.year
            }
        });

        if (existingVersion) {
            return NextResponse.json({
                success: false,
                message: `${regInfo.type} No. ${regInfo.number} Tahun ${regInfo.year} sudah ada`
            }, { status: 400 });
        }

        // Create version
        const fullTitle = `${regInfo.type} Nomor ${regInfo.number} Tahun ${regInfo.year}`;
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
            console.log('Parsing articles with AI...');
            const articles = await parseArticlesFromText(fetchResult.rawText);
            console.log(`Parsed ${articles.length} articles`);

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
        }

        return NextResponse.json({
            success: true,
            message: `${fullTitle} berhasil ditambahkan`,
            regulationId: regulation.id,
            versionId: version.id,
            sourceUrl: fetchResult.sourceUrl,
            numPages: fetchResult.numPages,
            articlesCount
        });

    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Terjadi kesalahan'
        }, { status: 500 });
    }
}

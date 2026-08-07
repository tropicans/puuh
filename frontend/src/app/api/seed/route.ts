import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function POST(request: NextRequest) {
    const userCount = await prisma.user.count();
    const bootstrapToken = process.env.BOOTSTRAP_SEED_TOKEN;

    // Bootstrap mode: no users yet. Require one-time bootstrap token.
    if (userCount === 0) {
        if (!bootstrapToken) {
            return NextResponse.json(
                { success: false, error: 'Bootstrap disabled. Set BOOTSTRAP_SEED_TOKEN to initialize the first admin user.' },
                { status: 503 }
            );
        }

        const requestToken = request.headers.get('x-bootstrap-token') ?? '';
        if (!requestToken) {
            return NextResponse.json(
                { success: false, error: 'Missing bootstrap token. Send header: x-bootstrap-token.' },
                { status: 401 }
            );
        }

        if (requestToken !== bootstrapToken) {
            return NextResponse.json({ success: false, error: 'Invalid bootstrap token' }, { status: 403 });
        }

        // In bootstrap mode, directly create admin user (bypass Server Action guards)
        const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
        const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

        if (!bootstrapEmail || !bootstrapPassword) {
            return NextResponse.json(
                { success: false, error: 'Missing BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD' },
                { status: 500 }
            );
        }

        try {
            const hashedPassword = await hash(bootstrapPassword, 12);
            await prisma.user.create({
                data: {
                    email: bootstrapEmail,
                    password: hashedPassword,
                    name: 'Administrator',
                    role: 'ADMIN',
                },
            });

            // Seed sample regulation data
            await seedSampleData();

            return NextResponse.json({
                success: true,
                message: `Created bootstrap admin (${bootstrapEmail}) with sample data.`
            });
        } catch (err) {
            return NextResponse.json({
                success: false,
                error: err instanceof Error ? err.message : 'Bootstrap failed'
            }, { status: 500 });
        }
    }

    // Normal mode: only ADMIN can trigger seeding.
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminRole(user.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    try {
        await seedSampleData();
        return NextResponse.json({ success: true, message: 'Sample data seeded.' });
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : 'Seed failed'
        }, { status: 500 });
    }
}

async function seedSampleData() {
    const existingTypes = await prisma.regulationType.count();
    if (existingTypes > 0) return;

    const perpres = await prisma.regulationType.create({
        data: { name: 'Peraturan Presiden', shortName: 'Perpres' }
    });

    await prisma.regulationType.createMany({
        data: [
            { name: 'Peraturan Pemerintah', shortName: 'PP' },
            { name: 'Undang-Undang', shortName: 'UU' },
            { name: 'Peraturan Menteri', shortName: 'Permen' },
            { name: 'Peraturan Daerah', shortName: 'Perda' },
        ]
    });

    const jkn = await prisma.regulation.create({
        data: {
            title: 'Jaminan Kesehatan',
            description: 'Peraturan Presiden tentang Jaminan Kesehatan Nasional',
            typeId: perpres.id
        }
    });

    const v2018 = await prisma.regulationVersion.create({
        data: {
            regulationId: jkn.id,
            number: '82',
            year: 2018,
            fullTitle: 'Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
            effectiveDate: new Date('2018-09-17'),
            status: 'ACTIVE'
        }
    });

    await prisma.article.createMany({
        data: [
            { versionId: v2018.id, articleNumber: 'Pasal 1', content: 'Ketentuan umum JKN...', status: 'ACTIVE', orderIndex: 0 },
            { versionId: v2018.id, articleNumber: 'Pasal 2', content: 'Prinsip JKN...', status: 'ACTIVE', orderIndex: 1 },
            { versionId: v2018.id, articleNumber: 'Pasal 3', content: 'Peserta JKN...', status: 'ACTIVE', orderIndex: 2 },
        ]
    });
}

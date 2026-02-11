import { NextRequest, NextResponse } from 'next/server';
import { seedInitialData } from '@/actions/regulations';
import { seedAdminUser } from '@/actions/users';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function POST(request: NextRequest) {
    const userCount = await prisma.user.count();
    const bootstrapToken = process.env.BOOTSTRAP_SEED_TOKEN;

    // Bootstrap mode: no users yet. Require one-time bootstrap token.
    if (userCount === 0) {
        if (!bootstrapToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Bootstrap disabled. Set BOOTSTRAP_SEED_TOKEN to initialize the first admin user.'
                },
                { status: 503 }
            );
        }

        const requestToken = request.headers.get('x-bootstrap-token') ?? '';

        if (!requestToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing bootstrap token. Send header: x-bootstrap-token.'
                },
                { status: 401 }
            );
        }

        if (requestToken !== bootstrapToken) {
            return NextResponse.json({ success: false, error: 'Invalid bootstrap token' }, { status: 403 });
        }
    }

    // Normal mode: only ADMIN can trigger seeding.
    if (userCount > 0) {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
    }

    let userResult: { success: boolean; message?: string; error?: string } = {
        success: true,
        message: 'Skipped'
    };

    // In bootstrap mode, create admin first to avoid seeded data without an owner.
    if (userCount === 0) {
        userResult = await seedAdminUser();
        if (!userResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: userResult.error || 'Failed to create bootstrap admin user',
                    users: userResult
                },
                { status: 500 }
            );
        }
    }

    // Seed regulation data
    const regResult = await seedInitialData();

    return NextResponse.json({
        success: regResult.success && userResult.success,
        message: `Regulations: ${regResult.message || regResult.error}. Users: ${userResult.message || userResult.error}`,
        regulations: regResult,
        users: userResult
    });
}

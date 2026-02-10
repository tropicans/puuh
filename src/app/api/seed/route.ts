import { NextResponse } from 'next/server';
import { seedInitialData } from '@/actions/regulations';
import { seedAdminUser } from '@/actions/users';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

export async function POST() {
    const userCount = await prisma.user.count();

    // Allow bootstrap when there are no users yet.
    // After bootstrap, only ADMIN can trigger seeding.
    if (userCount > 0) {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdminRole(user.role)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
    }

    // Seed regulation data
    const regResult = await seedInitialData();

    // Seed users
    const userResult = await seedAdminUser();

    return NextResponse.json({
        success: regResult.success && userResult.success,
        message: `Regulations: ${regResult.message || regResult.error}. Users: ${userResult.message || userResult.error}`,
        regulations: regResult,
        users: userResult
    });
}

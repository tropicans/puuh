import { NextResponse } from 'next/server';
import { seedInitialData } from '@/actions/regulations';
import { seedAdminUser } from '@/actions/users';

export async function POST() {
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

'use server';

import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

interface SeedUserResult {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Seeds a default admin user if no users exist in the database.
 * Password: admin123
 */
export async function seedAdminUser(): Promise<SeedUserResult> {
    try {
        // Check if any users exist
        const existingUsers = await prisma.user.count();

        if (existingUsers > 0) {
            return {
                success: true,
                message: `Already have ${existingUsers} user(s) in database`
            };
        }

        // Hash the password
        const hashedPassword = await hash('admin123', 12);

        // Create admin user
        await prisma.user.create({
            data: {
                email: 'admin@puu.local',
                password: hashedPassword,
                name: 'Administrator',
                role: 'ADMIN',
            },
        });

        // Also create a viewer user for testing
        const viewerPassword = await hash('viewer123', 12);
        await prisma.user.create({
            data: {
                email: 'viewer@puu.local',
                password: viewerPassword,
                name: 'Viewer',
                role: 'VIEWER',
            },
        });

        return {
            success: true,
            message: 'Created admin and viewer users'
        };
    } catch (error) {
        console.error('Error seeding users:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to seed users'
        };
    }
}

/**
 * Get all users (admin only - for user management)
 */
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data: users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

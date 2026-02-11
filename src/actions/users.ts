'use server';

import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

const MIN_BOOTSTRAP_PASSWORD_LENGTH = 12;

interface SeedUserResult {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Seeds a bootstrap admin user if no users exist in the database.
 * Requires BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.
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

        const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
        const bootstrapAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

        if (!bootstrapAdminEmail || !bootstrapAdminPassword) {
            return {
                success: false,
                error: 'Bootstrap admin credentials not configured (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD).'
            };
        }

        if (bootstrapAdminPassword.length < MIN_BOOTSTRAP_PASSWORD_LENGTH) {
            return {
                success: false,
                error: `BOOTSTRAP_ADMIN_PASSWORD minimal ${MIN_BOOTSTRAP_PASSWORD_LENGTH} karakter.`
            };
        }

        // Hash the password
        const hashedPassword = await hash(bootstrapAdminPassword, 12);

        // Create admin user
        await prisma.user.create({
            data: {
                email: bootstrapAdminEmail,
                password: hashedPassword,
                name: 'Administrator',
                role: 'ADMIN',
            },
        });

        return {
            success: true,
            message: `Created bootstrap admin user (${bootstrapAdminEmail})`
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

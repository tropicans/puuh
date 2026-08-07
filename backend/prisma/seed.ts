import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

console.log('DEBUG [seed.ts] DATABASE_URL:', process.env.DATABASE_URL);

const connectionPool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(connectionPool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user if not exists
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'password123456';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const hashedPassword = await hash(adminPassword, 12);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Administrator',
                role: 'ADMIN',
            },
        });
        console.log(`✅ Admin user created (${adminEmail})`);
    } else {
        console.log(`⏭️  Admin user already exists (${adminEmail})`);
    }

    // Create legacy admin user if different and not exists
    if (adminEmail !== 'admin@puu.local') {
        const existingLegacyAdmin = await prisma.user.findUnique({ where: { email: 'admin@puu.local' } });
        if (!existingLegacyAdmin) {
            const legacyPassword = await hash('admin123', 12);
            await prisma.user.create({
                data: {
                    email: 'admin@puu.local',
                    password: legacyPassword,
                    name: 'Administrator',
                    role: 'ADMIN',
                },
            });
            console.log('✅ Legacy admin user created (admin@puu.local / admin123)');
        }
    }

    // Create viewer user if not exists
    const existingViewer = await prisma.user.findUnique({ where: { email: 'viewer@puu.local' } });
    if (!existingViewer) {
        const hashedPassword = await hash('viewer123', 12);
        await prisma.user.create({
            data: {
                email: 'viewer@puu.local',
                password: hashedPassword,
                name: 'Viewer',
                role: 'VIEWER',
            },
        });
        console.log('✅ Viewer user created (viewer@puu.local / viewer123)');
    } else {
        console.log('⏭️  Viewer user already exists');
    }

    console.log('✅ Seed complete');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await connectionPool.end();
    });

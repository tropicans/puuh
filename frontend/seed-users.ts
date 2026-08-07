import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create PostgreSQL connection pool with same config as project
const connectionPool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(connectionPool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Create admin user
    const adminPassword = await hash('admin123', 12);
    await prisma.user.upsert({
        where: { email: 'admin@puu.local' },
        update: {},
        create: {
            email: 'admin@puu.local',
            password: adminPassword,
            name: 'Administrator',
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user created: admin@puu.local / admin123');

    // Create viewer user
    const viewerPassword = await hash('viewer123', 12);
    await prisma.user.upsert({
        where: { email: 'viewer@puu.local' },
        update: {},
        create: {
            email: 'viewer@puu.local',
            password: viewerPassword,
            name: 'Viewer',
            role: 'VIEWER',
        },
    });
    console.log('✅ Viewer user created: viewer@puu.local / viewer123');

    await connectionPool.end();
}

main().catch(console.error);

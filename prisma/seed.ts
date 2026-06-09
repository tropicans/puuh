import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user if not exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@puu.local' } });
    if (!existingAdmin) {
        const hashedPassword = await hash('admin123', 12);
        await prisma.user.create({
            data: {
                email: 'admin@puu.local',
                password: hashedPassword,
                name: 'Administrator',
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin user created (admin@puu.local / admin123)');
    } else {
        console.log('⏭️  Admin user already exists');
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
    });

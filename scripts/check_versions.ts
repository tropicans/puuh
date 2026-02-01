
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const regulations = await prisma.regulation.findMany({
        include: {
            versions: {
                include: {
                    articles: {
                        select: { id: true }
                    }
                },
                orderBy: { year: 'desc' }
            }
        }
    });

    console.log(JSON.stringify(regulations, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const regulations = await prisma.regulation.findMany({
        include: {
            versions: {
                orderBy: { year: 'desc' },
                include: {
                    articles: {
                        take: 1
                    }
                }
            }
        }
    });

    console.log(JSON.stringify(regulations, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

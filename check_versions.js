async function main() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
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
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch(e => console.error(e));

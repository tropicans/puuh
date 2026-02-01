import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const regs = await prisma.regulation.findMany({
        include: {
            versions: {
                include: {
                    articles: {
                        select: { id: true, articleNumber: true }
                    }
                }
            }
        }
    });

    console.log('Total Regulations:', regs.length);
    for (const r of regs) {
        const articleCount = r.versions.reduce((a, v) => a + v.articles.length, 0);
        console.log(`- "${r.title}": ${articleCount} articles`);
        for (const v of r.versions) {
            console.log(`  Version ${v.number}: ${v.articles.length} articles`);
        }
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

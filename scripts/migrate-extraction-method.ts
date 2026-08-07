import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('Starting migration for RegulationVersion.extractionMethod...');
    const versions = await prisma.regulationVersion.findMany({
        select: {
            id: true,
            rawText: true,
            extractionMethod: true,
        }
    });

    console.log(`Found ${versions.length} versions to check.`);

    let updatedCount = 0;

    for (const version of versions) {
        let method = 'docling';
        if (version.rawText) {
            // Check for pattern: [PERINGATAN: Dokumen ini diproses menggunakan metode fallback (pdfjs)...]
            if (version.rawText.startsWith('[PERINGATAN:')) {
                const match = version.rawText.match(/metode fallback \(([^)]+)\)/);
                if (match && match[1]) {
                    method = match[1]; // e.g. pdfjs, pdf-parse, ocr
                } else {
                    method = 'fallback'; // fallback if cannot extract specific method
                }
            }
        }

        await prisma.regulationVersion.update({
            where: { id: version.id },
            data: { extractionMethod: method }
        });
        updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} versions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

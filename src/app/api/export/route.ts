import { getFilteredRegulations } from '@/lib/data-service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getCurrentUser } from '@/lib/authorization';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || undefined;
        const typeId = searchParams.get('type') || undefined;
        const regulationId = searchParams.get('regulationId') || undefined;
        const yearStr = searchParams.get('year');
        const year = yearStr ? parseInt(yearStr) : undefined;

        // Fetch all matching regulations (no pagination for export, or logical limit like 100)
        const { regulations } = await getFilteredRegulations({
            q,
            typeId,
            year,
            regulationId,
            page: 1,
            pageSize: 100 // Limit to 100 for now to prevent OOM
        });

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let page = pdfDoc.addPage();
        const { height } = page.getSize();
        let y = height - 50;

        // Header
        page.drawText('Laporan Peraturan Perundang-undangan', {
            x: 50,
            y,
            size: 20,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        y -= 30;

        page.drawText(`Filter: ${q ? `"${q}"` : 'Semua'}, Tahun: ${year || 'Semua'}, Jenis: ${typeId || 'Semua'}`, {
            x: 50,
            y,
            size: 12,
            font,
            color: rgb(0.4, 0.4, 0.4)
        });
        y -= 40;

        // List
        for (const reg of regulations) {
            if (y < 50) {
                page = pdfDoc.addPage();
                y = height - 50;
            }

            page.drawText(reg.title, {
                x: 50,
                y,
                size: 12,
                font: boldFont,
            });
            y -= 20;

            const latestVersion = reg.versions[reg.versions.length - 1];
            if (latestVersion) {
                page.drawText(`${latestVersion.status} - ${latestVersion.fullTitle}`, {
                    x: 60,
                    y,
                    size: 10,
                    font,
                    color: rgb(0.3, 0.3, 0.3)
                });
                y -= 20;
            }

            y -= 10; // Spacing
        }

        const pdfBytes = await pdfDoc.save();

        return new Response(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="laporan-peraturan.pdf"',
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return new Response('Error generating PDF', { status: 500 });
    }
}

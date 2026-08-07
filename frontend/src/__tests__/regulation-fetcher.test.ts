import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRegulation } from '../lib/regulation-fetcher';
import fs from 'fs';
import path from 'path';

describe('JDIH BPK Search Scraper', () => {
    let rawHtml: string;

    beforeEach(() => {
        vi.restoreAllMocks();
        // Load the saved search results HTML containing both Perpres 82/2018 and Perpres 12/2013
        rawHtml = fs.readFileSync(path.join(__dirname, '../../../scratch/raw-bpk.html'), 'utf-8');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should correctly parse search results and return a clean, unescaped title', async () => {
        vi.spyOn(global, 'fetch').mockImplementation(() => {
            return Promise.resolve({
                ok: true,
                status: 200,
                text: () => Promise.resolve(rawHtml),
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
                headers: new Headers({ 'content-type': 'application/pdf' }),
            } as Response);
        });

        vi.mock('../lib/pdf-service', () => ({
            smartExtractPdfText: vi.fn().mockResolvedValue({
                text: 'Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
                method: 'pdfjs',
                numPages: 10,
            }),
        }));

        const result = await fetchRegulation({
            type: 'Perpres',
            number: '82',
            year: 2018,
        });

        expect(result.success).toBe(true);
        // Under the bug, the title will be 'Perpres%20Nomor%2082%20Tahun%202018.pdf'
        expect(result.title).toBe('Peraturan Presiden (PERPRES) Nomor 82 Tahun 2018');
        expect(result.title).not.toContain('%20');
        expect(result.title).not.toContain('.pdf');
    });

    it('should fall back to the correct detail page when direct download fails', async () => {
        const requestedDetailUrls: string[] = [];

        vi.spyOn(global, 'fetch').mockImplementation((url) => {
            const urlStr = url.toString();
            if (urlStr.includes('Search')) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(rawHtml),
                    headers: new Headers(),
                } as Response);
            }

            if (urlStr.includes('Download/254897')) {
                // Simulate direct download failure
                return Promise.resolve({
                    ok: false,
                    status: 404,
                } as Response);
            }

            if (urlStr.includes('Details/')) {
                requestedDetailUrls.push(urlStr);
                // Return a mock detail page HTML containing a download link
                const mockDetailHtml = `
                    <html>
                        <body>
                            <div class="card">
                                <h4>File Peraturan</h4>
                                <a href="/Download/254897/Perpres%20Nomor%2082%20Tahun%202018.pdf">Download</a>
                            </div>
                        </body>
                    </html>
                `;
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(mockDetailHtml),
                    headers: new Headers(),
                } as Response);
            }

            // Other download request (the fallback download)
            return Promise.resolve({
                ok: true,
                status: 200,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
                headers: new Headers({ 'content-type': 'application/pdf' }),
            } as Response);
        });

        vi.mock('../lib/pdf-service', () => ({
            smartExtractPdfText: vi.fn().mockResolvedValue({
                text: 'Peraturan Presiden Nomor 82 Tahun 2018 tentang Jaminan Kesehatan',
                method: 'pdfjs',
                numPages: 10,
            }),
        }));

        const result = await fetchRegulation({
            type: 'Perpres',
            number: '82',
            year: 2018,
        });

        expect(result.success).toBe(true);
        // The code must request the correct detail URL from the search card
        expect(requestedDetailUrls).toContain('https://peraturan.bpk.go.id/Details/94711/perpres-no-82-tahun-2018');
        // It must NOT request the wrong detail URL (using download ID 254897)
        expect(requestedDetailUrls).not.toContain('https://peraturan.bpk.go.id/Details/254897');
    });
});

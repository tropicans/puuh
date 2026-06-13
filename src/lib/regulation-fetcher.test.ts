import { expect, test } from 'vitest';
import { fetchRegulation } from './regulation-fetcher';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const hasToken = !!process.env.PASAL_ID_TOKEN;

test.runIf(hasToken)('fetchRegulation should successfully fallback to pasal.id when other sources fail', async () => {
    console.log("Token configured:", hasToken);
    
    // Mock fetch to fail for BPK search and other direct URLs, but allow PDF file downloads
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        // Block search indices, but allow .pdf downloads to go through
        if ((url.includes('bpk.go.id') || url.includes('setneg.go.id') || url.includes('peraturan.go.id')) && !url.toLowerCase().endsWith('.pdf') && !url.includes('/files/')) {
            console.log(`[MOCK] Mocking failure for: ${url}`);
            return new Response('Mock failure', { status: 500 });
        }
        return originalFetch(input, init);
    };

    try {
        const result = await fetchRegulation(
            {
                type: 'Perpres',
                number: '82',
                year: 2018
            },
            (msg) => console.log(`[TEST-PROGRESS] ${msg}`)
        );
        
        console.log("Test Result success:", result.success);
        if (result.success) {
            console.log("Title:", result.title);
            console.log("Source URL:", result.sourceUrl);
            console.log("Text length:", result.rawText?.length);
        } else {
            console.error("Test Error:", result.error);
        }
        
        expect(result.success).toBe(true);
        expect(result.sourceUrl).toBeDefined();
    } finally {
        global.fetch = originalFetch;
    }
}, 60000); // 60s timeout

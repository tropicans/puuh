# Phase 02: PDF Parsing & OCR Processing Optimizations - Research Findings

This document outlines the research findings and concrete implementation plans for optimizing PDF parsing, OCR concurrency, and MinIO storage URL resolution.

## 1. Concurrency Throttling in OCR

### Current State
In `src/lib/ocr-service.ts`, `extractTextWithVision` splits large PDFs into chunks of 5 pages and processes them sequentially in a `for` loop. If a PDF is large (e.g., 20+ pages), this sequential approach is slow and doesn't take advantage of concurrent network requests. However, sending too many requests simultaneously to the Gemini API might trigger rate limits.

### Recommended Approach
We will introduce a simple, lightweight promise pool helper `runWithConcurrencyLimit` inside `src/lib/ocr-service.ts`.
1. **Configurable Limit**: We will read `process.env.OCR_CONCURRENCY_LIMIT`, convert it to an integer, and fall back to `3` if the environment variable is not defined or invalid.
2. **Batch Chunk Creation**: First, split the PDF into all chunk buffers upfront.
3. **Promise Pool Worker Pattern**: Run a worker loop that pulls from a shared index pointer to process tasks concurrently up to the configured limit. This is clean, safe in Node's single-threaded event loop, and has zero dependencies.

### Implementation Draft (`src/lib/ocr-service.ts`)
We will add the following helper function at the bottom of `src/lib/ocr-service.ts`:
```typescript
/**
 * Helper to run async tasks with a limit on concurrency
 */
async function runWithConcurrencyLimit<T>(
    tasks: (() => Promise<T>)[],
    limit: number
): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < tasks.length) {
            const currentIndex = nextIndex++;
            results[currentIndex] = await tasks[currentIndex]();
        }
    }

    // Spawn up to `limit` workers
    const workers = Array.from(
        { length: Math.min(limit, tasks.length) },
        () => worker()
    );
    await Promise.all(workers);
    return results;
}
```

Then, refactor `extractTextWithVision` to split all pages into chunk buffers and map them to task promises:
```typescript
export async function extractTextWithVision(pdfBuffer: Buffer, onProgress?: (msg: string) => void): Promise<string> {
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);

    // If small enough (< 1MB), try direct
    if (fileSizeMB < 1) {
        console.log(`PDF is small (${fileSizeMB.toFixed(2)} MB), trying direct OCR...`);
        if (onProgress) onProgress('File kecil, mencoba OCR langsung...');
        try {
            return await extractChunkWithVision(pdfBuffer, 0);
        } catch (e) {
            console.log('Direct OCR failed, falling back to splitting...', e);
        }
    }

    console.log(`PDF is large (${fileSizeMB.toFixed(2)} MB), splitting...`);
    if (onProgress) onProgress('File besar, memecah PDF agar aman...');

    try {
        const { PDFDocument } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        console.log(`PDF has ${pageCount} pages. Splitting into chunks...`);

        const PAGES_PER_CHUNK = 5; // Safe limit
        const totalChunks = Math.ceil(pageCount / PAGES_PER_CHUNK);
        const chunks: { index: number; buffer: Buffer }[] = [];

        // 1. Prepare all chunk buffers upfront
        for (let i = 0; i < pageCount; i += PAGES_PER_CHUNK) {
            const end = Math.min(i + PAGES_PER_CHUNK, pageCount);
            const subPdf = await PDFDocument.create();
            const copiedPages = await subPdf.copyPages(pdfDoc, Array.from({ length: end - i }, (_, k) => i + k));
            copiedPages.forEach(page => subPdf.addPage(page));

            const pdfBytes = await subPdf.save();
            chunks.push({
                index: Math.floor(i / PAGES_PER_CHUNK),
                buffer: Buffer.from(pdfBytes)
            });
        }

        // 2. Define chunk execution tasks
        const tasks = chunks.map(chunk => async () => {
            const currentChunk = chunk.index + 1;
            let retries = 0;
            let success = false;
            let chunkText = '';

            while (!success && retries < 2) {
                try {
                    if (onProgress) onProgress(`Memproses Chunk OCR ${currentChunk} dari ${totalChunks}...`);
                    chunkText = await extractChunkWithVision(chunk.buffer, chunk.index);
                    success = true;
                } catch (e) {
                    console.error(`Chunk error (retry ${retries}):`, e);
                    if (onProgress) onProgress(`Chunk ${currentChunk} gagal, retry ${retries + 1}...`);
                    retries++;
                    if (retries < 2) {
                        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                    }
                }
            }
            if (!success) {
                throw new Error(`Failed to extract text from chunk ${currentChunk} after retries.`);
            }
            return chunkText;
        });

        // 3. Load concurrency limit from env or default to 3
        const concurrencyLimitEnv = process.env.OCR_CONCURRENCY_LIMIT;
        const concurrencyLimit = concurrencyLimitEnv ? parseInt(concurrencyLimitEnv, 10) : 3;
        const finalLimit = isNaN(concurrencyLimit) ? 3 : concurrencyLimit;

        // 4. Run tasks concurrently using the pool helper
        const results = await runWithConcurrencyLimit(tasks, finalLimit);
        return results.join('\n\n');

    } catch (error) {
        console.error('Split & OCR failed:', error);
        throw error;
    }
}
```

---

## 2. Regex Parser Hardening

### Current State
In `src/lib/ai-service.ts`, `parseArticlesWithRegex` performs article splitting using:
```typescript
const parts = normalizedText.split(/(?=\nPasal\s+\d+|Pasal\s+\d+)/i);
```
And then parses the headers:
```typescript
const headerMatch = part.match(/^(Pasal\s+\d+[A-Z]*)/i);
```
This fails to match OCR spelling variations of 'Pasal' (e.g. `Pasa1`, `Pas al`, `Pas  al`) and spacing anomalies, or numbers with suffix letters (alphanumeric like `Pasal 103A`).

### Recommended Approach
1. **Hardened Pattern**: Define a pattern matching all spelling and spacing anomalies: `Pas\s*a\s*[l1]\s+\d+[A-Za-z]*`.
   - `Pas\s*a\s*[l1]` matches `Pasal`, `Pasa1`, `Pas al`, `Pas a1`, `Pas  al`.
   - `\s+` matches variable spacing between word and number.
   - `\d+[A-Za-z]*` matches alphanumeric numbers (e.g., `103A`).
2. **Lookahead Splitting**: Use this pattern with a lookahead assertion to split the text correctly.
3. **Normalization**: Extract the raw matched header string and normalize it to the standard `"Pasal [Number]"` format before inserting it into the database.

### Implementation Draft (`src/lib/ai-service.ts`)
Update `parseArticlesWithRegex` as follows:
```typescript
function parseArticlesWithRegex(rawText: string): ParsedArticle[] {
    const articles: ParsedArticle[] = [];

    // Normalize line endings and clean up text
    const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split by "Pasal" keyword variations followed by alphanumeric numbers
    // e.g., matches "Pasal 1", "Pasa1 103A", "Pas al 6"
    const parts = normalizedText.split(/(?=Pas\s*a\s*[l1]\s+\d+[A-Za-z]*)/i);

    for (const part of parts) {
        // Check if this part starts with our hardened "Pasal" pattern
        const headerMatch = part.match(/^(Pas\s*a\s*[l1]\s+\d+[A-Za-z]*)/i);
        if (headerMatch) {
            const rawNumber = headerMatch[1].trim();
            // Get content after the "Pasal X" header
            let content = part.substring(headerMatch[0].length).trim();

            // Normalize article number to standard format (e.g., "Pasa1 103A" -> "Pasal 103A")
            const number = rawNumber
                .replace(/^Pas\s*a\s*[l1]/i, 'Pasal') // Fix spelling/spaces in "Pasal"
                .replace(/\s+/g, ' '); // Clean up double spaces to a single space

            // Remove trailing BAB/Bagian/Paragraf sections that might have been captured
            const nextSectionMatch = content.match(/\n\s*(BAB|Bagian|Paragraf)\s+/i);
            if (nextSectionMatch) {
                content = content.substring(0, nextSectionMatch.index).trim();
            }

            // Remove typical "trash" end lines if any
            content = content.replace(/\n\s*(- \d+ -|PRESIDEN REPUBLIK INDONESIA)\s*$/i, '');

            if (content.length > 2) {
                articles.push({ number, content });
            }
        }
    }

    console.log(`Regex parsing found ${articles.length} articles`);
    return articles;
}
```

---

## 3. MinIO Download URL Proxy

### Current State
Right now, `storage.uploadFile` returns the absolute endpoint containing the MinIO container name or host address (`http://localhost:9000/...`). Since Next.js and MinIO run in docker containers, browser clients cannot access the localhost address at port `9000` because the browser needs port `9002` (or external mapping), and containers need `http://minio:9000`.

### Recommended Approach
1. **Relative URLs**: Change `storage.uploadFile` to return a relative URL `/api/documents/${filename}`.
2. **Server-Side API Proxy**: Create a Next.js dynamic API route at `src/app/api/documents/[...path]/route.ts`.
3. **Internal Streaming**: Use `storage.getFileStream(filename)` (which calls MinIO's SDK `getObject`) to pull the PDF from MinIO directly on the server, convert the Node.js Readable stream to a Web ReadableStream using `Readable.toWeb()`, and stream it back to the browser with the correct headers. This hides MinIO's ports and addresses from the browser.

### Implementation Drafts

#### File 1: `src/lib/storage.ts`
Modify `uploadFile` return statement:
```typescript
    uploadFile: async (filename: string, buffer: Buffer, contentType: string) => {
        try {
            await ensureBucket();
            await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
                'Content-Type': contentType
            });
            // Changed: return relative api proxy path
            return `/api/documents/${filename}`;
        } catch (error) {
            console.error('MinIO upload error:', error);
            throw new Error('Failed to upload file to storage');
        }
    },
```

#### File 2: `src/app/api/documents/[...path]/route.ts` (New File)
Create this new file with the following code:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Readable } from 'stream';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await context.params;
        if (!path || path.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Document path is required' },
                { status: 400 }
            );
        }

        // Join the path segments to get the correct object key in MinIO
        // e.g. ["regulations", "2026", "UU_1_123.pdf"] -> "regulations/2026/UU_1_123.pdf"
        const filename = path.join('/');

        // Fetch the object stream from MinIO using the existing storage helper
        const nodeStream = await storage.getFileStream(filename);

        // Convert the Node.js Readable stream to a Web ReadableStream
        const webStream = Readable.toWeb(nodeStream);

        // Determine content-disposition and content-type
        const baseName = path[path.length - 1];

        return new Response(webStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${encodeURIComponent(baseName)}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error('Error proxying document download from MinIO:', error);
        
        // Handle file not found (MinIO NoSuchKey error)
        if (error.code === 'NoSuchKey') {
            return NextResponse.json(
                { success: false, error: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to retrieve document' },
            { status: 500 }
        );
    }
}
```

---

## 4. Files to be Modified / Created

Here is the list of files to be modified or created during Phase 2:

| File | Status | Action | Description |
|---|---|---|---|
| `src/lib/ocr-service.ts` | Modified | Edit | Implement `runWithConcurrencyLimit` and update `extractTextWithVision` chunks logic. |
| `src/lib/ai-service.ts` | Modified | Edit | Update `parseArticlesWithRegex` splitting pattern and normalization logic. |
| `src/lib/storage.ts` | Modified | Edit | Update `uploadFile` return path to `/api/documents/...` relative format. |
| `src/app/api/documents/[...path]/route.ts` | **New** | Create | Next.js API route to fetch file stream from MinIO server-side and serve it as a response. |

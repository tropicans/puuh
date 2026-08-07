# Phase 02: Core PDF Service Integration - Pattern Map

**Gathered:** 2026-08-06
**Status:** Completed

This pattern map lists the files to be modified in Phase 2, along with their roles, data flows, and code excerpts from the codebase to guide the planner and executor.

---

## Files to be Modified

### 1. `src/lib/pdf-service.ts`

- **Role:** Central service for document text extraction.
- **Data Flow:** Receives a binary buffer of the PDF file, attempts sequential text extraction methods (Docling -> pdfjs-dist -> pdf-parse -> Vision OCR), reports status via `onProgress` callbacks, and returns clean extracted text.
- **Closest Analog:** The existing `smartExtractPdfText` pipeline within `src/lib/pdf-service.ts`.
- **Key Excerpt (Current fallback chain structure):**
  ```typescript
  export async function smartExtractPdfText(
      pdfBuffer: Buffer,
      onProgress?: (msg: string) => void
  ): Promise<{
      text: string;
      method: 'pdfjs' | 'pdf-parse' | 'ocr';
      numPages?: number;
  }> {
      // Method 1: Try pdfjs-dist first
      try {
          if (onProgress) onProgress('Mencoba membaca teks digital...');
          const result = await extractTextFromPdf(pdfBuffer);
          // ...
      } catch (e) { ... }
  }
  ```

---

### 2. `src/app/api/upload/route.ts`

- **Role:** Next.js Route Handler for handling PDF uploads, executing extraction, and streaming server-sent progress updates.
- **Data Flow:** Parses incoming `multipart/form-data`, reads the uploaded file as a Buffer, runs `smartExtractPdfText` to get raw text and extraction method, stores file in MinIO bucket, structures clauses using the AI parsing helper, saves version + article data in database, and returns standard success JSON stream.
- **Key Excerpt (Current extraction invocation and type mapping):**
  ```typescript
  // Line 136-152 in src/app/api/upload/route.ts
  // Extract text using smart fallback chain
  let rawText = '';
  let extractionMethod = '';

  try {
      const { smartExtractPdfText } = await import('@/lib/pdf-service');

      const onProgress = (msg: string) => {
          send({ type: 'progress', message: msg });
      };

      const result = await smartExtractPdfText(buffer, onProgress);
      rawText = result.text;
      extractionMethod = result.method;
  } catch (extractError) {
      console.error('Extraction failed:', extractError);
  }
  ```

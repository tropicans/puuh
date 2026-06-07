# Phase 2: PDF Parsing & OCR Processing Optimizations - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 focuses on optimizing PDF processing speed and robustness. This includes parallelizing LLM Vision OCR chunk requests with a concurrency limit, hardening the regex-based article splitter to handle OCR typographical errors, and resolving MinIO document url resolution issues between Docker containers and browsers.

</domain>

<decisions>
## Implementation Decisions

### MinIO Download URL Resolution
- **D-01:** Implement a server-side Next.js API route proxy at `/api/documents/[...path]` to serve PDF files from MinIO. 
- **D-02:** The database `originalFileUrl` field will store the local relative route path (e.g. `/api/documents/regulations/2026/...pdf`) instead of direct MinIO host endpoints. This avoids exposing MinIO ports to the browser and resolves the browser-vs-container networking issue.

### Vision OCR Concurrency Throttling
- **D-03:** Throttle Vision OCR chunk requests to a default limit of **3 concurrent requests** using a promise pooling helper.
- **D-04:** Make the concurrency limit configurable via the `OCR_CONCURRENCY_LIMIT` environment variable.

### Regex Parser Hardening
- **D-05:** Extend the regex in `parseArticlesWithRegex` to match common OCR spelling mistakes for the "Pasal" keyword (e.g. `Pasa[l1]`, `Pas\s*al`) and variable spacing.
- **D-06:** Support alphanumeric article numbering (e.g. `Pasal 103A`, `Pasal 6A`) to prevent splitting failures on amendment sisipan.

### the agent's Discretion
- The implementation of the promise pool helper and exact regex pattern design are left to agent discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF & OCR Processing
- `src/lib/pdf-service.ts` — PDF splitting and text extraction flow.
- `src/lib/ocr-service.ts` — Vision OCR chunk processing and LLM connections.

### Article Splitting & Parsing
- `src/lib/ai-service.ts` — AI and Regex article structure parser (`parseArticlesWithRegex`).

### Storage Integration
- `src/lib/storage.ts` — MinIO file upload and retrieval utilities.
- `src/app/api/upload/route.ts` — PDF upload stream handler saving `originalFileUrl`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/storage.ts` -> `storage.getFileStream(filename)`: Use this method in the Next.js API route proxy to fetch the file stream from MinIO.
- `src/lib/ocr-service.ts` -> `extractChunkWithVision(chunkBuffer, chunkIndex)`: Use this method to execute the LLM Vision OCR on chunks.

### Integration Points
- `/api/documents/[...path]` (New API route).
- `src/lib/ocr-service.ts` (`extractTextWithVision`).
- `src/lib/ai-service.ts` (`parseArticlesWithRegex`).
- `src/lib/storage.ts` (`uploadFile`).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-PDF Parsing & OCR Processing Optimizations*
*Context gathered: 2026-06-07*

# Phase 4: PDF Processing Resilience - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement page-by-page fallback recovery in `pdf-service.ts`. If page-splitting via `pdf-lib` fails on a PDF file, or if any chunk fails to process after retries, catch the error and process pages one by one defensively.

</domain>

<decisions>
## Implementation Decisions

### Fallback Triggering Strategy
- **D-01:** Fully resilient triggering. Fallback is activated if `pdf-lib` fails to load or split the document (e.g. document-level load failure), OR if any specific 5-page chunk fails to process after retries during the LLM Vision API call.
- **D-02:** Target fallback to single-page processing only for the pages inside the failed chunk, preserving other successfully processed chunks. This minimizes API requests and token usage.

### Fallback Concurrency & Rate Limiting
- **D-03:** Concurrency limit for single-page tasks should be lower (max 1-2 concurrent calls) to stay safe under LLM API rate limits.
- **D-04:** Retry single-page task failures up to 2 times with exponential backoff (wait 2s, then 4s) before failing the upload.

### User Notifications & Progress Reporting
- **D-05:** Stream detailed status messages to the UI (via SSE progress logs) explaining that page-by-page fallback processing is active (e.g. "Mendeteksi kendala, memproses per halaman...").

### the agent's Discretion
- The exact layout of the logs, retry backoff configuration, and implementation helper details inside `ocr-service.ts` are left to agent discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF Parsing and OCR Services
- `src/lib/ocr-service.ts` — Vision OCR service and page chunking/splitting logic.
- `src/lib/pdf-service.ts` — Standard PDF text extraction service (`smartExtractPdfText`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runWithConcurrencyLimit` in `src/lib/ocr-service.ts` — Helper to run async tasks with concurrency limits.
- `extractChunkWithVision` in `src/lib/ocr-service.ts` — Perform OCR on a specific PDF page/chunk buffer.

### Established Patterns
- Dynamic importing of `pdf-lib` to avoid circular dependencies.
- Logging execution status and using progress callback (`onProgress`) to communicate with SSE routes.

### Integration Points
- `smartExtractPdfText` in `src/lib/pdf-service.ts` catches fallback errors and delegates to `extractTextWithVision` in `ocr-service.ts`.
- `extractTextWithVision` in `src/lib/ocr-service.ts` orchestrates chunking and executes single-page fallback.

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

*Phase: 04-PDF Processing Resilience*
*Context gathered: 2026-06-08*

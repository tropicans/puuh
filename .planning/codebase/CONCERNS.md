# Codebase Concerns

**Analysis Date:** 2026-08-07

## Tech Debt

**Warnings for Explicit Any in Backend Compiler Check:**
- Issue: The backend TypeScript compiler outputs 39 warnings regarding usage of `any` types.
- Files: Multiple files in `backend/src/routes/` and `backend/src/lib/`.
- Why: Rapid migration of routes and handlers from Next.js server actions to Express.js REST API.
- Impact: Degrades compile-time type-safety, increasing risk of runtime errors due to missing property checks.
- Fix approach: Refactor code to use explicit type definitions, schemas, or `unknown` with type narrowing. Scheduled for the v3.0 cleanup cycle.

**Manual BFF Proxies for API Routes:**
- Issue: Route handlers in `frontend/src/app/api/...` are copy-pasted thin proxies forwarding requests manually to backend ports.
- Files: `frontend/src/app/api/regulations/route.ts`, `frontend/src/app/api/db-status/route.ts`, `frontend/src/app/api/seed/route.ts`, etc.
- Why: Temporary separation structure for monorepo.
- Impact: Increased boilerplate and chance of routing path mismatches.
- Fix approach: Centralize BFF routing proxy logic using Next.js middleware rewrites or unified BFF routing handlers.

## Known Bugs

**OCR-01: No Dynamic OCR Toggle:**
- Symptoms: User cannot manually select whether or not to run OCR for PDF conversions.
- Trigger: PDF files are parsed; fallback OCR vision engine triggers automatically if Docling fails, regardless of user preference.
- Files: `backend/src/lib/pdf-service.ts` (orchestration logic).
- Workaround: Dynamic OCR vision is always executed as the last resort in the fallback chain.
- Root cause: Missing user-configuration input parameter in frontend upload UI and backend REST endpoints.
- Fix approach: Implement a manual toggle button in the upload form and map it to backend API request params in v3.0.

## Security Considerations

**Context Header Security (X-User-Id / X-User-Role):**
- Risk: Anyone who has access to backend port `3007` directly can spoof request context headers to gain unauthorized administrative privileges since backend does not verify NextAuth sessions directly.
- Files: `backend/src/middleware/auth.ts` (auth checking middleware).
- Current mitigation: Ports on Docker Compose are segregated, and the Express backend is isolated inside the Docker network.
- Recommendations: Implement JWT validation or shared secret checks on the backend Express layer to verify headers were propagated by the trusted Next.js BFF server only.

## Performance Bottlenecks

**Docling PDF Parse Microservice Latency:**
- Problem: PDF layout extraction using the CPU-only Docling docker image (`docling-serve-cpu`) can take 10s to 30s for large PDF regulations.
- Measurement: 10s to 30s per upload on complex PDFs.
- Cause: Significant CPU/RAM consumption of PyTorch model conversion.
- Improvement path: implement extraction result caching (`PERF-01`) in backend storage to avoid parsing identical files multiple times, and look into GPU acceleration if hardware is available.

## Fragile Areas

**PDF Parsing Fallback Chain:**
- File: `backend/src/lib/pdf-service.ts`.
- Why fragile: Chains three external methods (Docling -> pdfjs -> vision OCR) sequentially. If any method hangs indefinitely, the API upload connection can timeout.
- Common failures: Complex scan formatting causing Docling to hang, or OpenAI Vision API timeouts.
- Safe modification: Introduce strict timeouts per fallback level (using `AbortController` or Promise timeouts).
- Test coverage: Partially covered by unit tests, but missing network failure and timeout mock assertions.

## Scaling Limits

**MinIO Local Storage Capacity:**
- Current capacity: Dependent on local disk space where docker volume is mounted.
- Limit: Storage fills up after storing hundreds of high-resolution PDF regulations and corresponding extracted raw text states in PostgreSQL.
- Scaling path: Migrate local MinIO to AWS S3 or Google Cloud Storage buckets in production.

## Missing Critical Features

**PERF-01: Extraction Result Caching:**
- Problem: The system processes PDF extraction and LLM parsing from scratch even if the exact same PDF version is re-uploaded.
- Blocks: High cost and latency on repeated operations.
- Implementation complexity: Low-Medium. Requires checking PDF file hash against existing cached extraction rawText in the database before invoking conversion workflows. Scheduled for v3.0.

---

*Concerns audit: 2026-08-07*
*Update as issues are fixed or new ones discovered*

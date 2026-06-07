# Codebase Concerns

**Analysis Date:** 2026-06-07

## Tech Debt

**Host & Container Database Port Mismatch:**
- Issue: In the local environment, the database connection URL and Docker port mapping are mismatched.
  - `.env` uses port `5433` (`DATABASE_URL="postgresql://puu_admin:puu123@localhost:5433/puu_tracker?schema=public"`).
  - `docker-compose.yml` maps postgres container port `5432` to host port `5434` (`ports: - "5434:5432"`).
- Impact: If a developer runs database containers via `docker compose up` and executes the application on the host using `npm run dev`, database operations will fail because the app attempts to connect to port 5433 instead of 5434.
- Fix approach: Update `.env` `DATABASE_URL` to match host port `5434` or change the port mapping in `docker-compose.yml` to `5433:5432`.

**Direct HTTP Fetch Calls for LLM Services:**
- Issue: Standard SDKs (e.g., Google Gen AI or OpenAI SDK) are bypassed in favor of raw `fetch` HTTP POST requests.
- Files: `src/lib/ai-service.ts` (line ~18), `src/lib/ocr-service.ts` (line ~20).
- Why: Done to easily route calls to a custom proxy endpoint (`https://proxy.kelazz.my.id/v1`) without SDK validation errors.
- Impact: Reduces type safety, prevents taking advantage of official SDK features (like automatic retries, exponential backoff, and stream helper utilities), and makes upgrading models more difficult.
- Fix approach: Refactor code to use the standard `openai` SDK initialized with custom `baseURL` and `apiKey` properties.

**Missing Database Migrations:**
- Issue: There is no `migrations/` directory inside `prisma/`.
- Impact: The database state is pushed using direct push commands rather than incremental migrations. There is no version-controlled audit log of changes made to the database schema.
- Fix approach: Generate initial schema migration via `npx prisma migrate dev --name init`.

**Unused Configurations:**
- Issue: `GOOGLE_VISION_API_KEY` is declared in config but never referenced.
- Impact: Introduces confusion as to what OCR backend is active.

## Known Bugs

- None currently documented, but OCR text output is prone to typos if source PDFs are of low resolution, causing articles to be missed by the Regex splitter fallback.

## Security Considerations

**Client-Side Upload Page Guard Missing:**
- Risk: The `/upload` page has no authentication or authorization checks.
- Files: `src/app/upload/page.tsx`
- Current mitigation: The API handler endpoint `/api/upload` is guarded and blocks unauthorized uploads.
- Impact: Non-admin users or public visitors can navigate to `/upload`, view the UI upload form, fill in values, and upload files, only to get an API error back.
- Recommendations: Implement role-based page guards on the server component layout/page level, redirecting non-ADMIN roles to `/dashboard`.

**Plaintext Hardcoded Admin Credentials in Seed Script:**
- Risk: Password hashes are generated from plaintext `admin123` and `viewer123` strings.
- Files: `src/actions/users.ts` (line ~29, ~42)
- Recommendations: Seed scripts should pull passwords from temporary environment variables rather than hardcoding default testing credentials in source control.

## Performance Bottlenecks

**Large Scanned PDF Processing Times:**
- Problem: The OCR processing pipeline runs sequentially for chunks of 5 pages using Gemini vision models.
- Files: `src/lib/ocr-service.ts` (line ~180)
- Impact: Uploading a large scanned PDF (e.g. 50 pages) will trigger 10 sequential LLM vision requests. This can take several minutes to complete, potentially exceeding local request timeouts.
- Improvement path: Parallelize chunk processing via `Promise.all` with concurrency control (e.g. max 3 concurrent calls) to respect rate limits.

**Regex Parser Fallback Limitations:**
- File: `src/lib/ai-service.ts` -> `parseArticlesWithRegex` (line ~110)
- Cause: Simple regex-based splitting by `Pasal \d+`.
- Impact: OCR typos (such as `Pasa1`, `Pas al`) or multi-line article headings will cause the parser to fail to extract content verbatim, creating massive, merged article chunks.

## Fragile Areas

**PDF Page-Splitting for OCR:**
- File: `src/lib/ocr-service.ts` -> `extractTextWithVision` (line ~198)
- Why fragile: Uses `pdf-lib` to dynamically split the source document buffer, save it, and then feed it to the OCR model. Any corrupted PDF pages will cause the `pdf-lib` compilation to crash, failing the entire upload.

**SSE Chunk Parsing:**
- File: `src/app/upload/page.tsx` -> `handleManualUpload` (line ~207)
- Why fragile: Split chunks are parsed line-by-line as raw JSON. If a network chunk splits a JSON line in half, `JSON.parse` will throw an error, causing progress logs to miss updates.

## Scaling Limits

**MinIO Host URL Hardcoding:**
- File: `src/lib/storage.ts` -> `uploadFile` (line ~44)
- Current capacity: Returns `http://${MINIO_ENDPOINT}:${MINIO_PORT}/...`.
- Limit: In docker network, `MINIO_ENDPOINT` is `minio` which resolves correctly inside containers. But for browser clients downloading the file from the host, the URL needs to map to `localhost:9002` or `localhost:9000`. This causes download URL breaks depending on where the URL is generated.

## Test Coverage Gaps

**Diff Engine Verification:**
- What's not tested: The Longest Common Subsequence (LCS) diff calculation logic between Indonesian legal text structures.
- Risk: Changes in diff tokenization might break formatting on the UI comparison view.
- Priority: High.

---

*Concerns audit: 2026-06-07*
*Update as issues are fixed or new ones discovered*

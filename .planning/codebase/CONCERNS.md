# Codebase Concerns

**Analysis Date:** 2026-06-08

## Tech Debt

**Lack of database index on `amendsId`:**
- **Issue:** The `RegulationVersion` model contains a self-referential relation `amendsId` to track amendments, but it lacks a database index.
- **File:** `prisma/schema.prisma` (line ~55)
- **Why:** The relation was created for tracking amendments, but index optimization was overlooked.
- **Impact:** As the database grows, querying for versions that amend or are amended by other versions will experience degraded performance (table scans instead of index scans).
- **Fix approach:** Add `@@index([amendsId])` to the `RegulationVersion` model.

**Hardcoded fallback config URLs and credentials:**
- **Issue:** Fallback base URLs and default keys are hardcoded in the codebase services.
- **Files:** `src/lib/ai-service.ts` (line ~19), `src/lib/ocr-service.ts` (line ~6)
- **Why:** To prevent service failure when environment variables are missing.
- **Impact:** Hardcoded credentials could point to unwanted development endpoints or leak configuration details in production.
- **Fix approach:** Enforce that environment variables are defined and throw clean errors if they are absent, rather than providing default fallback endpoints.

## Known Bugs

**Regex-based article extraction limitations:**
- **Symptoms:** Parsed article bodies might miss sections, capture trailing page numbers, or fail to extract structural sub-clauses when dealing with large OCR-extracted texts.
- **Trigger:** Processing raw text from scanned PDFs where OCR has spelling issues (e.g., "Pasa1" instead of "Pasal") or when articles are not formatted on new lines.
- **File:** `src/lib/ai-service.ts` (line ~110, `parseArticlesWithRegex`)
- **Workaround:** AI parsing handles smaller documents, but is bypassed for larger documents (>20,000 characters).
- **Root cause:** Token limit constraints of the LLM necessitate regex fallback, but the regex tokenizer is strictly dependent on clean formatting of "Pasal [number]".

## Security Considerations

**Exposed default secrets:**
- **Risk:** Default JWT signature credentials (`AUTH_SECRET="puu-tracker-secret-key-change-in-production-2024"`) are set in the committed config environment, which could lead to session hijacking if deployed as-is.
- **File:** `.env` (line ~17)
- **Current mitigation:** The `.env` file should be kept out of the repository, but a copy is currently present in the project folder.
- **Recommendations:** Generate a secure random string for `AUTH_SECRET` on deployment, ensure `.env` is fully gitignored, and check for any leaked secrets.

**NextAuth Beta package dependency:**
- **Risk:** NextAuth `5.0.0-beta.30` is still in beta, which means it may receive breaking changes or have undocumented vulnerabilities.
- **File:** `package.json` (line ~28)
- **Current mitigation:** Lock dependency versions.
- **Recommendations:** Regularly audit for new stable v5 releases and update code if authentication APIs change.

## Performance Bottlenecks

**Large scanned PDF OCR times:**
- **Problem:** Processing a scanned PDF with 10+ pages takes significant time, leading to slow uploads or HTTP timeouts.
- **File:** `src/lib/ocr-service.ts` (line ~180, `extractTextWithVision`)
- **Measurement:** 2–5 seconds per page via Vision models, accumulating to >30 seconds for larger documents.
- **Cause:** Pages are split and sent as separate base64 image requests sequentially.
- **Improvement path:** Implement async background jobs using an upload queue (such as BullMQ) so that users receive an immediate response while the PDF is parsed in the background.

## Fragile Areas

**PDF loading timeout race condition:**
- **File:** `src/lib/pdf-service.ts` (line ~34)
- **Why fragile:** A hardcoded 5000ms timeout race is used when loading PDFs via `pdfjs-dist`. If loading is slow due to server CPU limits, it rejects with `PDFJS_TIMEOUT`.
- **Common failures:** Valid, large PDFs fail to load and immediately fail back to `pdf-parse` or OCR, causing excessive resource usage.
- **Safe modification:** Make this timeout configurable or increase it for larger buffer uploads.

## Scaling Limits

**Local MinIO storage capacity:**
- **Current capacity:** Restricted to local Docker volume storage.
- **Limit:** Dependent on the host machine disk space.
- **Symptoms at limit:** File uploads fail with 500 errors.
- **Scaling path:** Configure S3 endpoint connection variables to use AWS S3 or Google Cloud Storage in production.

## Dependencies at Risk

**Unreferenced environment variable:**
- **Risk:** `GOOGLE_VISION_API_KEY` is defined in `.env` and `docker-compose.yml` but is never referenced by the application code.
- **File:** `src/lib/ocr-service.ts` (uses LLM Vision model instead of Google Cloud Vision API).
- **Impact:** Misleading configuration; developers might think Google Vision is used when it is not.
- **Migration plan:** Clean up `.env` and docker definitions.

## Test Coverage Gaps

**Complete lack of unit and component testing:**
- **What's not tested:** Core diff calculations, AI service prompts, NextAuth authorization checks, and components.
- **Risk:** Refactoring critical parsers or updating package versions could introduce regressions unnoticed.
- **Priority:** High.
- **Difficulty to test:** Requires installing and configuring a test runner (e.g. Vitest) and writing mocks for database queries and LLM proxy endpoints.

---

*Concerns audit: 2026-06-08*
*Update as issues are fixed or new ones discovered*

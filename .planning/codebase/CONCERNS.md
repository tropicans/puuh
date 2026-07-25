# Codebase Concerns

**Analysis Date:** 2026-07-25

## Tech Debt

**Memory-Bound Rate Limiting:**
- Issue: Direct in-memory rate limiting is used on API routes (like `/api/upload`).
- Files: `src/lib/rate-limit.ts` (the cache handler) and `src/app/api/upload/route.ts` (the upload route).
- Why: Simple to set up without external infrastructure dependencies.
- Impact: In-memory LRU cache resets every time the server restarts and does not synchronize across multiple running container replicas in production.
- Fix approach: Transition to a Redis-backed rate limiter for distributed/production deployment.

**Sequential and Inline PDF Processing:**
- Issue: Extracting text, performing OCR, and analyzing structure occur synchronously inside the API route.
- Files: `src/app/api/upload/route.ts`
- Why: Simplified request-response architecture.
- Impact: Large PDF uploads or slow OCR runs might exceed HTTP gateway timeouts (typically 30 seconds on serverless hosts or load balancers).
- Fix approach: Offload PDF analysis to background worker tasks (e.g. BullMQ, Celery) and return a status token to poll execution status.

## Known Bugs

- None currently documented, but OCR or parsing failures can result in empty article contents if standard Indonesian legislation formats differ from typical patterns.

## Security Considerations

**Secrets Stored in Environment Variables:**
- Risk: Dev secrets like `OPENAI_API_KEY`, `GOOGLE_VISION_API_KEY`, and `AUTH_SECRET` are kept in cleartext inside `.env`.
- Files: `.env` (gitignored in dev but requires care in production).
- Current mitigation: Gitignore blocks committing the local `.env`.
- Recommendations: In production, configure environment variables via container orchestrators (e.g., Kubernetes Secrets, AWS Secrets Manager).

**Lack of Input Sanitization on Parsed Text:**
- Risk: Extracted PDF strings or external fetch content are directly stored in database tables as raw/HTML text.
- Files: `src/lib/pdf-service.ts`, `src/actions/regulations.ts`.
- Current mitigation: Relies on Prisma parameterized queries for DB injection mitigation.
- Recommendations: Incorporate robust HTML/script sanitization (like DOMPurify or sanitize-html) before saving `diffHtml` strings.

## Performance Bottlenecks

**On-Demand LCS Diff Calculations:**
- Problem: Differences between regulation versions are calculated word-by-word via dynamic programming LCS every time a user requests a comparison.
- Files: `src/lib/diff-engine.ts`, `src/app/compare/page.tsx`
- Measurement: High CPU utilization when comparing very large law versions containing hundreds of long articles.
- Cause: Dynamically calculating word-level LCS is an \(O(N \cdot M)\) operation.
- Improvement path: Pre-compute and cache the comparison outputs (`diffHtml` and change counts) inside `ArticleChange` tables when new versions are uploaded.

**Google Vision OCR API Limits:**
- Problem: Scanned PDF files are split into page images and processed page-by-page.
- Files: `src/lib/ocr-service.ts`
- Cause: Google Cloud Vision API has rate and payload limits, requiring concurrency locks.
- Improvement path: Optimize chunk sizes and run requests in batches using parallel concurrency helper pools.

## Fragile Areas

**AI-Based Article Extraction:**
- Why fragile: Structuring chapters and article hierarchies relies on LLM prompt formatting. Output formats could fluctuate or truncate under large documents.
- Files: `src/lib/ai-service.ts` (method `parseArticlesFromText`).
- Common failures: Parser fails to decode JSON when LLMs write markdown wrappers or truncate lists.
- Safe modification: Relies on a strict regex-based parser fallback if articles are fewer than 3 or JSON is malformed.
- Test coverage: No direct test suite for `ai-service.ts`.

**Digital PDF Reader Compatibility:**
- Files: `src/lib/pdf-service.ts`
- Why fragile: Legacy version of `pdfjs-dist` is referenced via Node.js system filepaths. Bundlers or packaging scripts might miss worker files.

## Scaling Limits

**MinIO Object Storage Volumes:**
- Current capacity: Dev storage mapped directly onto local container volumes.
- Limit: Local disk capacities.
- Scaling path: Migrate to production S3 (or compatible cloud object stores) for production loads.

## Dependencies at Risk

**NextAuth Beta releases:**
- Risk: `next-auth` is running on a beta version (`5.0.0-beta.30`).
- Impact: Upgrading might bring breaking changes.

**pdfjs-dist legacy:**
- Risk: Running on version `4.0.379` legacy build.
- Impact: Needs configuration workarounds for Node compatibility.

## Test Coverage Gaps

**Server Actions and Database Operations:**
- What's not tested: Server actions in `src/actions/regulations.ts` and `src/actions/users.ts` are completely untested.
- Risk: Relational query errors or permission regressions could bypass manual tests.
- Priority: High.
- Difficulty: Requires database state mocking or transaction rollbacks.

**AI and PDF Parsers:**
- What's not tested: `src/lib/ai-service.ts` and `src/lib/pdf-service.ts`.
- Priority: Medium.
- Difficulty: Requires mocking third-party PDF file loaders and OpenAI model outputs.

---

*Concerns audit: 2026-07-25*
*Update as issues are fixed or new ones discovered*

# Codebase Concerns

**Analysis Date:** 2026-06-10

## Tech Debt

### Missing Environment Variable Validation

**Issue:** Environment variables like `DATABASE_URL`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `MINIO_ACCESS_KEY`, etc., are used directly without runtime validation in many places. If a required variable is missing, the app may fail at runtime with cryptic errors.

**Files:** Multiple files including `src/lib/prisma.ts`, `src/lib/ai-service.ts`, `src/lib/storage.ts`, `src/lib/ocr-service.ts`, `src/lib/judicial-review.ts`, `src/lib/regulation-fetcher.ts`

**Impact:** Application startup failures, runtime errors that are difficult to debug, security issues from missing credentials.

**Fix approach:** Add a validation module that checks all required env vars on startup and provides clear error messages indicating which variables are missing.

### Direct Database Access in Components

**Issue:** Some components and API routes use `prisma` directly without abstraction layers, leading to inconsistent error handling and data transformation.

**Files:** `src/app/api/regulations/[id]/route.ts`, `src/app/api/versions/[id]/route.ts`, `src/app/api/articles/[id]/route.ts`, `src/app/api/judicial-reviews/[id]/route.ts`

**Impact:** Duplicated code, inconsistent error handling, difficulty maintaining data transformation logic.

**Fix approach:** Create dedicated service functions or reuse existing actions where possible. Consider consolidating database operations into a `src/lib/data-access.ts` module.

### Inconsistent Transaction Handling

**Issue:** Some database operations use transactions (`prisma.$transaction`) while others don't, even for related multi-step operations. This can lead to partial updates.

**Files:** 
- Uses transaction: `src/actions/regulations.ts` (createVersion), `src/app/api/upload/route.ts` (version creation)
- Doesn't use transaction: `src/app/api/upload/route.ts` (article creation - separate from version creation in some paths)

**Impact:** Data inconsistency when multi-step operations fail mid-way, potential orphaned records.

**Fix approach:** Standardize on using transactions for all multi-step operations. Add a helper function that wraps common patterns.

### No Database Connection Pool Monitoring

**Issue:** The PostgreSQL connection pool is configured but not monitored for connection leaks or performance issues. Long-running queries or connection leaks could exhaust the pool.

**Files:** `src/lib/prisma.ts`

**Impact:** Application slowdown or complete failure when pool is exhausted, especially under high load.

**Fix approach:** Add connection pool metrics monitoring and alerting. Add query timeout handling and logging for slow queries.

### Unused Migration Files

**Issue:** The `prisma/migrations/` directory contains SQL migration files but it's unclear if all migrations were applied to production or if there are orphaned files.

**Files:** `prisma/migrations/20260218061329_add_judicial_review/migration.sql`, `prisma/migrations/20260609031957_add_indexes_audit_columns/migration.sql`

**Impact:** Confusion about current database schema state, potential issues during deployments.

**Fix approach:** Run `prisma migrate status` to verify migration state. Document migration strategy and add CI checks for unapplied migrations.

## Known Bugs

### Rate Limiter Not Applied to All Endpoints

**Symptoms:** Some API endpoints are protected by rate limiting (e.g., `/api/upload`, auth endpoints) while others are not.

**Files:** 
- Rate limited: `src/app/api/upload/route.ts`, `src/lib/auth.ts`
- Not rate limited: `src/app/api/regulations/route.ts`, `src/app/api/export/route.ts`

**Trigger:** An attacker could abuse non-rate-limited endpoints to cause denial of service or excessive resource usage.

**Workaround:** None currently.

### PDF Text Extraction Timeout Not Consistently Applied

**Symptoms:** PDF text extraction has a 5-second timeout in some places but not others. This can cause requests to hang indefinitely for large/complex PDFs.

**Files:** `src/lib/pdf-service.ts` (has timeout), `src/lib/regulation-fetcher.ts` (no timeout on download), `src/lib/ocr-service.ts` (has timeout for chunks)

**Trigger:** Large PDF files or slow network connections can cause requests to hang.

**Workaround:** Users may need to retry upload or use smaller files.

### Version Status Update Race Condition

**Symptoms:** When creating a new version, the previous version's status is updated to 'AMENDED' inside a transaction, but there's no guarantee that the new version will be successfully created. If the transaction fails after status update, the system may have inconsistent version status.

**Files:** `src/actions/regulations.ts` (lines 177-182), `src/app/api/upload/route.ts` (lines 281-285)

**Trigger:** Concurrent version creation or transaction failures.

**Workaround:** None - users may see inconsistent status until manually corrected.

## Security Considerations

### Password Hashing Uses bcryptjs with Fixed Rounds

**Risk:** Password hashing uses `bcryptjs` with 12 rounds in `src/lib/auth.ts` and `prisma/seed.ts`, but this value is hardcoded and not configurable. As hardware improves, this may become insufficient.

**Files:** `src/lib/auth.ts` (line 60), `prisma/seed.ts` (line 12), `src/actions/users.ts` (line 60)

**Current mitigation:** 12 rounds is currently considered acceptable for bcrypt, but not configurable.

**Recommendations:** Make the hash rounds configurable via environment variable with a sensible default and minimum. Consider adding a migration path for existing passwords.

### No Input Size Limits on Text Fields

**Risk:** Large text inputs (rawText, amarText, content) could lead to database bloat or memory exhaustion. While there's a 100KB truncation on `rawText` in some places, it's not consistently applied.

**Files:** `src/app/api/upload/route.ts` (line 293), `src/app/api/regulations/fetch/route.ts` (line 157), various database schema fields allow unlimited text length.

**Current mitigation:** Some truncation at 100000 characters in upload routes.

**Recommendations:** Add consistent input size limits at both application and database levels. Consider splitting large texts into separate storage.

### No XSS Protection for User-Provided Content

**Risk:** Article content, judicial review impacts, and other user-provided text is rendered directly without sanitization. While Tailwind's default escaping helps, any markdown or HTML rendering could introduce XSS risks.

**Files:** `src/app/regulations/[id]/page.tsx` (renders `article.content`), `src/app/manage/page.tsx`

**Current mitigation:** React's default escaping, no raw HTML rendering in current implementation.

**Recommendations:** If markdown rendering is added, use a library like `marked` with proper sanitization. Add content security policy headers.

### Seed Credentials in Production Risk

**Risk:** The `prisma/seed.ts` file contains hardcoded default credentials (`admin@puu.local/admin123`, `viewer@puu.local/viewer123`). While these are only used for initial seeding, they could be forgotten in production.

**Files:** `prisma/seed.ts`

**Current mitigation:** The seed file only runs if users exist.

**Recommendations:** Never use default passwords in production. Document that seed data should be regenerated with secure credentials before production deployment.

## Performance Bottlenecks

### Sequential PDF Processing in Upload

**Problem:** Each PDF upload processes text extraction sequentially, blocking the request thread. For large PDFs or scanned documents using OCR, this can take minutes.

**Files:** `src/app/api/upload/route.ts`, `src/lib/pdf-service.ts`, `src/lib/ocr-service.ts`

**Cause:** Single-threaded Node.js environment, OCR processing is computationally expensive, sequential fallback chain.

**Improvement path:** 
1. Implement async job queue (e.g., BullMQ) for PDF processing.
2. Return immediate response with job ID, process in background.
3. Use worker threads for CPU-intensive OCR operations.
4. Consider caching OCR results for known PDFs.

### N+1 Query Pattern in Regulation List

**Problem:** The dashboard page fetches regulations with versions and articles, but displaying judicial review impacts may cause additional queries per regulation.

**Files:** `src/app/dashboard/page.tsx` (fetches regulations with versions and articles), `src/app/regulations/[id]/page.tsx` (fetches judicial reviews)

**Cause:** Multiple related data fetches in separate queries rather than using eager loading.

**Improvement path:** Use Prisma's `include` option to fetch all related data in fewer queries. Consider denormalization for frequently accessed counts.

### No Caching for Static Data

**Problem:** Regulation types, years, and filter options are fetched from the database on every request without caching.

**Files:** `src/lib/data-service.ts` (lines 100-112), `src/app/dashboard/page.tsx` (line 95)

**Cause:** No caching layer implemented.

**Improvement path:** 
1. Use LRU cache for infrequently changing data (regulation types, years).
2. Consider Redis for production caching if scaling horizontally.
3. Implement cache invalidation on data mutations.

### Large Text Search Inefficiency

**Problem:** Full-text search uses PostgreSQL's `LIKE` with `contains: 'insensitive'` which doesn't use indexes efficiently on large text fields.

**Files:** `src/lib/data-service.ts` (lines 28-54), `src/lib/validations.ts`

**Cause:** Case-insensitive substring search on large text fields without full-text search indexes.

**Improvement path:** 
1. Add PostgreSQL full-text search indexes using `tsvector`.
2. Use `to_tsquery` and `ts_rank_cd` for better performance.
3. Consider external search solutions (Meilisearch, Elasticsearch) for complex search needs.

## Fragile Areas

### AI/Parsing Reliance

**Component:** `src/lib/ai-service.ts`

**Why fragile:** The application depends heavily on external AI/LLM services for article extraction and change analysis. If the LLM API is unavailable, returns malformed JSON, or times out, the entire upload/parse process fails.

**Safe modification:** Add robust error handling with fallback to regex parsing. Implement retry logic with exponential backoff. Add health checks for LLM connectivity.

**Test coverage:** Minimal - no tests for AI parsing failures or edge cases.

### Judicial Review Scraping

**Component:** `src/lib/judicial-review-search.ts`

**Why fragile:** Scrapes external websites (MKRI, Mahkamah Agung) without API contracts. HTML structure changes can break parsing.

**Safe modification:** Add fallback scraping strategies, implement robust error handling for HTML structure changes, add monitoring for scrape failures.

**Test coverage:** No tests for scraping logic or HTML changes.

### Version Amends Chain

**Component:** `prisma/schema.prisma` (RegulationVersion with amends relation)

**Why fragile:** The self-referential amends relation creates a chain that must be maintained. Breaking this chain (e.g., deleting an amends version) can lead to inconsistent data.

**Safe modification:** Add database triggers or Prisma middleware to validate chain integrity. Implement cascade deletion logic carefully.

**Test coverage:** No tests for amends chain validation.

## Scaling Limits

### Single Database Connection Pool

**Resource:** PostgreSQL connection pool

**Current capacity:** 20 connections (configured in `src/lib/prisma.ts` line 8)

**Limit:** Under high concurrent load, the 20-connection pool can be exhausted, causing request queuing and timeouts.

**Scaling path:** 
1. Increase pool size with PostgreSQL server capacity.
2. Implement connection pooling service (PgBouncer).
3. Add read replicas for load distribution.
4. Consider database connection caching.

### In-Memory Rate Limiting

**Resource:** LRUCache for rate limiting

**Current capacity:** 500 entries per rate limiter (configured in `src/lib/rate-limit.ts` line 12)

**Limit:** In-memory cache resets on server restart, doesn't work across multiple instances, limited to 500 entries.

**Scaling path:** 
1. Use Redis for distributed rate limiting.
2. Implement sliding window rate limiting algorithm.
3. Consider CDN-level rate limiting for DDoS protection.

### PDF Storage

**Resource:** MinIO object storage

**Current capacity:** No explicit limit documented, but files are uploaded as-is.

**Limit:** Large PDF collections could strain storage and bandwidth.

**Scaling path:** 
1. Implement file size limits for uploads.
2. Add storage cleanup for old/unused versions.
3. Consider compression for stored PDFs.
4. Implement CDN for static file delivery.

## Dependencies at Risk

### Next.js App Router Beta Status

**Risk:** The project uses Next.js 16.1.6 with App Router, which was still evolving at the time of this analysis. API changes could affect the codebase.

**Impact:** Breaking changes in Next.js updates could require significant refactoring.

**Migration plan:** Pin Next.js version strictly, test updates in staging before production. Monitor Next.js release notes for breaking changes.

### Prisma Schema Changes

**Risk:** Prisma v7.3.0 is relatively new. Schema changes between versions could require migration.

**Impact:** Database schema changes, potential data migration issues.

**Migration plan:** Use Prisma migrations strictly, never alter database schema manually. Test schema changes in development first.

### External API Dependencies

**Risk:** The application depends on external APIs (OpenAI, DuckDuckGo search, BPK JDIH) without fallback alternatives.

**Impact:** Service outages on external APIs directly impact application functionality.

**Migration plan:** Implement retry logic with exponential backoff, add fallback data sources where possible, add offline mode for cached data.

## Missing Critical Features

### No Audit Trail

**Problem:** Changes to regulations, versions, and articles are not tracked with who made the change and when. This makes it difficult to track down issues or understand history.

**Problem blocks:** User management, data modifications, regulatory updates.

**Risk:** No accountability, difficult troubleshooting, compliance issues.

**Priority:** High

### No Backup/Restore Mechanism

**Problem:** No automated backup or restore mechanism for database or file storage.

**Problem blocks:** Disaster recovery, data recovery from corruption.

**Risk:** Data loss from accidents, system failures, or security incidents.

**Priority:** High

### No Test Coverage

**Problem:** No test runner is configured and no test files exist for production code.

**Files:** No `*.test.*` or `*.spec.*` files exist.

**Problem blocks:** Code refactoring, regression prevention, CI/CD automation.

**Risk:** Manual testing only, easy to introduce regressions, difficult to maintain.

**Priority:** High

## Test Coverage Gaps

### No Unit Tests

**Untested area:** Core business logic in `src/actions/`, `src/lib/` directory.

**What's not tested:** No automated tests for any application logic.

**Risk:** Regressions introduced easily, manual testing required for every change, difficult to refactor confidently.

**Priority:** High

### No Integration Tests

**Untested area:** API routes, database operations, external API integrations.

**What's not tested:** No tests for HTTP endpoints, database transactions, or external service calls.

**Risk:** Integration issues only discovered in production, external API changes break silently.

**Priority:** Medium

### No E2E Tests

**Untested area:** User workflows, UI interactions.

**What's not tested:** No end-to-end tests for user journeys.

**Risk:** UI regressions, workflow issues only discovered by users.

**Priority:** Low

---

*Concerns audit: 2026-06-10*

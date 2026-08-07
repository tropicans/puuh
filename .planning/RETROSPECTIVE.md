# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Pemisahan Service Frontend dan Backend

**Shipped:** 2026-08-07
**Phases:** 4 | **Plans:** 4 | **Sessions:** 4

### What Was Built
- Decoupled Next.js application into frontend and Express.js backend monorepo.
- Express.js REST API serving authentication endpoints, DB operations, MinIO, and Docling PDF extraction.
- Thin BFF pattern in Next.js server actions and route proxies forwarding user context.
- Decoupled multi-container Docker Compose configuration with automated one-shot `db-migrate` orchestrator.

### What Worked
- Clear separation of concerns between frontend BFF and backend Express.
- Using npm workspaces in monorepo root simplifies dependencies management and command delegation.
- One-shot `db-migrate` container ensures database is fully seeded before the backend service accepts requests, completely eliminating startup race conditions.

### What Was Inefficient
- Translating the entire API logic in one go from Server Actions to REST endpoints meant a lot of boilerplate routing code had to be written and tested manually.
- Health checks: initially setting health check to `/api/db-status` on the frontend caused it to fail because of authorization header check, requiring an adjustment to public `/login`.

### Patterns Established
- Custom user context headers (`X-User-Id`, `X-User-Role`) propagated from BFF to backend.
- Multi-stage Dockerfile configurations for backend compilation and production execution as non-root user.

### Key Lessons
1. Backend REST API endpoints must handle multi-part file uploads using memory storage (`multer`) to easily pass file buffers to object storage without local disk dependence.
2. Frontend health checks should target public pages to prevent false unhealthy status reports in auth-protected environments.

---

## Milestone: v3.0 — Optimasi, Cleanup & Fitur Lanjutan

**Shipped:** 2026-08-07
**Phases:** 5 | **Plans:** 5 | **Sessions:** 5

### What Was Built
- PostgreSQL-backed polling task queue (`ProcessTask`) and background worker to run PDF upload/extraction and JR sync asynchronously.
- Direct-to-BFF proxy task polling interface and visual progress bar in the manual upload UI.
- OpenAI Structured Outputs mapping Zod schema structure for 100% deterministic JSON law article parsing.
- Hierarchical chunking logic splitting documents larger than 20,000 characters by pages/paragraphs before parsing.
- Page-parallelized Vision OCR using `p-limit` to process multiple scanned pages concurrently.
- User-Agent rotators for scrapers querying official judicial review decisions on MA/MK.
- LLM-based analysis of "Amar Putusan" MK/MA mapping precise legal dispositions (`INVALIDATED`, `CONDITIONALLY_VALID`, etc.).
- Dropdown OCR mode selection (`AUTO`/`FORCE`/`SKIP`) in UI and backend endpoints.
- MD5 hash caching checking for duplicate PDF files to bypass re-extraction.
- Strict type refactoring of Express backend codebase to eliminate unsafe `any` typings.

### What Worked
- Structured Outputs completely solved heuristic JSON formatting bugs and under-parsing risks in the LLM.
- Running parallel Vision OCR requests using `p-limit` restricted concurrency enough to speed up OCR without exceeding OpenAI rate limits.
- The background task polling pattern avoids HTTP timeout issues entirely during heavy scraping/extraction workloads.

### What Was Inefficient
- Implementing worker polling required synchronizing task statuses between Next.js BFF proxy routes and backend Express APIs, creating minor routing coordination overhead.
- MD5 caching deduplicates upload extraction, but database schema migrator needed extra handling for nullable PDF hash indexes.

### Patterns Established
- Zod schema response formats mapped directly to OpenAI API call endpoints.
- Random User-Agent header arrays rotated dynamically on incoming scrape requests.
- Typed transactional Prisma client parameter mappings (`Prisma.TransactionClient`) replacing generic database parameters.

### Key Lessons
1. Structured JSON output formats must be forced at the LLM interface layer to guarantee downstream schema validity.
2. Concurrent outbound API tasks must be rate-limited via client-side throttling wrappers (`p-limit`) to prevent HTTP 429 rate limit exceptions.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 4 | 4 | Initial Docling integration and fallback chain. |
| v2.0 | 4 | 4 | Decoupled monolith to monorepo structure. |
| v3.0 | 5 | 5 | Background task queue, structured outputs, parallel OCR, scrapers, OCR toggle, MD5 caching, strict typing. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 61 | - | 0 |
| v2.0 | 69 | - | 0 |
| v3.0 | 41 | - | 0 |

### Top Lessons (Verified Across Milestones)

1. CPU-intensive operations (Docling PDF parse) should always be isolated from user-facing web servers.
2. Direct database access from frontend should be avoided in favor of REST backend orchestration to scale horizontally.


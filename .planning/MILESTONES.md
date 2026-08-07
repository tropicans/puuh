# Milestones

## v2.0 — Pemisahan Service Frontend dan Backend

**Shipped:** 2026-08-07
**Phases:** 5–8 | **Plans:** 4 | **Duration:** 1 day (2026-08-07)

### Delivered

Decoupled the monolithic Next.js application into a clean monorepo structure with a dedicated Next.js frontend (acting as a Backend-For-Frontend/BFF proxy) and an Express.js/TypeScript backend REST API. Migrated core backend services (Prisma/PostgreSQL, MinIO Object Storage, PDF extraction, OCR, and AI LLM parsing) to the backend. Configured independent multi-container Docker Compose environments with automated migrations and unified scripts.

### Key Accomplishments

1. Reorganized project into a monorepo workspace (`frontend/` and `backend/`) with root script delegation and concurrently dev environments.
2. Migrated Prisma ORM, MinIO configurations, and PDF/Docling/LLM parser core services to Express.js.
3. Implemented robust REST API endpoints in backend Express using Multer storage for streaming PDF uploads and Server-Sent Events (SSE).
4. Refactored Next.js frontend server actions and API handlers into thin BFF proxies, preserving LRU cache rate-limiting and route protection.
5. Re-implemented NextAuth credentials provider to verify email/password logins against Express API endpoints.
6. Implemented secure user-context propagation via custom `X-User-Id` and `X-User-Role` headers to ensure robust backend-level authentication check.
7. Rewrote `docker-compose.yml` to define five decoupled services with automated one-shot `db-migrate` execution (migration + seeding) on postgres start, and corrected frontend public health checks.
8. Configured independent unit testing (Vitest) in both folders (passing 52 frontend and 17 backend tests) and verified end-to-end flow with smoke test script (`smoke-flow.mjs`).

### Stats

- Files changed: 212 files (6,979 insertions / 2,528 deletions)
- Tests: 69 unit tests passing (52 frontend, 17 backend) + 100% E2E smoke test coverage
- Requirements: 20/20 v2 requirements shipped (100%)

### Archive

- `.planning/milestones/v2.0-ROADMAP.md`
- `.planning/milestones/v2.0-REQUIREMENTS.md`

---

## v1.0 — Integrasi Docling

**Shipped:** 2026-08-07
**Phases:** 1–4 | **Plans:** 4 | **Duration:** 1 day (2026-08-06 → 2026-08-07)

### Delivered

Integrated Docling as a layout-aware PDF extraction microservice into PUU Tracker, enabling accurate Markdown+table extraction from Indonesian legal PDFs with automatic fallback, full LLM prompt tuning for structured Markdown parsing, and visual extraction method badges in the UI.

### Key Accomplishments

1. Set up `docling-serve` Docker container with health checks and `DOCLING_API_URL` env var wiring
2. Built Docling HTTP client adapter in `pdf-service.ts` with multi-level automatic fallback (Docling → pdfjs → pdf-parse → ocr)
3. Implemented table-safe `cleanMarkdownText` utility; removed 100k rawText truncation from all upload/fetch API routes
4. Updated LLM system prompt to preserve Markdown tables verbatim, retain list hierarchies, and restrict amendment extraction to changed articles only
5. Added heuristic Pasal-count validation in `parseArticlesFromText` with regex fallback on under-parsing detection
6. Added `extractionMethod` DB column to `RegulationVersion` with backfill migration; integrated visual Docling/Fallback badges into Version Timeline UI

### Stats

- Files changed: 9 source + 4 planning
- LOC: 201 insertions / 49 deletions (Phase 4 commit)
- Tests: 61 unit tests passing (3 new in ai-service.test.ts)
- Requirements: 10/10 v1 requirements shipped (100%)

### Archive

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`

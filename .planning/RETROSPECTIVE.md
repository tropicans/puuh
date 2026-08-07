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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 4 | 4 | Initial Docling integration and fallback chain. |
| v2.0 | 4 | 4 | Decoupled monolith to monorepo structure. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 61 | - | 0 |
| v2.0 | 69 | - | 0 |

### Top Lessons (Verified Across Milestones)

1. CPU-intensive operations (Docling PDF parse) should always be isolated from user-facing web servers.
2. Direct database access from frontend should be avoided in favor of REST backend orchestration to scale horizontally.

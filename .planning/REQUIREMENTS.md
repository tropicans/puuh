# Requirements: PUU Tracker Stabilization

**Defined:** 2026-06-07
**Core Value:** Enable users to trace and visualize verbatim changes in articles across Indonesian legislation versions.

## v1 Requirements

Requirements for this project cycle. Each maps to one of the roadmap phases.

### Security & Environment Config

- [ ] **SEC-01**: Align database URL port mapping in `.env` (`5433`) with `docker-compose.yml` (`5434`) to ensure seamless local host development execution.
- [ ] **SEC-02**: Setup standard database migrations flow using Prisma (`npx prisma migrate dev`), creating the initial schema migration and removing reliance on direct push commands.
- [ ] **SEC-03**: Secure `/upload` and `/manage` pages using role-based checks (blocking non-ADMIN users on layout/page rendering level).
- [ ] **SEC-04**: Extract user seed passwords from hardcoded strings in `src/actions/users.ts` to environment variables.

### Performance & OCR Robustness

- [x] **PERF-01**: Optimize scanned PDF Vision OCR chunk processing in `ocr-service.ts` using concurrent worker requests (`Promise.all`) with rate-limit friendly throttling (e.g., max 3 concurrent calls).
- [x] **PERF-02**: Harden the Regex article-splitting parser in `ai-service.ts` (`parseArticlesWithRegex`) to handle typical OCR typos (such as `Pasa1`, `Pas al`) and line break variations safely.
- [x] **PERF-03**: Adjust the MinIO file upload storage service (`src/lib/storage.ts`) so that generated download URLs resolve correctly for both browser clients (using host port `9002` or `9000`) and server containers.

### Testing & Verification

- [ ] **TEST-01**: Install and configure Vitest framework as the project's test runner, adding standard npm test scripts (`npm test`, `npm run test:run`).
- [ ] **TEST-02**: Implement automated unit tests for the verbatim LCS diff engine (`src/lib/diff-engine.ts`) validating word addition, deletion, and whitespace matching scenarios.

## v2 Requirements

Deferred features (not in scope for this milestone cycle).

### Advanced Processing

- **AI-01**: Implement PDF page-splitting error recovery. If `pdf-lib` fails to compile a subset of pages, process them one by one.
- **AI-02**: Add semantic indexing of legal articles to support AI search queries.

---

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| PERF-01 | Phase 2 | Complete |
| PERF-02 | Phase 2 | Complete |
| PERF-03 | Phase 2 | Complete |
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 3 | Pending |

**Coverage:**

- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-07*
*Last updated: 2026-06-07 after initial definition*

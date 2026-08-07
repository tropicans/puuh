# PUU Tracker

## What This Is

A web application to track, compare, and analyze changes in Indonesian laws and regulations (Peraturan Perundang-Undangan - PUU). It enables uploading PDFs, extracting text via a layout-aware Docling microservice (with automatic fallback to pdfjs/OCR), identifying articles (pasal) with LLM assistance, and diffing versions of regulations. Extraction method metadata is stored and surfaced visually in the UI.

## Core Value

Ensure highly accurate extraction and representation of legal clauses (pasal) and tables for reliable comparison and tracking of Indonesian legislation changes.

## Current State

**Shipped:** v3.0 — Optimasi, Cleanup & Fitur Lanjutan (2026-08-07)
- Implemented a lightweight background task queue using a PostgreSQL-backed polling worker.
- Restructured PDF processing and sync routes to execute asynchronously (using `202 Accepted` flow).
- Integrated OpenAI Structured Outputs with Zod validation schemas for deterministic article extraction.
- Introduced hierarchical chunking for large document parsing to avoid heuristic token limitation/regex fallback.
- Parallelized Vision OCR page extraction with `p-limit` concurrency mapping.
- Added random User-Agent headers to protect Judicial Review scraping against IP blocking.
- Integrated LLM-based analysis of MK/MA "Amar Putusan" to map article/ayat dispositions.
- Added OCR selection configuration (`AUTO`, `FORCE`, `SKIP`) in the admin interface and backend.
- Developed MD5 hash caching to eliminate redundant extraction of duplicate PDF documents.
- Refactored Express backend to achieve strict TypeScript compliance and clean up warning types.

**Shipped:** v2.0 — Pemisahan Service Frontend dan Backend (2026-08-07)
- Decoupled Next.js application into a frontend and Express.js backend monorepo.
- Backend handles Prisma/PostgreSQL, MinIO, and Docling PDF extraction services.
- Frontend acts as a thin BFF proxy using Server Actions and API routing.
- NextAuth credentials provider integrated with Express authentication API.
- Multi-container Docker Compose setup with automated migrations (`db-migrate`).

**Shipped:** v1.0 — Integrasi Docling (2026-08-07)
- Docling microservice integrated via docker-compose with automatic fallback
- Layout-aware PDF extraction producing structured Markdown for LLM parsing
- Table extraction preserved in Markdown format (`| col | col |`)
- `extractionMethod` column in DB tracks which engine processed each version
- Visual Docling/Fallback badges on Version Timeline page

## Next Milestone: Planning Next Milestone

**Goal:** To be determined in planning of next milestone.

## Requirements

### Validated

- ✓ **ASYNC-01**: Database model `ProcessTask` for background task queue tracking — v3.0
- ✓ **ASYNC-02**: Integrated lightweight background task queue worker in Express backend — v3.0
- ✓ **ASYNC-03**: Authenticated REST API endpoint `GET /api/tasks/:id` for progress tracking — v3.0
- ✓ **ASYNC-04**: Frontend polling integration and progress UI in manual regulation upload page — v3.0
- ✓ **STRUC-01**: OpenAI Structured Outputs (Response Format Zod schema) for deterministic article parsing — v3.0
- ✓ **CHUNK-01**: Hierarchical chunking logic for large documents (>20,000 chars) before merging — v3.0
- ✓ **PAR-01**: Page-parallelized Vision OCR execution restricted by `p-limit` — v3.0
- ✓ **JR-01**: Anti-blocking scrapers with random User-Agent rotation for MK/MA query resilience — v3.0
- ✓ **JR-02**: LLM Amar Putusan parser determining precise legal dispositions of tested articles — v3.0
- ✓ **OCR-01**: OCR Mode selection (`AUTO`/`FORCE`/`SKIP`) in UI admin and backend — v3.0
- ✓ **PERF-01**: MD5 hash caching of PDF extraction to prevent redundant processing — v3.0
- ✓ **CLEAN-01**: TypeScript strict typing compliance refactoring (removed unsafe `any` types) — v3.0
- ✓ **MONO-01**: Next.js source moved to `frontend/` — v2.0
- ✓ **MONO-02**: Express.js + TS backend boilerplate in `backend/` — v2.0
- ✓ **MONO-03**: Monorepo root script delegation & workspace config — v2.0
- ✓ **MONO-04**: Shared TypeScript interfaces/types mapping — v2.0
- ✓ **API-01**: Prisma schema & client migration to `backend/` — v2.0
- ✓ **API-02**: MinIO storage integration in `backend/` — v2.0
- ✓ **API-03**: PDF Extraction, LLM parser & OCR services in `backend/` — v2.0
- ✓ **API-04**: Express REST API endpoints (CRUD/Auth) — v2.0
- ✓ **API-05**: Multer multi-part upload middleware in backend — v2.0
- ✓ **API-06**: CORS config for secure frontend-backend communication — v2.0
- ✓ **FE-01**: Server actions delegating DB operations to backend API — v2.0
- ✓ **FE-02**: File upload form streaming multi-part data via BFF — v2.0
- ✓ **FE-03**: Defensive SSR and UI error banners handling API failure — v2.0
- ✓ **AUTH-01**: NextAuth login credentials verified via Express API — v2.0
- ✓ **AUTH-02**: User-context headers (`X-User-Id` & `X-User-Role`) propagation — v2.0
- ✓ **OPS-01**: Decoupled `frontend` and `backend` services in Docker Compose — v2.0
- ✓ **OPS-02**: Decoupled networking for inter-container routing — v2.0
- ✓ **OPS-03**: Isolated `.env` files mapping per workspace — v2.0
- ✓ **QA-01**: Separate unit tests runner setup (Vitest) — v2.0
- ✓ **QA-02**: E2E smoke test script running in dockerized setup — v2.0
- ✓ **INF-01**: `docling-serve` service in docker-compose — v1.0
- ✓ **INF-02**: `DOCLING_API_URL` env var on `app` service — v1.0
- ✓ **INF-03**: Health check for `docling-serve` — v1.0
- ✓ **EXT-01**: API client integration for PDF → Docling — v1.0
- ✓ **EXT-02**: Layout-aware text extraction (column separation, structured paragraphs) — v1.0
- ✓ **EXT-03**: Automatic fallback to pdfjs → pdf-parse → ocr-service — v1.0
- ✓ **TAB-01**: Markdown table extraction from PDF regulations — v1.0
- ✓ **TAB-02**: Safe Markdown storage (no rawText truncation) — v1.0
- ✓ **AI-01**: LLM parsing with structured Markdown input and heuristic validation — v1.0
- ✓ **UI-01**: Extraction method badge displayed on detail/upload pages — v1.0

### Active

*(None yet - planning next milestone)*

### Out of Scope

- Hosting Python/Docling engine directly in the Next.js container (deferred to isolated microservice — avoids image bloat, memory pressure)
- Parsing documents in formats other than PDF (PUU regulations are 100% PDF)

## Context

- Shipped v3.0 with process flow optimization, structured LLM parser, robust sync, caching, and clean typescript compilation in 5 phases (2026-08-07).
- Shipped v2.0 with Monorepo separation and BFF pattern in 4 phases (2026-08-07)
- Shipped v1.0 with Docling integration in 4 phases over 1 day (2026-08-06 → 2026-08-07)
- Monorepo structured with `workspaces` in root `package.json` utilizing `concurrently`
- Express backend running on port `3007`, frontend Next.js running on port `3006` (BFF pattern)
- NextAuth credential validation proxied via backend REST API; route authorization protected in Next.js middleware
- Multi-container environment managed by docker-compose containing: `app` (frontend), `backend`, `db-migrate`, `postgres`, `minio`, `docling-serve`
- Automated database migration and seeding executing in `db-migrate` one-shot container before backend starts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|------------|
| Docling via isolated microservice | Keeps Next.js container lightweight; isolates Python/PyTorch RAM usage | ✓ Good — container stays fast |
| Automatic fallback chain | Zero user-visible errors if Docling is down | ✓ Good — transparent to user |
| table-safe `cleanMarkdownText` | Aggressive `cleanPdfText` strips solitary numeric values (table cells) | ✓ Good — tables preserved |
| Remove rawText 100k substring cap | Full Markdown must be stored for LLM to reason on complete document | ✓ Good — no truncation loss |
| Prepend warning banner to rawText on fallback | Downstream consumers can detect non-Docling extraction without schema change | ✓ Good — auditable |
| Heuristic Pasal-count validation | Silent LLM under-parsing is the main accuracy risk | ✓ Good — catches partial parses |
| `extractionMethod` DB column | Enables UI tracing, analytics, and future per-method QA | ✓ Good — backfilled via migration |
| Squash amendment-only parsing in LLM prompt | Perubahan regulations should not re-extract unchanged articles | ✓ Good — reduces noise |
| BFF (Backend-for-Frontend) architecture | Next.js API/actions act as thin proxy, frontend coordinates cookies/auth, backend handles business logic and DB | ✓ Good — scalable structure |
| Stateless authorization context | Frontend propagates `X-User-Id` and `X-User-Role` headers to Express | ✓ Good — keeps API secure and simple |
| One-shot DB-migrate Docker container | Sequentially runs migrations and seeds before backend starts to prevent race condition | ✓ Good — reliable container bootstrap |
| Public Frontend Healthcheck | Shifted Next.js container healthcheck to `/login` instead of `/api/db-status` | ✓ Good — prevents false unhealthy status reporting |
| Background worker polling interval | Lightweight interval polling allows simple stateless concurrency control without message broker dependency | ✓ Good — keeps monorepo simple |
| Structured Outputs via Zod schema | Ensures API-level validation and type compliance of extracted articles | ✓ Good — highly accurate |
| Hierarchical chunking on page breaks | Preserves context bounds and prevents token truncation for large laws (>20k characters) | ✓ Good — zero parsing loss |
| MD5 hashing cache key | Enables fast deduplication of identical PDF files at upload time | ✓ Good — saves API costs |
| OCR mode field mapping | Storing explicit OCR mode selections enables fine-grained control when re-processing | ✓ Good — user-controllable |
| Typed Prisma transaction context | Replacing dynamic client params with explicit generic transaction clients | ✓ Good — type-safe db ops |

## Constraints

- **Tech Stack**: Next.js App Router (React 19) + Express.js + TypeScript + Prisma + PostgreSQL
- **Infrastructure**: Runs in Docker/docker-compose locally; Next.js on port `3006`, Express Backend on port `3007`, Docling on port `5001`
- **Runtime**: Docling model (PyTorch) requires significant RAM/CPU — must be isolated from web server
- **Language**: Indonesian legal document corpus — all prompt engineering must be Indonesian-aware

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-07 after completing v3.0 milestone (Optimasi, Cleanup & Fitur Lanjutan)*

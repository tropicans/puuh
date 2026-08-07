# Milestones

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

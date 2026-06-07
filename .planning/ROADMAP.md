# Roadmap: PUU Tracker Stabilization

## Overview

Stabilize and enhance the PUU Indonesian legislation tracking application. This roadmap moves the codebase from a dormant state to a secure, performant, and well-tested system by resolving environment configuration, securing route layouts, parallelizing vision OCR chunking, and setting up an automated testing framework.

## Phases

- [x] **Phase 1: Environment & Authentication Security Stabilization** - Align database ports, set up migrations, and implement role guards.
- [x] **Phase 2: PDF Parsing & OCR Processing Optimizations** - Parallelize vision OCR chunking and improve parser fallback logic. (completed 2026-06-07)
- [ ] **Phase 3: Diff Engine Verification & Testing Pipeline** - Add Vitest framework and write diff engine unit tests.

---

## Phase Details

### Phase 1: Environment & Authentication Security Stabilization

**Goal**: Align local port mapping, set up DB schema migrations, and implement layout page Guards.
**Mode**: mvp
**Depends on**: Nothing
**Requirements**: [SEC-01, SEC-02, SEC-03, SEC-04]
**Success Criteria**:

  1. Database connects correctly on port 5434 for local host development.
  2. Prisma schema migration history is saved in `prisma/migrations/`.
  3. The `/upload` and `/manage` pages render an Access Denied panel or redirect unauthorized users.
  4. Plaintext credentials are removed from seed scripts and loaded from env variables.

**Plans**: 2 plans

Plans:

- [x] 01-01: Align database ports and generate the initial Prisma migration.
- [x] 01-02: Guard layout page components and load seed credentials from environment variables.

### Phase 2: PDF Parsing & OCR Processing Optimizations

**Goal**: Speed up scanned PDF uploads by parallelizing vision OCR and improving parser robustness.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: [PERF-01, PERF-02, PERF-03]
**Success Criteria**:

  1. Scanned PDFs process faster by invoking vision OCR chunks in parallel.
  2. Article splitter parses text with minor OCR typos without dropping sections.
  3. MinIO file download links resolve correctly in both browser and Docker container contexts.

**Plans**: 2 plans
Plans:

- [x] 02-01: Parallelize chunk processing in `ocr-service.ts`.
- [x] 02-02: Enhance Regex parser robustness and resolve MinIO download hostname differences.

### Phase 3: Diff Engine Verification & Testing Pipeline

**Goal**: Set up the Vitest testing runner and write unit tests verifying the verbatim LCS diff engine.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: [TEST-01, TEST-02]
**Success Criteria**:

  1. Test suite runs and passes using `npm test`.
  2. The verbatim LCS diff engine (`src/lib/diff-engine.ts`) is covered by unit tests.

**Plans**: 1 plan
Plans:

- [ ] 03-01: Install Vitest and write diff engine unit tests.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Environment & Auth Security | 2/2 | Complete | 2026-06-07 |
| 2. Parser & OCR Optimization | 2/2 | Complete    | 2026-06-07 |
| 3. Testing Pipeline | 0/1 | Not started | - |

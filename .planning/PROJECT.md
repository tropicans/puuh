# PUU Tracker

## What This Is

PUU Tracker is a Next.js full-stack application designed to track, store, and analyze Indonesian legislation (Peraturan Perundang-Undangan). It processes legal PDF files, extracts verbatim text using standard libraries (falling back to LLM Vision OCR for scanned pages), and calculates word-by-word diffs between legislation versions using a custom Longest Common Subsequence (LCS) engine.

## Core Value

Enable users to trace and visualize verbatim changes in articles across different versions of Indonesian legislation.

## Current Milestone: v1.4 Fix Automatic Regulation Fetcher

**Goal:** Fix the automatic regulation fetcher failure, specifically for Perpres No. 82 Tahun 2018, by correcting PDF parsing and filtering issues.

**Target features:**
- Fix `pdf-parse` import/usage crash due to library API mismatch (it uses modern `PDFParse` class instead of legacy function).
- Fix JDIH BPK search results filtering by decoding URI components (filename/slugs) to match spaces and special characters.
- Verify automatic fetching of Indonesian regulations (like Peraturan Presiden No. 82 Tahun 2018) succeeds, is parsed, and is compared.

## Requirements

### Validated

- ✓ **PDF Upload & Storage** — PDF upload streaming to MinIO object storage (`src/app/api/upload/route.ts`).
- ✓ **Digital PDF Text Extraction** — Extracted digital page characters using `pdfjs-dist` and `pdf-parse` (`src/lib/pdf-service.ts`).
- ✓ **Scanned PDF Vision OCR** — Vision-based character extraction using `gemini-2.5-flash` model (`src/lib/ocr-service.ts`).
- ✓ **LLM-assisted Article Parser** — Parsing raw text into JSON arrays of verbatim articles (`src/lib/ai-service.ts`).
- ✓ **Verbatim LCS Diff Engine** — Longest Common Subsequence word-level text comparison (`src/lib/diff-engine.ts`).
- ✓ **Credentials Authentication** — Credentials-based sign-in using NextAuth and PostgreSQL database persistence (`src/lib/auth.ts`).
- ✓ **Environment & Auth Security Stabilization (v1.0)** — Aligned database ports, Prisma migrations schema, role guards, and environment credentials.
- ✓ **Parser & OCR Optimizations (v1.0)** — Parallelized Vision OCR chunks, regex fallback parser hardening, and MinIO proxy hostname mapping.
- ✓ **Diff Engine Verification (v1.0)** — Vitest environment config and automated unit tests for diff-engine compare logic.
- ✓ **PDF Page-Splitting Fallback (v1.1)** — Try/catch page-by-page fallback processing in the PDF upload and parsing pipeline.
- ✓ **Complete Documentation (v1.2)** — Created User Guide, Developer Guide, System Architecture, API Specification, and Deployment/Setup Instructions in the `docs` folder.
- ✓ **Core Feature Verification (v1.3)** — Verified Docker container build/runtime, database migration/seeding, MinIO storage operations, digital PDF extraction, Vision OCR concurrency worker logic, article parser regex fallbacks, LCS diff engine unit tests, and NextAuth route protection guards.

### Active

- **Automatic Regulation Fetcher Stabilization (v1.4)** — Fix automatic regulation fetcher failure, specifically for Perpres No. 82 Tahun 2018, by correcting PDF parsing and filtering issues.


### Out of Scope

- **Public registration** — Only seeded admin/viewer accounts are allowed to access protected features.
- **Support for non-PDF files** — System is built exclusively for Indonesian legal files in PDF format.

## Context

The codebase is a Next.js App Router project leveraging React 19, Prisma, PostgreSQL, MinIO, and a custom LLM proxy. It was stabilized in Milestone v1.0, resolving environment configuration, auth guards, OCR performance, and setting up Vitest unit testing. Milestone v1.1 adds robust PDF splitting error recovery and semantic legal search.

## Constraints

- **Tech Stack**: Must use React 19, Next.js (App Router), Tailwind CSS v4, Prisma, PostgreSQL, and MinIO storage.
- **Portability**: All file storage paths and API endpoints must remain compatible with the custom proxy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus on Stabilization | The core features (PDF parsing, diffing) exist but need environment, security, and performance cleanup. | — Pending |

---

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
*Last updated: 2026-06-13 for Milestone v1.4*

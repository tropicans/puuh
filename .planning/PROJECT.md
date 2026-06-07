# PUU Tracker

## What This Is

PUU Tracker is a Next.js full-stack application designed to track, store, and analyze Indonesian legislation (Peraturan Perundang-Undangan). It processes legal PDF files, extracts verbatim text using standard libraries (falling back to LLM Vision OCR for scanned pages), and calculates word-by-word diffs between legislation versions using a custom Longest Common Subsequence (LCS) engine.

## Core Value

Enable users to trace and visualize verbatim changes in articles across different versions of Indonesian legislation.

## Requirements

### Validated

- ✓ **PDF Upload & Storage** — PDF upload streaming to MinIO object storage (`src/app/api/upload/route.ts`).
- ✓ **Digital PDF Text Extraction** — Extracted digital page characters using `pdfjs-dist` and `pdf-parse` (`src/lib/pdf-service.ts`).
- ✓ **Scanned PDF Vision OCR** — Vision-based character extraction using `gemini-2.5-flash` model (`src/lib/ocr-service.ts`).
- ✓ **LLM-assisted Article Parser** — Parsing raw text into JSON arrays of verbatim articles (`src/lib/ai-service.ts`).
- ✓ **Verbatim LCS Diff Engine** — Longest Common Subsequence word-level text comparison (`src/lib/diff-engine.ts`).
- ✓ **Credentials Authentication** — Credentials-based sign-in using NextAuth and PostgreSQL database persistence (`src/lib/auth.ts`).

### Active

- [ ] **SEC-01**: Resolve host-container database port mismatch in config files.
- [ ] **SEC-02**: Setup standard Prisma database migrations flow.
- [ ] **SEC-03**: Implement page-level role-based guards for `/upload` and `/manage` views.
- [ ] **SEC-04**: Eliminate plaintext hardcoded credentials from the seed script.
- [ ] **PERF-01**: Optimize scanned PDF vision OCR via parallel chunk processing.
- [ ] **PERF-02**: Harden Regex article-splitting fallback parser robustness.
- [ ] **PERF-03**: Fix MinIO host URL resolution for client download requests.
- [ ] **TEST-01**: Configure Vitest framework and scripts.
- [ ] **TEST-02**: Implement automated unit tests verifying the verbatim LCS diff engine.

### Out of Scope

- **Public registration** — Only seeded admin/viewer accounts are allowed to access protected features.
- **Support for non-PDF files** — System is built exclusively for Indonesian legal files in PDF format.

## Context

The codebase is a Next.js App Router project leveraging React 19, Prisma, PostgreSQL, MinIO, and a custom LLM proxy. It was mapped successfully on 2026-06-07. A forensic review identified minor technical debts (port alignment, missing migrations, and hardcoded credentials) and performance opportunities (sequential OCR speed) that this project cycle will address.

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
*Last updated: 2026-06-07 after initialization*

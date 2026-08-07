# PUU Tracker

## What This Is

A web application to track, compare, and analyze changes in Indonesian laws and regulations (Peraturan Perundang-Undangan - PUU). It enables uploading PDFs, extracting text via a layout-aware Docling microservice (with automatic fallback to pdfjs/OCR), identifying articles (pasal) with LLM assistance, and diffing versions of regulations. Extraction method metadata is stored and surfaced visually in the UI.

## Core Value

Ensure highly accurate extraction and representation of legal clauses (pasal) and tables for reliable comparison and tracking of Indonesian legislation changes.

## Current State

**Shipped:** v1.0 — Integrasi Docling (2026-08-07)
- Docling microservice integrated via docker-compose with automatic fallback
- Layout-aware PDF extraction producing structured Markdown for LLM parsing
- Table extraction preserved in Markdown format (`| col | col |`)
- `extractionMethod` column in DB tracks which engine processed each version
- Visual Docling/Fallback badges on Version Timeline page

## Current Milestone: v2.0 Pemisahan Service Frontend dan Backend

**Goal:** Memisahkan aplikasi monolitik Next.js menjadi frontend terpisah (Next.js) dan backend API terpisah (Express + TypeScript) dalam satu repositori (monorepo).

**Target features:**
- Struktur folder baru `frontend/` dan `backend/`.
- Migrasi database (Prisma), file storage (Minio), dan service extraction (Docling/LLM) ke backend Express.
- Integrasi API frontend-backend untuk data flow dan upload dokumen.
- Konfigurasi docker-compose baru untuk mengorkestrasi seluruh service secara lokal.

## Requirements

### Validated

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

*(none — v2.0 requirements to be defined in REQUIREMENTS.md)*

### Out of Scope

- Hosting Python/Docling engine directly in the Next.js container (deferred to isolated microservice — avoids image bloat, memory pressure)
- Parsing documents in formats other than PDF (PUU regulations are 100% PDF)
- Built-in Docling OCR toggle (OCR-01) — deferred to v2
- Extraction result caching (PERF-01) — deferred to v2

## Context

- Shipped v1.0 with Docling integration in 4 phases over 1 day (2026-08-06)
- Tech stack: Next.js App Router (React 19) + Prisma + PostgreSQL + docling-serve (Docker)
- Docling runs as a CPU-only microservice on port `5001` inside docker-compose network
- Fallback chain: Docling → pdfjs → pdf-parse → ocr-service; each level prepends a warning banner to rawText
- LLM heuristic: compares `Pasal` keyword count in raw text to parsed article count; falls back to regex if discrepancy detected
- Known technical debt: OCR-01 (dynamic OCR toggle) and PERF-01 (extraction caching) deferred

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

## Constraints

- **Tech Stack**: Next.js App Router (React 19) + Prisma + PostgreSQL (Backend: Express.js + TypeScript)
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
*Last updated: 2026-08-07 after starting v2.0 milestone (Pemisahan Service Frontend dan Backend)*

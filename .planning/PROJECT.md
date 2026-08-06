# PUU Tracker

## What This Is

A web application to track, compare, and analyze changes in Indonesian laws and regulations (Peraturan Perundang-Undangan - PUU). It enables uploading PDFs, extracting text using a combination of digital extraction and Vision OCR, identifying articles (pasal), and diffing versions of regulations.

## Core Value

Ensure highly accurate extraction and representation of legal clauses (pasal) and tables for reliable comparison and tracking of Indonesian legislation changes.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **DOC-01**: Integrasi Docling sebagai parser PDF berbasis layout-aware menggunakan microservice terpisah.
- [ ] **DOC-02**: Ekstraksi tabel peraturan secara presisi dalam format Markdown terstruktur.
- [ ] **DOC-03**: Optimasi downstream LLM parsing untuk ekstraksi pasal menggunakan Markdown hasil Docling.

### Out of Scope

- Hosting Python/Docling engine langsung di dalam Next.js container (didefer ke service terpisah untuk menghindari image bloat).
- Parsing dokumen selain format PDF (seperti DOCX, PPTX).

## Context

- Dokumen hukum Indonesia (PUU) sering kali memiliki struktur kompleks, daftar hierarkis (a, b, c), penjelasan dua kolom, serta tabel tarif/penalti.
- Ekstraksi PDF konvensional (`pdfjs-dist`) sering kali merusak urutan baca pada teks multi-kolom dan merusak struktur tabel.
- OCR berbasis Vision LLM berbiaya tinggi dan memiliki latensi besar untuk dokumen berukuran besar.

## Constraints

- **Tech Stack**: Next.js App Router (React 19) + Prisma.
- **Infrastruktur**: Harus berjalan lancar dalam Docker/docker-compose lokal dengan port Next.js `3006`.
- **Runtime**: Model pemrosesan ML Docling membutuhkan RAM & CPU yang besar; harus diisolasi agar tidak mengganggu performa server web utama.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Menggunakan Docling via microservice terpisah | Menjaga container Next.js tetap ringan, menghindari crash akibat kehabisan memori, dan mengisolasi dependensi Python/PyTorch. | — Pending |

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
*Last updated: 2026-08-06 after initializing Milestone v1.0 (Integrasi Docling)*

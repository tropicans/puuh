# Roadmap: PUU Tracker - Integrasi Docling

## Overview

Perjalanan integrasi Docling untuk meningkatkan akurasi ekstraksi struktur pasal dan tabel dari PDF hukum (PUU). Integrasi ini dilakukan secara bertahap mulai dari penyiapan microservice terpisah, penulisan adapter klien di backend dengan fallback otomatis, pemrosesan output Markdown/tabel terstruktur, hingga tuning parsing artikel oleh LLM dan visualisasi status di UI.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions

- [x] **Phase 1: Infrastruktur & Integrasi Docker** - Menyiapkan container `docling-serve` dan environment variables.
- [ ] **Phase 2: Core PDF Service Integration** - Membangun API client Docling dengan penanganan kegagalan (*fallback*) otomatis.
- [ ] **Phase 3: Pemrosesan Tabel & Markdown** - Menangani konversi tabel ke format Markdown terstruktur dan pembersihan teks.
- [ ] **Phase 4: LLM & UI Integration** - Menyuplai Markdown hasil Docling ke LLM parser pasal dan menampilkan indikator ekstraksi di frontend.

## Phase Details

### Phase 1: Infrastruktur & Integrasi Docker

**Goal**: Service `docling-serve` berjalan secara lokal dan terisolasi dari container utama.
**Depends on**: Nothing (first phase)
**Requirements**: INF-01, INF-02, INF-03
**Success Criteria** (what must be TRUE):

  1. Service `docling-serve` berjalan lancar di port `5001` via docker-compose.
  2. Next.js app dapat mendeteksi variabel `DOCLING_API_URL`.
  3. Health check container berjalan sukses.

**Plans**: 1 plan

Plans:

- [x] 01-01: Konfigurasi docker-compose.yml, environment vars, dan verifikasi status service.

### Phase 2: Core PDF Service Integration

**Goal**: Mengubah `pdf-service.ts` agar mengirimkan PDF ke Docling dan otomatis melakukan fallback ke engine lama jika gagal.
**Depends on**: Phase 1
**Requirements**: EXT-01, EXT-02, EXT-03
**Success Criteria** (what must be TRUE):

  1. Backend Next.js dapat mengirim file PDF ke Docling dan menerima respons teks Markdown/JSON.
  2. Jika service Docling dimatikan, proses upload PDF secara otomatis menggunakan parser `pdfjs`/`pdf-parse`/OCR lama tanpa menyebabkan error pada pengguna.

**Plans**: 1 plan
Plans:

- [ ] 02-01: Implementasi Docling client adapter dan logika fallback otomatis di pdf-service.ts.

### Phase 3: Pemrosesan Tabel & Markdown

**Goal**: Memastikan tabel terkonversi menjadi format Markdown Table yang bersih dan disimpan dengan aman.
**Depends on**: Phase 2
**Requirements**: TAB-01, TAB-02
**Success Criteria** (what must be TRUE):

  1. Dokumen uji berisi tabel hukum (seperti daftar tarif) terekstrak menjadi format Markdown tabel (`| ... |`) yang valid.
  2. Teks Markdown tersimpan lengkap di database/storage.

**Plans**: 1 plan

Plans:

- [ ] 03-01: Modifikasi teks processor untuk menangani Markdown dan konversi tabel.

### Phase 4: LLM & UI Integration

**Goal**: Meningkatkan akurasi pemisahan pasal menggunakan teks Markdown serta menunjukkan metode ekstraksi di UI.
**Depends on**: Phase 3
**Requirements**: AI-01, UI-01
**Success Criteria** (what must be TRUE):

  1. LLM di `parseArticlesFromText` memproses teks Markdown terstruktur dan mengembalikan array pasal dengan format yang lebih akurat.
  2. Pada halaman detail/upload peraturan, tertulis metode ekstraksi yang digunakan (contoh: "docling").

**Plans**: 1 plan

Plans:

- [ ] 04-01: Update prompt AI service untuk parsing pasal terstruktur dan penyesuaian log/UI detail upload.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastruktur & Integrasi Docker | 1/1 | Complete    | 2026-08-06 |
| 2. Core PDF Service Integration | 0/1 | Not started | - |
| 3. Pemrosesan Tabel & Markdown | 0/1 | Not started | - |
| 4. LLM & UI Integration | 0/1 | Not started | - |

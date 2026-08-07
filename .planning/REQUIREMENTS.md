# Requirements: v3.0 — Optimasi, Cleanup & Fitur Lanjutan

**Milestone:** v3.0
**Status:** In Planning

---

## v3 Requirements

### 1. Asynchronous Background Processing (ASYNC)
- [ ] **ASYNC-01**: Implementasikan model database `ProcessTask` untuk melacak tugas latar belakang (upload/ekstraksi PDF dan sinkronisasi JR).
- [ ] **ASYNC-02**: Buat background worker terintegrasi (ringan, berbasis interval polling) di backend Express untuk memproses antrean `ProcessTask`.
- [ ] **ASYNC-03**: Sediakan endpoint API `GET /api/tasks/:id` untuk memantau status (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`), progress, error, dan hasil dari tugas.
- [ ] **ASYNC-04**: Hubungkan frontend upload page dan sync button untuk mengirim tugas secara asinkron, menampilkan indikator progress real-time berbasis polling, dan memvalidasi hasil saat selesai.

### 2. LLM Structured Outputs & Advanced Article Structuring (STRUC & CHUNK)
- [ ] **STRUC-01**: Gunakan fitur Structured Outputs dari OpenAI/LLM SDK (JSON Schema/Response Format) untuk ekstraksi pasal agar data selalu valid sesuai skema JSON tanpa bergantung pada pencarian regex mentah.
- [ ] **CHUNK-01**: Implementasikan chunking berjenjang (seperti memproses per halaman atau bab) untuk dokumen besar (> 20.000 karakter) sebelum digabungkan kembali, guna meminimalkan penggunaan fallback Regex yang kurang akurat.

### 3. Paralelisasi Vision OCR (PAR)
- [ ] **PAR-01**: Konfigurasikan pemanggilan API Vision OCR secara paralel menggunakan pembatas konkurensi (seperti `p-limit`) untuk memproses halaman PDF hasil pindai secara simultan tanpa melebihi batas batas laju API (*rate limits*).

### 4. Sinkronisasi Judicial Review yang Resilien & Cerdas (JR)
- [ ] **JR-01**: Gunakan Search API resmi atau strategi request tahan-blokir (seperti custom user-agents, proxy rotators) untuk mencari putusan di MK/MA guna meminimalkan risiko CAPTCHA/blokir IP.
- [ ] **JR-02**: Manfaatkan LLM untuk menguraikan teks "Amar Putusan" MK/MA secara cerdas dan memetakan dampaknya ke pasal terkait secara presisi (disposisi: `INVALIDATED`, `CONDITIONALLY_VALID`, dll.).

### 5. Fitur Kustomisasi & Performa (OCR & PERF)
- [ ] **OCR-01**: Sediakan toggle kustom Docling OCR di UI admin untuk memaksa/mematikan OCR per dokumen.
- [ ] **PERF-01**: Implementasikan caching hasil ekstraksi teks (misal mencocokkan MD5 hash berkas PDF) untuk menghindari ekstraksi ulang dokumen yang sama demi menghemat biaya API dan waktu pemrosesan.

### 6. Pembersihan Hutang Teknis (Refactoring)
- [ ] **CLEAN-01**: Lakukan refactoring kode backend untuk menghapus tipe data `any` yang tidak perlu demi memenuhi aturan strict TypeScript.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ASYNC-01    | Phase 9 | In Planning |
| ASYNC-02    | Phase 9 | In Planning |
| ASYNC-03    | Phase 9 | In Planning |
| ASYNC-04    | Phase 10 | In Planning |
| STRUC-01    | Phase 11 | In Planning |
| CHUNK-01    | Phase 11 | In Planning |
| PAR-01      | Phase 10 | In Planning |
| JR-01       | Phase 12 | In Planning |
| JR-02       | Phase 12 | In Planning |
| OCR-01      | Phase 13 | In Planning |
| PERF-01     | Phase 13 | In Planning |
| CLEAN-01    | Phase 13 | In Planning |

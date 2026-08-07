# Requirements: PUU Tracker - Integrasi Docling

**Defined:** 2026-08-06
**Core Value:** Ensure highly accurate extraction and representation of legal clauses (pasal) and tables for reliable comparison and tracking of Indonesian legislation changes.

## v1 Requirements

Requirements for the v1.0 milestone. Each maps to roadmap phases.

### Infrastructure & Setup

- [x] **INF-01**: Menambahkan service `docling-serve` (CPU-based) ke dalam `docker-compose.yml` agar berjalan di jaringan internal Docker.
- [x] **INF-02**: Mendefinisikan environment variable `DOCLING_API_URL` pada service `app` untuk mengarah ke endpoint `docling-serve`.
- [x] **INF-03**: Menambahkan pemeriksaan status/kesehatan (*health check*) untuk service `docling-serve` agar Next.js tahu kapan service siap digunakan.

### Layout-Aware PDF Parser

- [x] **EXT-01**: Mengintegrasikan API client pada Next.js backend (menggunakan `docling-sdk` atau direct HTTP fetch) untuk mengirimkan PDF ke service Docling.
- [x] **EXT-02**: Melakukan ekstraksi teks layout-aware (pemisahan kolom, penanganan paragraf terstruktur).
- [x] **EXT-03**: Implementasi mekanisme *fallback* otomatis ke engine ekstraksi lama (`pdfjs` -> `pdf-parse` -> `ocr-service`) jika service Docling tidak dapat diakses atau gagal memproses PDF.

### Table & Markdown Extraction

- [x] **TAB-01**: Mengidentifikasi dan mengekstraksi tabel-tabel di dalam PDF peraturan ke format Markdown Table (`| col1 | col2 |`).
- [x] **TAB-02**: Menyimpan dan membersihkan output teks terstruktur berupa Markdown secara aman ke database/storage.

### Downstream LLM & UI Integration

- [x] **AI-01**: Menyuplai teks Markdown hasil Docling ke modul parser pasal berbasis AI (`parseArticlesFromText`) untuk meningkatkan akurasi identifikasi pasal, ayat, dan list hierarkis.
- [x] **UI-01**: Menampilkan informasi metode ekstraksi ("docling") pada halaman log upload / admin untuk visibilitas penelusuran.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Performance & OCR Tuning

- **OCR-01**: Mengaktifkan/menonaktifkan built-in OCR di Docling secara dinamis via API parameter berdasarkan jenis PDF (digital vs scanned).
- **PERF-01**: Cache hasil ekstraksi Docling untuk PDF yang sama guna menghemat memori dan waktu komputasi.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Hosting model/PyTorch langsung di Next.js | Bloat Docker image (~2-3GB) dan membebani resource memory server Next.js. |
| Integrasi parsing format Non-PDF | Dokumen peraturan perundang-undangan (PUU) resmi Indonesia 100% menggunakan format PDF. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INF-01 | Phase 1 | Validated |
| INF-02 | Phase 1 | Validated |
| INF-03 | Phase 1 | Validated |
| EXT-01 | Phase 2 | Complete |
| EXT-02 | Phase 2 | Complete |
| EXT-03 | Phase 2 | Complete |
| TAB-01 | Phase 3 | Complete |
| TAB-02 | Phase 3 | Complete |
| AI-01 | Phase 4 | Complete |
| UI-01 | Phase 4 | Complete |
| OCR-01 | Deferred | Pending |
| PERF-01 | Deferred | Pending |

**Coverage:**

- v1 requirements: 10 total
- v2 requirements: 2 total
- Mapped to phases: 10
- Unmapped: 2 ✓

---
*Requirements defined: 2026-08-06*
*Last updated: 2026-08-07 after Phase 4 completion — AI-01 and UI-01 marked complete*

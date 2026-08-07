# Phase 2: Core PDF Service Integration - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Mengintegrasikan API client pada Next.js backend untuk mengirimkan PDF ke service `docling-serve` (berjalan di `http://docling-serve:5001/v1/convert/file` menggunakan environment variable `DOCLING_API_URL`) dan mengimplementasikan mekanisme fallback otomatis ke rantai pemrosesan digital/OCR yang sudah ada (`pdfjs` -> `pdf-parse` -> `ocr-service`) jika terjadi kegagalan koneksi, kegagalan pemrosesan, atau timeout pada Docling.

</domain>

<decisions>
## Implementation Decisions

### Fallback Strategy & Timeout
- **D-01:** Batas waktu (timeout) pemanggilan API Docling dibatasi maksimal 15 detik sebelum memicu proses fallback alternatif.
- **D-02:** Logika fallback akan otomatis dipicu jika terjadi kesalahan jaringan (network error), batas waktu habis (timeout), serta status respons HTTP non-200.
- **D-03:** Pengecekan status kesehatan dari service `docling-serve` dilakukan secara direct call (langsung mengirim request konversi ke `/v1/convert/file` dan menangkap errornya), tanpa melakukan pengecekan endpoint `/health` secara terpisah sebelum memproses upload.
- **D-04:** Detail kesalahan (error) pemanggilan Docling akan dicatat (logged) secara mendalam di server logs (stdout/stderr) untuk keperluan debugging pengembang, sementara transisi fallback ke metode pembacaan digital lainnya berjalan transparan bagi pengguna.

### API Request & Parameters
- **D-05:** Menggunakan endpoint HTTP POST `/v1/convert/file` untuk melakukan konversi file PDF secara sinkron (synchronous conversion).
- **D-06:** Mengirimkan parameter `to_formats: ['md']` agar output yang dihasilkan dari Docling hanya berupa Markdown (menghemat payload transfer dan komputasi).
- **D-07:** Konfigurasi OCR pada Docling menggunakan pengaturan bawaan microservice (default), di mana Docling mendeteksi kebutuhan OCR secara otomatis.
- **D-08:** Request multipart/form-data dibangun menggunakan objek global native Node.js 20+ `FormData` dan `fetch` API standar, tanpa dependensi eksternal tambahan.

### Progress & Logging
- **D-09:** Mengirimkan pesan pemrosesan progress ke client-side stream berformat `'Mencoba membaca teks menggunakan Docling...'` di awal proses, dan pesan `'Teks berhasil diekstrak (docling): X karakter'` saat proses ekstraksi berhasil.
- **D-10:** Menambahkan nilai `'docling'` pada type signature method ekstraksi (`method: 'pdfjs' | 'pdf-parse' | 'ocr' | 'docling'`) yang dikembalikan oleh function `smartExtractPdfText`.
- **D-11:** Ketika fallback terjadi, pesan transisi yang informatif (seperti `'Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...'`) akan dikirimkan ke client-side progress stream.
- **D-12:** Jika API `docling-serve` mengembalikan status non-200 (misalnya 422 validation error), server logs akan mencatat body respons error JSON secara lengkap sebelum melanjutkan proses fallback.

### the agent's Discretion
Semua area dikonfigurasi sesuai preferensi dan persetujuan eksplisit dari pengguna. Tidak ada area keputusan yang didelegasikan ke diskresi agen.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF Service & API Code
- [src/lib/pdf-service.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/src/lib/pdf-service.ts) — Berisi fungsi `smartExtractPdfText` yang akan didekorasi dengan Docling client adapter.
- [src/app/api/upload/route.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/src/app/api/upload/route.ts) — Menggunakan service PDF untuk menangani upload dokumen dan streaming progress updates.

### Project Specs & Requirements
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/ROADMAP.md) — Goal detail, success criteria, dan alokasi plan untuk Phase 2.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/REQUIREMENTS.md) — Kebutuhan EXT-01, EXT-02, dan EXT-03 yang dicakup dalam fase ini.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [src/lib/pdf-service.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/src/lib/pdf-service.ts): Fungsi `smartExtractPdfText` yang sudah memiliki pola chain fallback terstruktur (`pdfjs` -> `pdf-parse` -> `ocr-service`) serta callback progress updates `onProgress`.

### Established Patterns
- Penggunaan pattern callback `onProgress?: (msg: string) => void` untuk melacak status pemrosesan dokumen dan meneruskannya ke Server-Sent Events/stream.
- Mekanisme dynamic import untuk modul berukuran besar (seperti dynamic import untuk `ocr-service`).

### Integration Points
- Fungsi `smartExtractPdfText` di `src/lib/pdf-service.ts` sebagai gerbang utama parsing PDF.
- Variabel environment `process.env.DOCLING_API_URL` yang disuntikkan dari docker-compose ke service app.

</code_context>

<specifics>
## Specific Ideas

No external specs — requirements fully captured in decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-Core PDF Service Integration*
*Context gathered: 2026-08-06*

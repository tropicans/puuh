# Phase 3: Pemrosesan Tabel & Markdown - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Memastikan bahwa output teks Markdown yang dihasilkan oleh Docling (dari Phase 2) — termasuk tabel hukum berformat `| col1 | col2 |` — dapat disimpan secara utuh dan aman ke dalam database, serta tidak dirusak oleh proses pembersihan teks yang terlalu agresif. Phase ini mencakup pembuatan fungsi pembersih teks terpisah untuk output Docling, penghapusan batas pemotongan karakter saat penyimpanan, penambahan penanda peringatan jika fallback terjadi, serta keputusan untuk menyimpan tabel apa adanya tanpa normalisasi kolom.

</domain>

<decisions>
## Implementation Decisions

### Markdown Cleaning Strategy
- **D-01:** Buat fungsi `cleanMarkdownText` baru yang terpisah dari `cleanPdfText` yang sudah ada, khusus untuk membersihkan output Docling. Fungsi ini hanya membersihkan artifact yang tidak mungkin muncul sebagai konten tabel Markdown yang valid (misalnya: baris PRESIDEN/SALINAN yang berdiri sendiri, baris `-N-`, dsb), namun TIDAK menggunakan regex yang dapat menghapus angka tunggal (karena angka-angka tersebut sering muncul sebagai isi sel tabel).
- **D-02:** Fungsi `cleanPdfText` yang sudah ada dipertahankan tanpa modifikasi dan tetap digunakan untuk path fallback (`pdfjs`, `pdf-parse`, `ocr`).

### Batas Penyimpanan Teks Raw
- **D-03:** Hapus pemotongan `.substring(0, 100000)` dari kode penyimpanan versi di `upload/route.ts` secara sepenuhnya. Seluruh teks Markdown harus tersimpan utuh di kolom `rawText` (tipe `TEXT` di PostgreSQL yang dapat menampung hingga 1GB).
- **D-04:** Tidak ada mekanisme penyimpanan file sekunder ke MinIO untuk konten teks — semua tetap di database.

### Representasi Tabel pada Rantai Fallback
- **D-05:** Jika ekstraksi Docling gagal dan fallback terjadi (pdfjs/pdf-parse/ocr), tambahkan teks peringatan berikut di bagian atas `rawText` sebelum disimpan: `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${extractionMethod}). Struktur tabel mungkin tidak terurai dengan sempurna.]`. Peringatan ini hanya disisipkan jika `extractionMethod !== 'docling'`.

### Validasi & Normalisasi Format Tabel
- **D-06:** Simpan teks Markdown dari Docling apa adanya (as-is) tanpa melakukan normalisasi atau penyeimbangan kolom tabel secara otomatis. LLM downstream pada Phase 4 cukup toleran terhadap variasi baris tabel Markdown.

### the agent's Discretion
Semua keputusan dikonfirmasi secara eksplisit oleh pengguna. Tidak ada area yang didelegasikan ke diskresi agen.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core File Target
- `src/lib/pdf-service.ts` — Berisi `smartExtractPdfText` yang menggunakan `cleanPdfText`. Fungsi baru `cleanMarkdownText` harus dibuat di file ini (atau di `utils.ts` jika lebih sesuai konvensi).
- `src/lib/utils.ts` — Berisi `cleanPdfText` yang sudah ada. Fungsi `cleanMarkdownText` yang baru idealnya ditempatkan di sini berdampingan.
- `src/app/api/upload/route.ts` — Tempat penyimpanan `rawText` ke database (baris `rawText: rawText.substring(0, 100000)`), yang perlu diubah.

### Requirements
- `.planning/REQUIREMENTS.md` — TAB-01: ekstraksi tabel ke Markdown Table (`| col1 | col2 |`); TAB-02: simpan dan bersihkan output Markdown secara aman ke database.
- `.planning/ROADMAP.md` — Phase 3 goal dan success criteria.

### Prior Phase Context
- `.planning/phases/02-core-pdf-service-integration/02-CONTEXT.md` — Keputusan Phase 2: `extractionMethod` values (`'pdfjs' | 'pdf-parse' | 'ocr' | 'docling'`), pola `onProgress` callback, pola `cleanPdfText`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cleanPdfText` di `src/lib/utils.ts`: Pola fungsi pembersih teks yang sudah ada. `cleanMarkdownText` harus menggunakan struktur yang sama (string → string) namun dengan set regex yang lebih aman untuk Markdown.
- `extractionMethod` field dari `smartExtractPdfText`: Nilai string ini (`'docling' | 'pdfjs' | 'pdf-parse' | 'ocr'`) tersedia di `upload/route.ts` dan bisa digunakan langsung untuk kondisi penambahan teks peringatan fallback.

### Established Patterns
- Fungsi text-cleaning berbasis string di `utils.ts` (tanpa dependensi eksternal) menggunakan `.replace()` regex berantai.
- Teks peringatan status digunakan di progress stream (`send({ type: 'progress', ... })`). Untuk peringatan di konten teks, mekanismenya serupa namun disisipkan ke `rawText`.

### Integration Points
- `src/app/api/upload/route.ts` baris `rawText: rawText.substring(0, 100000)` → hapus `.substring(0, 100000)`.
- `src/lib/pdf-service.ts` panggilan ke `cleanPdfText(mdText)` di cabang Docling → ganti dengan `cleanMarkdownText(mdText)` yang baru.
- Penambahan blok kondisi di `upload/route.ts` setelah `smartExtractPdfText` untuk menyisipkan teks peringatan fallback ke `rawText`.

</code_context>

<specifics>
## Specific Ideas

- Format peringatan fallback: `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${extractionMethod}). Struktur tabel mungkin tidak terurai dengan sempurna.]\n\n` ditempatkan di awal teks sebelum konten utama.
- `cleanMarkdownText` harus aman terhadap sel tabel `| 1 |` — jadi regex penghapus angka tunggal `/(^|\n)\s*\d+\s*($|\n)/g` dari `cleanPdfText` TIDAK boleh disertakan.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-Pemrosesan Tabel & Markdown*
*Context gathered: 2026-08-06*

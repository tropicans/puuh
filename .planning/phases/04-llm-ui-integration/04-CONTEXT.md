# Phase 4: LLM & UI Integration - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Menyuplai output Markdown terstruktur hasil ekstraksi Docling (dari Phase 3) ke LLM parser pasal (`parseArticlesFromText`) untuk meningkatkan akurasi identifikasi pasal, ayat, dan list hierarkis; serta menampilkan indikator metode ekstraksi yang digunakan ("docling" atau fallback) pada halaman log upload / admin dan detail peraturan di frontend.

</domain>

<decisions>
## Implementation Decisions

### Prompt AI untuk parsing tabel & list
- **D-01:** Pertahankan format tabel Markdown asli. AI dilarang merangkum tabel dan harus menyalin tabel Markdown dari Docling apa adanya di dalam `content` pasal.
- **D-02:** Pertahankan format list Markdown asli. AI dilarang menggabungkan list menjadi paragraf tunggal dan harus mempertahankan indentasi list (seperti `- a.`, `  - 1.`, dll).
- **D-03:** Validasi hasil parsing LLM secara heuristik dengan membandingkan jumlah kata kunci "Pasal" pada teks input dengan jumlah pasal hasil parsing AI. Jika selisihnya signifikan, picu fallback ke regex parsing.
- **D-04:** Tambahkan aturan eksplisit pada system prompt LLM untuk menangani pasal amandemen (perubahan), di mana LLM hanya mengekstrak pasal yang memuat teks perubahan baru/diubah, dan mengabaikan teks rujukan lama yang tidak diubah.

### Integrasi Docling ke Auto-Search
- **D-05:** Refaktor file `regulation-fetcher.ts` agar pemrosesan PDF menggunakan `smartExtractPdfText` (Docling) sebagai pilihan pertama, menggantikan penggunaan parser `pdf-parse` langsung.
- **D-06:** Kirimkan progres detail dari `smartExtractPdfText` (seperti status Docling / fallback) ke UI dengan meneruskan parameter `onProgress` dari auto-search route handler.
- **D-07:** Hasil fallback dari auto-search harus diberi string peringatan fallback `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback...]` di awal `rawText` sebelum disimpan, sama seperti perilaku upload manual.
- **D-08:** Ikuti default timeout 15 detik bawaan dari `smartExtractPdfText` untuk pemanggilan Docling di auto-search.

### Model data & UI indikator metode ekstraksi
- **D-09:** Tambahkan kolom baru `extractionMethod String?` pada model `RegulationVersion` di schema Prisma (dan jalankan migrasi database) untuk mencatat metode ekstraksi yang digunakan secara eksplisit.
- **D-10:** Tampilkan badge metode ekstraksi (misal 'Docling' atau 'Fallback: PDFJS') di samping nama versi pada Version Timeline (detail page) dan di log progress saat upload manual/auto.
- **D-11:** Jalankan skrip migrasi data pasca skema update untuk mengisi nilai `extractionMethod` pada data versi lama (legacy) dengan membaca prefix peringatan fallback dari `rawText` secara dinamis. Jika tidak ada peringatan fallback, default-kan sebagai 'docling'.
- **D-12:** Tampilkan badge metode ekstraksi di Version Timeline dengan visualisasi minimalis: Hijau lembut (`bg-emerald-500/10 text-emerald-400` / `border-emerald-500/20`) untuk 'Docling' dan Oranye lembut (`bg-amber-500/10 text-amber-400` / `border-amber-500/20`) untuk 'Fallback'.

### the agent's Discretion
Semua keputusan dikonfirmasi secara eksplisit oleh pengguna. Tidak ada area yang didelegasikan ke diskresi agen.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core File Target
- `src/lib/ai-service.ts` — Berisi `parseArticlesFromText` yang prompt dan logikanya perlu diperbarui untuk mendukung format Markdown serta validasi jumlah pasal.
- `src/lib/regulation-fetcher.ts` — File utama penelusuran otomatis (auto-search) yang perlu direfaktor untuk menggunakan `smartExtractPdfText`.
- `src/app/api/upload/route.ts` — Menyimpan versi regulasi yang diunggah manual, perlu disesuaikan untuk menyimpan kolom baru `extractionMethod`.
- `src/app/api/regulations/fetch/route.ts` — Menyimpan versi regulasi dari hasil auto-search, perlu disesuaikan untuk menyimpan kolom baru `extractionMethod`.
- `prisma/schema.prisma` — Schema Prisma untuk menambahkan kolom `extractionMethod` ke model `RegulationVersion`.
- `src/app/regulations/[id]/page.tsx` — Halaman detail peraturan yang menampilkan Version Timeline.
- `src/components/regulations/VersionTimeline.tsx` — Komponen timeline yang perlu menampilkan badge metode ekstraksi.

### Requirements
- `.planning/REQUIREMENTS.md` — AI-01 (LLM parsing dengan Docling Markdown) dan UI-01 (Indikator metode ekstraksi di UI).
- `.planning/ROADMAP.md` — Rincian tujuan dan success criteria Phase 4.

### Prior Phase Context
- `.planning/phases/03-pemrosesan-tabel-markdown/03-CONTEXT.md` — Aturan pembersihan Markdown (`cleanMarkdownText`) dan format warning fallback.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `smartExtractPdfText` dari `src/lib/pdf-service.ts` mengekstrak teks menggunakan Docling dengan fallback otomatis ke engine lama.
- `cleanMarkdownText` dari `src/lib/pdf-service.ts` membersihkan output Docling Markdown dengan aman tanpa merusak struktur tabel.

### Established Patterns
- Stream status progres berbasis server-sent events (SSE) mengirim data progress JSON line-by-line ke frontend.
- Badge UI di timeline menggunakan Tailwind classes dan komponen `Badge` dari shadcn/ui.

### Integration Points
- Tambahkan kolom `extractionMethod String?` ke model `RegulationVersion` di `prisma/schema.prisma`.
- Panggil `smartExtractPdfText` di `src/lib/regulation-fetcher.ts`.
- Kirim `extractionMethod` saat membuat `RegulationVersion` di `/api/upload` dan `/api/regulations/fetch`.
- Tampilkan badge di `VersionTimeline.tsx`.

</code_context>

<specifics>
## Specific Ideas

- Pola regex untuk mendeteksi fallback versi lama pada migrasi: `rawText.startsWith('[PERINGATAN:')`.
- AI validation heuristic: `const originalPasalCount = (rawText.match(/\bPasal\s+\d+/gi) || []).length;` dibandingkan dengan `aiArticles.length`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-LLM & UI Integration*
*Context gathered: 2026-08-06*

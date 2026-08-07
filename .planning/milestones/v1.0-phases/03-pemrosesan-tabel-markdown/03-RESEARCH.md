# Phase 3: Pemrosesan Tabel & Markdown - Research

**Researched:** 2026-08-06
**Domain:** Markdown Table Parsing, Text Cleaning, and Storage optimization
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Buat fungsi `cleanMarkdownText` baru yang terpisah dari `cleanPdfText` yang sudah ada, khusus untuk membersihkan output Docling. Fungsi ini tidak menghapus angka tunggal agar tidak merusak sel/kolom tabel Markdown.
- **D-02:** Fungsi `cleanPdfText` yang sudah ada dipertahankan tanpa modifikasi dan tetap digunakan untuk path fallback (`pdfjs`, `pdf-parse`, `ocr`).
- **D-03:** Hapus pemotongan `.substring(0, 100000)` dari kode penyimpanan versi di `upload/route.ts` secara sepenuhnya untuk menyimpan seluruh teks Markdown secara utuh.
- **D-04:** Tidak ada mekanisme penyimpanan file sekunder ke MinIO untuk konten teks — semua tetap disimpan di database.
- **D-05:** Jika ekstraksi Docling gagal dan fallback terjadi (pdfjs/pdf-parse/ocr), tambahkan teks peringatan di awal `rawText` sebelum disimpan: `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${extractionMethod}). Struktur tabel mungkin tidak terurai dengan sempurna.]\n\n`.
- **D-06:** Simpan teks Markdown dari Docling apa adanya (as-is) tanpa melakukan normalisasi atau penyeimbangan kolom tabel secara otomatis.

### the agent's Discretion
Semua keputusan dikonfirmasi secara eksplisit oleh pengguna. Tidak ada area yang didelegasikan ke diskresi agen.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Markdown Text Cleaning | Utility layer (`src/lib/utils.ts`) | — | Pure function `cleanMarkdownText` processes raw Markdown text to remove irrelevant headers/footers and page numbers. |
| Fallback Warning Prep | Backend API Routing | — | Upload API handler checks the extraction method returned by `smartExtractPdfText` and prepends the warning message if fallback occurred. |
| Database Storage | PostgreSQL Database | Prisma ORM | Columns for `rawText` in `RegulationVersion` store full strings without arbitrary truncation. |
</architectural_responsibility_map>

<research_summary>
## Summary

This research focuses on optimizing the processing, cleaning, and storage of layout-aware Markdown and tables produced by the IBM Docling integration in Phase 2. The core objective is preserving the fidelity of tabular structures (e.g. `| col1 | col2 |`) during cleaning and storage.

- **Markdown Cleaning:** Hand-rolled Regex-based cleaning for PDF text (like `cleanPdfText`) removes solitary digits because they are often page numbers. In markdown tables, solitary digits represent cell values (e.g., indexes, percentages, amounts). Therefore, a dedicated `cleanMarkdownText` must retain these numbers while still stripping out headers/footers (e.g. "PRESIDEN REPUBLIK INDONESIA", page numbers like "- 12 -", and "SALINAN").
- **Database Storage limits:** PostgreSQL `TEXT` columns can hold up to 1GB. Arbitrary substrings (like `.substring(0, 100000)`) are unnecessary and harmful to long legal documents.
- **User Indicator:** It is vital for downstream consumers (e.g., LLM processors, administrative users) to know if a document's table structure is unreliable. If a digital or OCR fallback is triggered, prepending a clear, standardized warning to the database record guarantees transparency.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Service | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| PostgreSQL | 15+ | Text Storage | Native `TEXT` column type efficiently stores large strings up to 1GB |
| Vitest | v4+ | Testing framework | Existing project test suite runner |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `cleanMarkdownText` | Markdown AST Parser | Overkill for simple regex substitutions; increases package dependencies and runtime processing time. |
| DB Storage | MinIO file storage | Storing texts in database is simpler and allows direct text query indexation later, avoiding multi-part transactions (DB + S3). |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
No structural changes are needed; we will update the existing backend files:
```
src/
├── lib/
│   ├── utils.ts             # Implement cleanMarkdownText
│   └── pdf-service.ts       # Use cleanMarkdownText inside Docling extraction branch
└── app/
    └── api/
        ├── upload/route.ts                     # Prepend fallback warning, remove substring truncation
        ├── regulations/fetch/route.ts          # Remove substring truncation
        └── versions/[id]/reupload/route.ts     # Remove substring truncation
```

### Pattern 1: Table-Safe Markdown Cleaning
**What:** Regex substitution that leaves solitary numeric cells intact.
**When to use:** On raw Markdown strings extracted via Docling.
**Example:**
```typescript
export function cleanMarkdownText(text: string): string {
  return text
    // Strip headers
    .replace(/(^|\n)\s*PRESIDEN\s+REPUBLIK\s+INDONESIA\s*($|\n)/gi, '\n')
    // Strip page markers
    .replace(/(^|\n)\s*-\s*\d+\s*-\s*($|\n)/g, '\n')
    // Strip SALINAN
    .replace(/(^|\n)\s*SALINAN\s*($|\n)/gi, '\n')
    // Fix multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
```

### Pattern 2: Fallback Prepending
**What:** Prepends warning prefix before database persistence if `method !== 'docling'`.
**When to use:** Right before saving `rawText` to DB.
**Example:**
```typescript
let dbRawText = rawText;
if (extractionMethod !== 'docling') {
    dbRawText = `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${extractionMethod}). Struktur tabel mungkin tidak terurai dengan sempurna.]\n\n${rawText}`;
}
```
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table columns re-alignment | Complex grid-alignment logic | Downstream LLM tolerance / As-Is | Downstream LLMs are robust enough to parse slightly misaligned markdown tables. Manual parsing is brittle. |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Aggressive Regex Stripping Solitary Numbers
**What goes wrong:** Markdown tables representing fee rates or numeric indices turn into blank columns or lose context entirely.
**Why it happens:** Reusing `cleanPdfText` which contains `text.replace(/(^|\n)\s*\d+\s*($|\n)/g, '\n')`.
**How to avoid:** Always route Docling output through `cleanMarkdownText` which excludes this specific replacement rule.
</common_pitfalls>

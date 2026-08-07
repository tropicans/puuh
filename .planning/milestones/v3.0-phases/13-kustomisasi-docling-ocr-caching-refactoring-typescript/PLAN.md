# Phase 13 Plan: Kustomisasi Docling OCR, Caching & Refactoring TypeScript

Menyediakan toggle opsi OCR per dokumen, caching MD5 hash PDF untuk menghindari ekstraksi ulang, dan refactoring backend types untuk membersihkan linting warnings `any`.

## Proposed Changes

### Database Schema & Types
- **backend/prisma/schema.prisma** [MODIFY]:
  - Tambahkan `pdfMd5Hash` ke model `RegulationVersion` beserta indeksnya.
  - Tambahkan `ocrMode` enum (`AUTO`, `FORCE`, `SKIP`) ke model `RegulationVersion`.

### Caching Layer
- **backend/src/lib/pdf-cache.ts** [NEW]:
  - Implementasikan helper `computeMd5` untuk menghitung MD5 hex digest dari buffer PDF.
  - Implementasikan `findCachedVersion` untuk mencari data hasil ekstraksi (`rawText`) berdasarkan MD5 hash.

### PDF Service Customization
- **backend/src/lib/pdf-service.ts** [MODIFY]:
  - Tambahkan tipe `OcrMode` ('AUTO' | 'FORCE' | 'SKIP').
  - Sesuaikan `smartExtractPdfText` untuk menghormati `ocrMode`:
    - `FORCE`: Langsung melompat ke Vision OCR.
    - `SKIP`: Menghindari fallback ke Vision OCR bila metode digital gagal.
    - `AUTO`: Menjalankan pipeline normal.
  - Hapus tipe data `any` yang tidak perlu dan gunakan interface TypeScript yang lebih spesifik untuk `pdfjs-dist`.

### Worker Integration & Types Cleanup
- **backend/src/lib/worker.ts** [MODIFY]:
  - Integrasikan pencarian cache MD5 di awal handler `UPLOAD_PDF`. Jika cocok, kembalikan data langsung tanpa memanggil Docling/OCR.
  - Simpan MD5 hash dan OCR mode terpilih pada record `RegulationVersion` baru.
  - Perbaiki/bersihkan tipe data `any` menjadi strict types (seperti `Prisma.TransactionClient` dan interface payload yang jelas).

### Backend Upload Route
- **backend/src/routes/upload.ts** [MODIFY]:
  - Perbarui schema Zod untuk memvalidasi input `ocrMode`.
  - Teruskan field `ocrMode` ke dalam antrean payload `ProcessTask`.

### Frontend BFF & UI Selector
- **frontend/src/app/api/upload/route.ts** [MODIFY]:
  - Tangkap parameter `ocrMode` dari UI frontend dan teruskan ke backend API.
- **frontend/src/app/upload/page.tsx** [MODIFY]:
  - Tambahkan dropdown pilihan "Mode Ekstraksi Teks" (`ocrMode`) pada upload manual (AUTO, FORCE OCR, SKIP OCR) untuk memberikan kendali ekstraksi bagi Admin.

## Verification Plan

### Automated Tests
- Jalankan regenerasi Prisma client: `npm run db:generate`
- Pastikan kode backend terkompilasi dengan bersih: `npm run build:backend`
- Jalankan test suite backend untuk memastikan tidak ada fungsi yang regresi:
  - `npm run test --workspace=backend`

### Manual / Smoke Verification
- Lakukan manual upload PDF dengan memilih masing-masing opsi OCR Mode.
- Unggah file PDF yang sama dua kali berturut-turut untuk membuktikan berfungsinya cache deduplikasi secara instan.

# Phase 10 Plan: Asynchronous PDF Processing & Frontend Integration

Mengubah alur ekstraksi PDF di backend agar berjalan asinkron melalui antrean, melakukan paralelisasi halaman Vision OCR menggunakan `p-limit`, dan mengintegrasikan visual progress di UI upload frontend.

## Proposed Changes

### Dependencies
- **backend/package.json** [MODIFY]:
  - Tambahkan `p-limit` ke `dependencies` untuk melakukan limitasi konkurensi request Vision OCR halaman PDF.

### Backend Upload & Worker Integrations
- **backend/src/routes/upload.ts** [MODIFY]:
  - Ubah endpoint `POST /api/upload` menjadi asinkron.
  - Alur baru: validasi request, upload buffer PDF langsung ke MinIO, buat record `ProcessTask` baru dengan tipe `UPLOAD_PDF` status `PENDING`, dan kembalikan status `202 Accepted` beserta `taskId` dalam milidetik.
- **backend/src/lib/worker.ts** [MODIFY]:
  - Implementasi handler sesungguhnya untuk task `UPLOAD_PDF`.
  - Handler akan membaca file PDF dari MinIO, menjalankan text extraction (`smartExtractPdfText`), memecah pasal (`parseArticlesFromText`), dan menyimpan hasil ekstraksi serta artikel ke database secara transaksional.
  - Laporkan progress pemrosesan secara dinamis ke database dengan persentase dan status pesan saat ini (misal: disimpan dalam field `result` sebagai `{ message: '...' }`).

### Parallel OCR Processing
- **backend/src/lib/ocr-service.ts** [MODIFY]:
  - Gunakan `p-limit` di dalam `extractChunkWithVision` untuk menjalankan `performOCR` pada halaman-halaman PNG secara paralel (dengan limitasi konkurensi misalnya 3). Hal ini mempercepat pemrosesan Vision OCR secara signifikan tanpa memicu rate limit API.

### Frontend API Route & UI
- **frontend/src/app/api/upload/route.ts** [MODIFY]:
  - Sesuaikan route handler POST agar menangkap respon JSON `202` dari Express backend dan meneruskannya kembali ke client (bukan lagi event stream).
- **frontend/src/app/api/tasks/[id]/route.ts** [NEW]:
  - Buat route handler GET baru untuk mem-proxy detail task dari Express backend (`GET /api/tasks/:id`) untuk polling status.
- **frontend/src/app/upload/page.tsx** [MODIFY]:
  - Modifikasi event handler `handleManualUpload` untuk memulai polling interval ke `/api/tasks/[id]` setiap 2 detik setelah menerima `taskId`.
  - Tampilkan visual progress (misal: persentase progress dan tahapan pemrosesan) secara real-time pada tombol upload.
  - Setelah sukses, arahkan user ke detail peraturan (`/regulations/[id]`) menggunakan Next.js `useRouter`.

## Verification Plan

### Automated Tests
- Jalankan install dependency: `npm install p-limit --workspace=backend`
- Jalankan vitest pada backend untuk memastikan tidak ada pemrosesan worker yang rusak:
  - `npx vitest run src/lib/worker.test.ts`
- Buat test integration/unit baru atau sesuaikan test lama jika ada.

### Manual / Smoke Verification
- Lakukan manual upload PDF di UI frontend.
- Amati visual progress berjalan dari 0% hingga 100% dengan teks tahapan pemrosesan yang update.
- Pastikan setelah sukses, halaman otomatis beralih ke halaman detail peraturan yang baru saja diunggah.
- Periksa log Docker untuk memastikan pemrosesan OCR berjalan secara paralel pada background task.

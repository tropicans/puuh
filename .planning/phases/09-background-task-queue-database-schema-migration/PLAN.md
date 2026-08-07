# Phase 9 Plan: Background Task Queue & Database Schema Migration

Menambahkan model database `ProcessTask` untuk melacak status tugas latar belakang, menjalankan migrasi database, serta mengimplementasikan core background worker (lightweight polling-based) terintegrasi pada Express backend beserta REST API endpoint `/api/tasks/:id` untuk memantau status tugas.

## Proposed Changes

### Database Configuration & Models
- **backend/prisma/schema.prisma** [MODIFY]:
  - Tambahkan model `ProcessTask` dengan field: `id`, `type`, `status`, `progress`, `payload`, `result`, `error`, `createdAt`, `updatedAt`.
  - Tambahkan enum `TaskType` (`UPLOAD_PDF`, `SYNC_JR`) dan `TaskStatus` (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`).

### Background Task Engine
- **backend/src/lib/worker.ts** [NEW]:
  - Implementasi fungsi `startWorker()` dan `stopWorker()` dengan polling interval menggunakan recursive `setTimeout`.
  - Implementasi fungsi pemrosesan tugas `processNextTask()` yang mengambil tugas status `PENDING`, memperbarui status menjadi `PROCESSING`, dan memprosesnya menggunakan handler yang terdaftar.
  - Sediakan placeholders handler untuk `UPLOAD_PDF` dan `SYNC_JR`.
- **backend/src/lib/worker.test.ts** [NEW]:
  - Unit test menggunakan Vitest untuk memverifikasi fungsionalitas background worker (transisi status sukses, penanganan error, polling loop, pemrosesan tugas berurutan).

### Express Routes & Startup
- **backend/src/routes/tasks.ts** [NEW]:
  - Endpoint `GET /api/tasks/:id` yang mengembalikan status, progress, error, dan hasil tugas. Dilengkapi dengan middleware autentikasi.
- **backend/src/routes/tasks.test.ts** [NEW]:
  - Unit/integration test menggunakan Vitest untuk endpoint `GET /api/tasks/:id` (penanganan status 200, 401 Unauthorized, 404 Not Found).
- **backend/src/routes/index.ts** [MODIFY]:
  - Daftarkan `tasksRouter` pada path `/tasks`.
- **backend/src/server.ts** [MODIFY]:
  - Panggil `startWorker()` saat Express backend berhasil listen pada port-nya.

## Verification Plan

### Automated Tests
- Jalankan migrasi Prisma lokal: `npx prisma migrate dev --name add_process_task` (di dalam folder backend).
- Jalankan test suite backend untuk memverifikasi fungsionalitas:
  - `npx vitest run src/lib/worker.test.ts`
  - `npx vitest run src/routes/tasks.test.ts`
  - `npm run test` di root.

### Manual / Smoke Verification
- Jalankan backend server dan verifikasi bahwa background worker berhasil di-start tanpa melemparkan eksepsi.
- Lakukan request manual ke `GET /api/tasks/:id` untuk memastikan penanganan status 401, 404, dan 200 berjalan semestinya.

# Phase 1: Infrastruktur & Integrasi Docker - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Service `docling-serve` (CPU-based) berjalan secara lokal dan terisolasi dari container utama (`app`) menggunakan Docker Compose. Terintegrasi melalui port publishing, pengaktifan UI Playground, penambahan health check, dan definisi environment variable `DOCLING_API_URL` pada Next.js app.

</domain>

<decisions>
## Implementation Decisions

### Akses & Port
- **D-01:** Port `5001` dipublikasikan ke host (`5001:5001`) agar Swagger/UI Playground dapat diakses langsung dari browser komputer lokal.
- **D-02:** UI Playground diaktifkan dengan mendefinisikan environment variable `DOCLING_SERVE_ENABLE_UI=1` pada container `docling-serve`.
- **D-03:** Tanpa menggunakan API Key/Authentication karena container berjalan secara eksklusif di lingkungan development lokal.
- **D-04:** Port host default `5001` ditulis secara hardcoded langsung di `docker-compose.yml` (tidak memuat variabel dinamis dari file `.env`).

### Limitasi Resource CPU & RAM
- **D-05:** Tanpa limitasi keras (hard limit) untuk CPU/RAM pada container `docling-serve` agar proses parsing dokumen berjalan secepat mungkin menggunakan kapabilitas host.
- **D-06:** Menggunakan kebijakan restart `restart: always` agar Docker otomatis menyalakan ulang container jika terjadi crash (misal akibat Out Of Memory / OOM).
- **D-07:** Threading PyTorch dibiarkan menggunakan deteksi dinamis default dari Docker/Docling (tanpa variabel pembatas seperti `OMP_NUM_THREADS`).
- **D-08:** Ukuran Shared Memory (`shm_size`) menggunakan default Docker tanpa konfigurasi manual tambahan.

### Versi Image & Registry
- **D-09:** Registry container yang digunakan untuk pull image adalah `quay.io`.
- **D-10:** Tag versi image yang digunakan adalah versi stabil rilis terbaru `v1.29.0`.
- **D-11:** Menggunakan varian image CPU-only (`docling-serve-cpu`) untuk performa optimal di laptop/PC standard tanpa GPU NVIDIA.
- **D-12:** Kebijakan penarikan image (pull policy) menggunakan default (`missing`), hanya men-pull image jika belum tersedia di disk lokal.

### Health Check & Dependensi Startup
- **D-13:** Pemeriksaan kesehatan (*health check*) menggunakan endpoint bawaan `/health`.
- **D-14:** Perintah pengujian status kesehatan dijalankan menggunakan utilitas `curl` dengan command `curl -f http://localhost:5001/health`.
- **D-15:** Next.js `app` berjalan paralel dengan startup `docling-serve`. Next.js `app` tidak diblokir/menunggu status `service_healthy` dari `docling-serve` (dependensi biasa tanpa kondisi status).
- **D-16:** Parameter waktu health check dikonfigurasikan dengan alokasi `start_period` yang cukup panjang untuk inisialisasi loading model PyTorch:
  - `interval: 10s`
  - `timeout: 5s`
  - `retries: 5`
  - `start_period: 20s`

### the agent's Discretion
Semua area dikonfigurasi sesuai preferensi dan persetujuan eksplisit dari pengguna. Tidak ada area keputusan yang didelegasikan ke diskresi agen.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Docker Infrastructure
- [docker-compose.yml](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/docker-compose.yml) — Spesifikasi setup container Next.js app, postgres, minio, dan entry point integrasi docling-serve.
- [Dockerfile](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/Dockerfile) — Konfigurasi build Next.js app, pola instalasi package utilitas dan healthcheck.

### Project Specs & Requirements
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/ROADMAP.md) — Goal detail, success criteria, dan alokasi plan untuk Phase 1.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/REQUIREMENTS.md) — Kebutuhan INF-01, INF-02, dan INF-03 yang dicakup dalam fase ini.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [docker-compose.yml](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/docker-compose.yml): Struktur dasar container orchestration, volume data, dan pendefinisian port yang sudah ada untuk postgres dan minio.

### Established Patterns
- Pola `healthcheck` yang berjalan secara Alpine-based menggunakan `test` Command (seperti `pg_isready` pada postgres dan `curl` pada minio).
- Pola environment variables yang menggunakan nilai default berformat `${VAR:-default_val}` di `docker-compose.yml`.

### Integration Points
- Blok `services` di `docker-compose.yml`: Penambahan service baru `docling-serve` sejajar dengan `app`, `postgres`, dan `minio`.
- Blok `environment` pada service `app` di `docker-compose.yml`: Penambahan entri `DOCLING_API_URL` yang mengarah ke `http://docling-serve:5001` di jaringan internal Docker.

</code_context>

<specifics>
## Specific Ideas

- UI Playground dan Swagger docs dari `docling-serve` bisa diuji/diakses langsung dari PC host melalui URL `http://localhost:5001/ui` dan `http://localhost:5001/docs`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-Infrastruktur & Integrasi Docker*
*Context gathered: 2026-08-06*

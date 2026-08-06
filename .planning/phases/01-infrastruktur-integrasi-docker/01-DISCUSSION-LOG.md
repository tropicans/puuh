# Phase 1: Infrastruktur & Integrasi Docker - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 01-Infrastruktur & Integrasi Docker
**Areas discussed:** Akses & Port, Limitasi Resource CPU & RAM, Versi Image & Registry, Konfigurasi Health Check & startup dependency

---

## Akses & Port

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Publikasikan port 5001 ke host | Akses Playground UI dan Swagger dari browser lokal | ✓ |
| Hanya internal | Hanya bisa diakses oleh Next.js di dalam jaringan Docker | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Aktifkan UI Playground | DOCLING_SERVE_ENABLE_UI=1 untuk mempermudah testing langsung di browser | ✓ |
| Nonaktifkan UI Playground | Mengurangi beban memori container | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Tanpa API Key/Authentication | Karena berjalan di lingkungan lokal/development | ✓ |
| Gunakan API Key sederhana | Token statis via env variable | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Gunakan port default 5001 secara hardcoded | Konfigurasi hardcoded di docker-compose.yml | ✓ |
| Gunakan variabel environment dari file .env | Lebih fleksibel jika terjadi bentrok port | |
| Biarkan agen yang memutuskan | You decide | |

**User's choice:** Menggunakan port default 5001 secara hardcoded di host, mengaktifkan UI Playground, tanpa API Key, dan mempublikasikan port ke host.

---

## Limitasi Resource CPU & RAM

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Tanpa limitasi keras | Membiarkan Docling menggunakan resource CPU & RAM maksimal | ✓ |
| Gunakan limitasi sedang | Batasan cpus: '4', memory: 4GB untuk menjaga kestabilan host | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) restart: always | Otomatis menghidupkan kembali container jika crash | ✓ |
| restart: no | Jangan restart otomatis jika crash | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Gunakan konfigurasi default | Docling mendeteksi dan menggunakan seluruh core CPU secara dinamis | ✓ |
| Batasi thread PyTorch | OMP_NUM_THREADS=4 untuk batasi pemakaian CPU inti | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Gunakan shm_size default dari Docker | Tidak didefinisikan secara manual | ✓ |
| Alokasikan shm_size yang lebih besar | shm_size: '2gb' untuk menghindari potensi error | |
| Biarkan agen yang memutuskan | You decide | |

**User's choice:** Tanpa limitasi keras CPU/RAM, restart policy `always`, dynamic PyTorch thread detection, shm_size default.

---

## Versi Image & Registry

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) quay.io | Mengambil image dari registry Quay.io | ✓ |
| ghcr.io | Mengambil image dari registry GitHub Container Registry | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) v1.29.0 | Menggunakan tag versi stabil terakhir | ✓ |
| latest | Selalu menggunakan versi build terbaru | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) CPU-only | Menggunakan image docling-serve-cpu, cocok untuk komputer lokal tanpa GPU khusus | ✓ |
| GPU/CUDA | Menggunakan image docling-serve-cu128/cu130, membutuhkan GPU NVIDIA | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) default/missing | Hanya pull jika image belum tersedia di lokal, menghemat bandwidth | ✓ |
| always | Selalu periksa dan unduh ulang dari registry setiap kali docker-compose up | |
| Biarkan agen yang memutuskan | You decide | |

**User's choice:** Registry `quay.io`, versi tag `v1.29.0`, image CPU-only (`docling-serve-cpu`), pull policy default (`missing`).

---

## Konfigurasi Health Check & startup dependency

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) /health | Endpoint health check standar dari docling-serve yang mengembalikan status ok | ✓ |
| /docs | Menggunakan OpenAPI docs Swagger UI | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) curl -f http://localhost:5001/health | Menggunakan utilitas curl | ✓ |
| wget -qO- http://localhost:5001/health | Menggunakan utilitas wget | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Next.js app berjalan paralel | Next.js tidak diblokir saat startup jika docling-serve belum siap | ✓ |
| Next.js app menunggu docling-serve sehat baru berjalan | depends_on: service_healthy | |
| Biarkan agen yang memutuskan | You decide | |

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Berikan waktu start_period yang cukup panjang | interval: 10s, timeout: 5s, retries: 5, start_period: 20s | ✓ |
| Parameter standar Docker | interval: 30s, timeout: 10s, retries: 3 | |
| Biarkan agen yang memutuskan | You decide | |

**User's choice:** Health check endpoint `/health` via `curl -f http://localhost:5001/health`, Next.js app running parallel to docling-serve, health check timing parameters with `start_period: 20s`.

---

## the agent's Discretion

Semua keputusan dikonfigurasi secara eksplisit berdasarkan pilihan pengguna. Tidak ada area keputusan yang didelegasikan ke diskresi agen.

## Deferred Ideas

None — discussion stayed within phase scope.

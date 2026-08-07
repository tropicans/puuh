# Phase 4: LLM & UI Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 4-LLM & UI Integration
**Areas discussed:** Prompt AI untuk parsing tabel & list, Integrasi Docling ke Auto-Search, Model data & UI indikator metode ekstraksi

---

## Prompt AI untuk parsing tabel & list

| Option | Description | Selected |
|--------|-------------|----------|
| Pertahankan format tabel Markdown asli | AI dilarang merangkum tabel dan harus menyalin tabel Markdown dari Docling apa adanya di dalam konten pasal. | ✓ |
| Ubah tabel menjadi representasi teks naratif | AI mengonversi baris-baris tabel menjadi daftar teks terperinci (misal: 'Kolom 1 bernilai X, Kolom 2 bernilai Y'). | |
| Abaikan tabel atau pisahkan tabel dari pasal | Tabel diekstrak sebagai lampiran terpisah, bukan di dalam konten pasal. | |

**User's choice:** Pertahankan format tabel Markdown asli

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pertahankan format list Markdown asli | AI dilarang menggabungkan list menjadi paragraf tunggal dan harus mempertahankan indentasi list (- a.,   - 1., dst). | ✓ |
| Normalisasi ke bentuk teks standar | AI mengonversi list hierarkis menjadi paragraf berurutan biasa. | |
| You decide | | |

**User's choice:** Pertahankan format list Markdown asli

---

| Option | Description | Selected |
|--------|-------------|----------|
| Cocokkan jumlah Pasal secara heuristik | Bandingkan jumlah kata kunci 'Pasal' di teks input dengan hasil parsing AI. Jika selisihnya signifikan, picu fallback ke regex parsing. | ✓ |
| Bandingkan teks verbatim | Lakukan perbandingan kemiripan teks (fuzzy match) antara pasal hasil AI dengan teks asli. | |
| Tanpa validasi tambahan | Percayakan pada validasi minimal yang ada (jika < 3 pasal, fallback ke regex). | |

**User's choice:** Cocokkan jumlah Pasal secara heuristik

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reset khusus amandemen | Tambahkan aturan eksplisit agar LLM hanya mengekstrak pasal yang memuat teks perubahan baru/diubah, dan abaikan teks rujukan yang tidak diubah. | ✓ |
| Ekstrak semua teks yang tertulis | LLM mengekstrak semua teks pasal apa adanya, termasuk pasal rujukan lama. | |
| You decide | | |

**User's choice:** Instruksi khusus amandemen

---

## Integrasi Docling ke Auto-Search

| Option | Description | Selected |
|--------|-------------|----------|
| Gunakan smartExtractPdfText | Refaktor file regulation-fetcher.ts agar pemrosesan PDF menggunakan smartExtractPdfText (Docling) sebagai pilihan pertama, menggantikan penggunaan parser pdf-parse langsung. | ✓ |
| Pertahankan pdf-parse langsung | Biarkan auto-search menggunakan pdf-parse langsung karena performanya lebih cepat dan resource-efficient untuk pencarian massal. | |
| You decide | | |

**User's choice:** Gunakan smartExtractPdfText

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stream status progres penuh | Kirimkan progres 'Mencoba Docling...' dan fallback-nya menggunakan parameter onProgress yang dikirim ke smartExtractPdfText. | ✓ |
| Hanya kirim progres minimal | Cukup tampilkan progres umum 'Mengekstrak teks...' di frontend tanpa merinci status detail Docling. | |
| You decide | | |

**User's choice:** Stream status progres penuh

---

| Option | Description | Selected |
|--------|-------------|----------|
| Samakan dengan perilaku upload manual | Tambahkan string peringatan fallback [PERINGATAN: Dokumen ini diproses menggunakan metode fallback...] di awal rawText sebelum disimpan. | ✓ |
| Simpan raw text tanpa penanda | Simpan teks hasil fallback bersih tanpa menambahkan string peringatan di dalam rawText. | |
| You decide | | |

**User's choice:** Samakan dengan perilaku upload manual

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ikuti default timeout smartExtractPdfText | Menggunakan timeout 15 detik bawaan dari smartExtractPdfText tanpa modifikasi tambahan. | ✓ |
| Bungkus dengan timeout lokal yang lebih pendek | Batasi pemanggilan Docling di auto-search hanya 10 detik agar penelusuran otomatis tidak terlalu lama menggantung. | |
| You decide | | |

**User's choice:** Ikuti default timeout smartExtractPdfText

---

## Model data & UI indikator metode ekstraksi

| Option | Description | Selected |
|--------|-------------|----------|
| Kolom baru extractionMethod di DB | Tambahkan kolom extractionMethod String? pada model RegulationVersion di schema Prisma (dan jalankan migrasi database). Ini merupakan solusi yang paling kokoh, type-safe, dan eksplisit. | ✓ |
| Gunakan parsing teks dinamis (Regex) | Deteksi metode ekstraksi secara dinamis dari prefix teks peringatan di kolom rawText di database. Menghindari migrasi database. | |
| You decide | | |

**User's choice:** Kolom baru extractionMethod di DB

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tampilkan di halaman detail peraturan & log upload | Tampilkan badge metode ekstraksi (misal 'Docling' atau 'Fallback: PDFJS') di samping nama versi pada Version Timeline (detail page) dan di log progress saat upload manual/auto. | ✓ |
| Hanya tampilkan di halaman detail peraturan | Tampilkan indikator metode ekstraksi sebagai informasi meta di detail versi saja. | |
| You decide | | |

**User's choice:** Tampilkan di halaman detail peraturan & log upload

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tebak metode secara dinamis (Data Migration) | Jalankan skrip migrasi data pasca skema update untuk memeriksa apakah rawText versi lama diawali teks peringatan fallback. Jika ya, set kolom sesuai nama fallback tersebut. Jika tidak, set default sebagai 'docling' (atau null/empty jika tak teridentifikasi). | ✓ |
| Beri nilai null atau kosong | Biarkan versi lama bernilai null, dan tangani nilai null di UI sebagai 'Teks digital (Lama)' atau 'Tidak diketahui'. | |
| You decide | | |

**User's choice:** Tebak metode secara dinamis (Data Migration)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Badge warna minimalis | Hijau lembut (misal: bg-emerald-500/10 text-emerald-400) untuk 'Docling' (sukses/terstruktur) dan Oranye lembut (misal: bg-amber-500/10 text-amber-400) untuk 'Fallback' (peringatan). | ✓ |
| Badge teks biasa | Teks berukuran kecil berwarna abu-abu redup (text-muted-foreground) di bawah nomor versi agar tidak terlalu mencolok. | |
| You decide | | |

**User's choice:** Badge warna minimalis

---

## the agent's Discretion

Semua keputusan dikonfirmasi secara eksplisit oleh pengguna. Tidak ada area yang didelegasikan ke diskresi agen.

## Deferred Ideas

None.

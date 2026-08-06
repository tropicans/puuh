# Phase 3: Pemrosesan Tabel & Markdown - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 03-pemrosesan-tabel-markdown
**Areas discussed:** Markdown Cleaning Strategy, Batas Penyimpanan Teks Raw, Representasi Tabel pada Rantai Fallback, Validasi & Normalisasi Format Tabel

---

## Markdown Cleaning Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fungsi Pembersih Terpisah | Buat `cleanMarkdownText` khusus untuk Docling guna menghindari pembersihan agresif (seperti penghapusan nomor tunggal di sel tabel). | ✓ |
| Modifikasi `cleanPdfText` dengan Bypass | Tambahkan parameter kondisi pada `cleanPdfText` untuk melewati regex tertentu jika baris berisi karakter pembatas tabel (`\|`). | |
| Simpan Apa Adanya | Lewati proses pembersihan (cleaning) untuk output Docling karena Docling biasanya sudah bersih dari header/footer bawaan PDF. | |
| You decide | Kembalikan ke diskresi agen untuk memilih implementasi terbaik. | |

**User's choice:** Fungsi Pembersih Terpisah (`cleanMarkdownText`)
**Notes:** Pengguna memilih solusi yang paling aman secara fungsional — membuat fungsi baru yang terpisah sehingga `cleanPdfText` tidak terpengaruh dan tidak ada risiko merusak logika fallback yang sudah berjalan.

---

## Batas Penyimpanan Teks Raw

| Option | Description | Selected |
|--------|-------------|----------|
| Hapus Limit Substring | Hilangkan pemotongan `.substring(0, 100000)` sepenuhnya agar seluruh teks Markdown tersimpan utuh di database (PostgreSQL TEXT dapat menampung hingga 1GB). | ✓ |
| Perbesar Limit Substring | Naikkan batas pemotongan menjadi 500.000 atau 1.000.000 karakter sebagai batas aman agar tidak membebani memori database secara ekstrem. | |
| Simpan ke MinIO (Fallback File) | Simpan teks sebagai file `.md` terpisah di MinIO jika panjangnya melebihi 100.000 karakter, dan simpan referensi URL di database. | |
| You decide | Kembalikan ke diskresi agen. | |

**User's choice:** Hapus Limit Substring sepenuhnya
**Notes:** Keputusan yang sederhana dan tegas — Tipe `TEXT` PostgreSQL cukup untuk menampung konten dokumen hukum Indonesia yang paling panjang sekalipun. Tidak memerlukan kompleksitas tambahan seperti fallback ke MinIO.

---

## Representasi Tabel pada Rantai Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Tambahkan Penanda Warning | Sisipkan catatan warning di bagian atas dokumen jika parsing Docling gagal dan fallback terjadi. | ✓ |
| Simpan Teks Polos As-Is | Simpan teks apa adanya tanpa modifikasi atau penambahan catatan peringatan. | |
| You decide | Kembalikan ke diskresi agen. | |

**User's choice:** Tambahkan Penanda Warning
**Notes:** Format peringatan yang disepakati: `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${extractionMethod}). Struktur tabel mungkin tidak terurai dengan sempurna.]`, disisipkan hanya jika `extractionMethod !== 'docling'`.

---

## Validasi & Normalisasi Format Tabel

| Option | Description | Selected |
|--------|-------------|----------|
| Simpan Mentah | Simpan langsung teks Markdown dari Docling tanpa modifikasi baris tabel. LLM pada fase hilir terbukti sangat toleran terhadap deviasi baris tabel Markdown. | ✓ |
| Normalisasi Otomatis | Implementasikan pembersih/parser regex di backend untuk menyeimbangkan jumlah kolom pada setiap baris tabel Markdown yang tidak seimbang. | |
| You decide | Kembalikan ke diskresi agen. | |

**User's choice:** Simpan Mentah (as-is)
**Notes:** Pendekatan YAGNI (You Aren't Gonna Need It) — normalisasi kolom tabel menambah kompleksitas tanpa manfaat nyata saat ini, terutama karena LLM downstream sudah cukup toleran terhadap variasi format tabel.

---

## the agent's Discretion

Tidak ada area yang didelegasikan ke diskresi agen. Semua keputusan dikonfirmasi secara eksplisit oleh pengguna.

## Deferred Ideas

None — discussion stayed within phase scope.

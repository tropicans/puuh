---
phase: "13"
name: "kustomisasi-docling-ocr-caching-refactoring-typescript"
created: 2026-08-07
---

# Phase 13: kustomisasi-docling-ocr-caching-refactoring-typescript — Context

## Decisions

- **MD5 Caching Strategy**: Gunakan MD5 hash dari PDF buffer sebagai unique cache key untuk menghindari ekstraksi ulang. Cache disimpan dalam field `pdfMd5Hash` di tabel `RegulationVersion`.
- **OCR Mode Toggle**: Admin memiliki opsi eksplisit AUTO (mencoba docling/digital/fallback OCR), FORCE (langsung OCR), dan SKIP (mengabaikan OCR seluruhnya jika digital gagal) untuk memberikan fleksibilitas ekstraksi dokumen.
- **Strict Types Cleanup**: Menghilangkan tipe `any` pada backend worker dan menggantinya dengan interface payload dan model transaksional Prisma yang spesifik untuk menjaga kualitas kode.

## Discretion Areas

- Format visual dropdown opsi OCR di UI admin frontend dibenarkan menggunakan selektor bawaan browser yang berpenampilan minimalis namun modern.

## Deferred Ideas

_None_

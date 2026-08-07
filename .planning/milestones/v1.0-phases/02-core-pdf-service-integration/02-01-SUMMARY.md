---
phase: 02-core-pdf-service-integration
plan: 02-01
subsystem: backend
tags: [docling, fallback, fetch, test]
requires: ["01-infrastruktur-integrasi-docker"]
provides:
  - docling backend client integration in pdf-service.ts
  - automatic 15-second timeout and fallback logic to pdfjs/pdf-parse/ocr
affects: ["03-pemrosesan-tabel-&-markdown"]
tech-stack:
  added: []
  patterns: [vitest, esm-cjs-interop]
key-files:
  created: [src/lib/pdf-service.test.ts]
  modified: [src/lib/pdf-service.ts]
key-decisions:
  - "Integrated Docling as primary parser in smartExtractPdfText with 15s timeout via AbortSignal"
  - "Implemented ESM/CJS interop fallback for Mehmet Kozan's pdf-parse v2 by checking type of PDFParse export class and using dynamic import"
patterns-established: []
requirements-completed: ["EXT-01", "EXT-02", "EXT-03"]
duration: 30min
completed: 2026-08-06
---

# Phase 02: Core PDF Service Integration Summary

**The backend Next.js application has been successfully integrated with the IBM Docling conversion service as the primary text extraction method, with fully automated fallback routes.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-08-06T16:15:00+07:00
- **Completed:** 2026-08-06T16:45:00+07:00
- **Tasks:** 4 completed
- **Files modified/created:** 2 files

## Accomplishments
- Implemented Docling integration as the first step of the PDF parsing pipeline in `src/lib/pdf-service.ts`.
- Structured payload with Node's native `FormData` and `Blob` to serialize the PDF file buffer and requests with `{ to_formats: ['md'] }`.
- Configured strict 15-second timeout limit using `AbortSignal.timeout(15000)` on the API request.
- Implemented robust error catching and fallback handling to sequentially cascade extraction requests to PDFJS, pdf-parse, and finally Gemini Vision OCR.
- Restructured `pdf-parse` execution path to support Mehmet Kozan's typescript-based `pdf-parse` v2 dual-package format cleanly (which exports a namespace containing the `PDFParse` class rather than a default callable function) using dynamic ES module imports.
- Created `src/lib/pdf-service.test.ts` implementing a comprehensive test suite via Vitest verifying the success scenarios, network errors, timeouts, and cascading fallbacks.

## Files Created/Modified
- `src/lib/pdf-service.ts` - Refactored `smartExtractPdfText` pipeline to integrate Docling and support ESM `pdf-parse` v2 compatibilities.
- `src/lib/pdf-service.test.ts` - Created test file with complete suite of mock contexts and progress/fallback assertions.

## Decisions Made
- Used native `new Blob([new Uint8Array(pdfBuffer)])` array mapping to resolve strict TypeScript Node.js/DOM Blob type mismatches during Next.js production builds.
- Added a fallback path that instantiates `new PDFParse({ data: pdfBuffer })` and calls `.getText()` if the `PDFParse` class export is present on the imported module to natively support newer typescript-based versions of the library.

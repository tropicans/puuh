---
phase: 02-pdf-parsing-ocr-processing-optimizations
plan: 02
subsystem: storage
tags: [nextjs, minio, regex, parser]

requires:
  - phase: 02-pdf-parsing-ocr-processing-optimizations
    provides: "Concurrent OCR extraction"
provides:
  - "Hardened regex article parser tolerating OCR typos and alphanumeric sections"
  - "Next.js API route proxying MinIO file downloads securely to the browser"

tech-stack:
  added: []
  patterns: [Regex lookahead splitting, Next.js catch-all stream proxy]

key-files:
  created: [src/app/api/documents/[...path]/route.ts]
  modified: [src/lib/ai-service.ts, src/lib/storage.ts]

key-decisions:
  - "Harden the article parser using case-insensitive lookahead assertions matching spacing anomalies and typos like Pasa1."
  - "Avoid exposing MinIO container ports to the browser by using Next.js catch-all proxy routes returning standard Responses."

patterns-established:
  - "Pattern: Server-side Next.js route streaming from object storage using Readable.toWeb()."

requirements-completed: [PERF-02, PERF-03]

duration: 15min
completed: 2026-06-07
---

# Plan 02-02 Summary

**Hardened article splitting regex parser for Indonesian legislation and Next.js server-side streaming download proxy route**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-07T13:25:15Z
- **Completed:** 2026-06-07T13:28:20Z
- **Tasks:** 3 completed
- **Files modified:** 2
- **Files created:** 1

## Accomplishments
- Refactored `parseArticlesWithRegex` in `src/lib/ai-service.ts` to split and match article dividers using a typo-tolerant pattern (`Pas\s*a\s*[l1]\s+\d+[A-Za-z]*`) and normalize results to `"Pasal [Number]"`.
- Modified `storage.uploadFile` in `src/lib/storage.ts` to return relative `/api/documents/${filename}` endpoints.
- Created Next.js API route proxy `src/app/api/documents/[...path]/route.ts` to fetch file stream from MinIO server-side and pipe it inline to the browser with correct content headers.

## Task Commits
1. **Plan 02-02 Implementation** - `27f8697` (feat)

## Files Created/Modified
- `src/lib/ai-service.ts` - Hardened regex splitting and header normalization.
- `src/lib/storage.ts` - Refactored `uploadFile` return path.
- `src/app/api/documents/[...path]/route.ts` - New Dynamic API catch-all streaming proxy.

## Decisions Made
- None - followed plan as specified.

## Deviations from Plan
- **Type casting:** Added `webStream as unknown as BodyInit` and `error as { code?: string }` to resolve Node-vs-DOM typings and satisfy ESLint explicit `any` rules.

## Issues Encountered
- **ESLint explicit any rule:** Resolved by casting objects to specific shape interfaces rather than casting to `any`.

## User Setup Required
None.

## Next Phase Readiness
Phase 2 optimizations are fully implemented, verified, and complete. Ready for Phase 3 testing setup.

---
phase: 03
slug: pemrosesan-tabel-markdown
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-06
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/__tests__/utils.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/utils.test.ts` or `npx vitest run src/lib/pdf-service.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | TAB-02 | — | N/A | unit | `npx vitest run src/__tests__/utils.test.ts -t "cleanMarkdownText"` | ✅ W0 | ✅ green |
| 03-01-02 | 01 | 1 | TAB-01 | — | N/A | integration | `npx vitest run src/lib/pdf-service.test.ts -t "preserve solitary numbers"` | ✅ W0 | ✅ green |
| 03-01-03 | 01 | 1 | TAB-02 | T-03-01 | Secure rawText DB insert | build/lint | `npm run lint` | ✅ W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/utils.test.ts` — test suite for cleanMarkdownText
- [x] `src/lib/pdf-service.test.ts` — test cases for Docling solitary numbers preservation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Substring removal validation | TAB-02 | Database record length limits verification | Upload a PDF document larger than 100K characters via UI or API client and confirm `rawText` in `RegulationVersion` is not truncated to 100K characters. |
| Fallback Warning in rawText | TAB-02 | Prepend verification | Upload a PDF with a failed Docling (or stop Docling microservice) to trigger fallback, and verify stored `rawText` starts with `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback ...]` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed

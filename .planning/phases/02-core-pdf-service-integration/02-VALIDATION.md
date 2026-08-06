---
phase: 02
slug: core-pdf-service-integration
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-06
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/pdf-service.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/pdf-service.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | EXT-01 | — | N/A | unit/integration | `npx vitest run src/lib/pdf-service.test.ts -t "Docling client integration"` | ✅ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EXT-02 | — | N/A | unit/integration | `npx vitest run src/lib/pdf-service.test.ts -t "Layout-aware parsing"` | ✅ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | EXT-03 | — | N/A | unit/integration | `npx vitest run src/lib/pdf-service.test.ts -t "Fallback logic"` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pdf-service.test.ts` — test suites for EXT-01, EXT-02, EXT-03

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Progress logs in stream | EXT-01 | SSE stream is best validated in integration/browser environment | Perform PDF upload in local app and verify console/network logs show `'Mencoba membaca teks menggunakan Docling...'` and method tag `'docling'` in success payload. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

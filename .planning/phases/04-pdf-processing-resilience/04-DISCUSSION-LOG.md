# Phase 4: PDF Processing Resilience - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 04-PDF Processing Resilience
**Areas discussed:** Fallback Triggering Strategy, Fallback Concurrency & Rate Limiting, User Notifications & Progress Reporting

---

## Fallback Triggering Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Trigger on load/split failures OR if any chunk fails to process after retries | Fully resilient, triggers fallback at initial parse or mid-process chunk errors | ✓ |
| Trigger only if the initial PDFDocument.load or chunk creation fails | Simpler, handles document-level parse errors only | |

**User's choice:** Trigger on load/split failures OR if any chunk fails to process after retries (fully resilient).
**Notes:** Resilient fallback should trigger if any chunk fails during LLM Vision API execution, fallback will target only pages inside the failed chunk to minimize token consumption and request overhead.

---

## Fallback Concurrency & Rate Limiting

| Option | Description | Selected |
|--------|-------------|----------|
| Use a lower concurrency limit (max 1-2 concurrent calls) | Safer request volume for single-page tasks | ✓ |
| Run single-page fallback tasks sequentially (1-by-1) | Eliminates rate limit risks entirely | |
| Reuse default concurrency limit (max 3 concurrent calls) | Reuses default concurrency setup | |

**User's choice:** Use a lower concurrency limit (max 1-2 concurrent calls) for single-page tasks to stay safe under rate limits.
**Notes:** Added standard handling to retry failed single-page tasks up to 2 times with exponential backoff (2s, 4s).

---

## User Notifications & Progress Reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Stream detailed status messages to the UI | Stream SSE logs like "Mendeteksi kendala, memproses per halaman..." | ✓ |
| Keep the UI progress generic, and only log on server | Internal console logging only | |

**User's choice:** Stream detailed status messages to the UI (via SSE progress logs) explaining that fallback is active.
**Notes:** Keep the user informed that processing is recovering gracefully.

---

## the agent's Discretion

- Log formats, retry delays configuration details, and exact file stream manipulation helpers are left to the agent's discretion.

## Deferred Ideas

None.

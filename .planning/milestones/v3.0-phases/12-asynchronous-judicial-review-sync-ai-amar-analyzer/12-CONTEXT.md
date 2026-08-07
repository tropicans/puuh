---
phase: "12"
name: "asynchronous-judicial-review-sync-ai-amar-analyzer"
created: 2026-08-07
---

# Phase 12: asynchronous-judicial-review-sync-ai-amar-analyzer — Context

## Decisions

- **Asynchronous JR Sync**: Sinkronisasi putusan JR MK/MA dilakukan via background queue agar backend tidak mengalami gateway timeout (port 3007).
- **AI Amar Analyzer**: Mengurai amar putusan menggunakan LLM untuk menentukan apakah pasal-pasal tertentu mengalami pembatalan (`INVALIDATED`), diubah statusnya (`CONDITIONALLY_VALID`), dll., dan memetakannya langsung ke database relasional.

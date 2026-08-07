---
phase: 01-infrastruktur-integrasi-docker
plan: 01
subsystem: infra
tags: [docker, docker-compose, docling]
requires: []
provides:
  - docling-serve CPU-based container running on port 5001
  - DOCLING_API_URL mapped to http://docling-serve:5001 inside docker-compose
affects: ["02-core-pdf-service-integration"]
tech-stack:
  added: [docling-serve-cpu:v1.29.0]
  patterns: []
key-files:
  created: []
  modified: [docker-compose.yml, .env, .env.example]
key-decisions:
  - "Hardcoded DOCLING_API_URL inside docker-compose.yml to prevent host-based env settings from overriding internal container network routes"
patterns-established: []
requirements-completed: ["INF-01", "INF-02", "INF-03"]
duration: 15min
completed: 2026-08-06
---

# Phase 01: Infrastruktur & Integrasi Docker Summary

**Service `docling-serve` (CPU-based) is now running locally on port 5001 via Docker Compose and integrated with the Next.js `app` container.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-06T14:10:00+07:00
- **Completed:** 2026-08-06T14:15:30+07:00
- **Tasks:** 3 completed
- **Files modified:** 3 files

## Accomplishments
- Configured and launched `quay.io/docling-project/docling-serve-cpu:v1.29.0` container inside docker-compose.yml.
- Exposed docling-serve endpoint `/health` for health checks.
- Mapped `DOCLING_API_URL` internal container environment variable pointing to `http://docling-serve:5001` and added startup dependency.
- Defined `DOCLING_API_URL="http://localhost:5001"` in `.env` and `.env.example` to allow local host-based development.

## Files Created/Modified
- `docker-compose.yml` - Added docling-serve service definition and app integration
- `.env` - Added local DOCLING_API_URL environment variable
- `.env.example` - Added template environment variable

## Decisions Made
- Hardcoded `DOCLING_API_URL=http://docling-serve:5001` in docker-compose.yml to ensure inside the Docker network it always connects to the Docling container directly, preventing local host overrides from breaking network resolution.

## Deviations from Plan
- Updated the registry path of the docling-serve CPU image from `quay.io/ds4sd/docling-serve-cpu:v1.29.0` to the correct `quay.io/docling-project/docling-serve-cpu:v1.29.0` after verification pulled and resolved successfully.

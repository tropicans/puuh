# Phase 6: Migrasi Database & Core Services ke Backend Express - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-07
**Phase:** 06-Migrasi Database & Core Services ke Backend Express
**Areas discussed:** Prisma & Database Workflow, Types Sharing, Multer / PDF Upload Storage, External Service Configs

---

## Prisma & Database Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Move prisma/ to backend/ completely | Encapsulates database logic in the backend workspace; root package.json delegates commands like npm run db:migrate via workspaces | ✓ |
| Keep prisma/ at the root | Allows sharing the schema file, but mixes backend-only logic like db seeding in the shared root | |

**User's choice:** Move prisma/ to backend/ completely
**Notes:** Keeps database concern cleanly encapsulated in the backend package.

---

## Types Sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Generate Prisma client in both frontend and backend | Allows both packages to import types directly from '@prisma/client' without complex path-mapping to node_modules | ✓ |
| Generate Prisma client only in backend and share types via path alias | Saves minor disk space, but requires mapping imports to the backend's generated client files | |

**User's choice:** Generate Prisma client in both frontend and backend
**Notes:** Provides clean imports (`import { ... } from '@prisma/client'`) on both sides.

---

## Multer / PDF Upload Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Memory storage | PDFs are held in memory as Buffers and streamed directly to MinIO. Cleaner, no cleanup of temp disk files needed. | ✓ |
| Disk storage | PDFs are written to backend/tmp/uploads/ first, then uploaded to MinIO and deleted. Better for very large PDFs to avoid high memory spikes. | |

**User's choice:** Memory storage
**Notes:** Keeps disk storage clean and avoids temporary file lifecycle handling.

---

## External Service Configs

| Option | Description | Selected |
|--------|-------------|----------|
| Centralized Config Module | Parse and validate all env vars inside a single backend/src/config/index.ts, and export typed config objects. Catches configuration errors immediately on startup. | ✓ |
| Direct process.env access | Access process.env directly inside each service. Simple, but configuration errors are only caught at runtime. | |

**User's choice:** Centralized Config Module
**Notes:** Validating variables at startup guarantees fail-fast behavior.

---

## the agent's Discretion

- Details of Express routing structure and middleware config.
- Details of CORS configuration and exact database connection port defaults.

## Deferred Ideas

None — discussion stayed within phase scope.

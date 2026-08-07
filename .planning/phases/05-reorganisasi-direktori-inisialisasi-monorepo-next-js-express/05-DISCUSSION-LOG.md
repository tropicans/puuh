# Phase 5: Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-07
**Phase:** 5 - Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express)
**Areas discussed:** Monorepo Management, TypeScript Type-Sharing, Root Script Coordination, Express Backend Boilerplate Structure

---

## Monorepo Management

| Option | Description | Selected |
|--------|-------------|----------|
| Npm Workspaces | Use native npm workspaces. Root package.json defines work areas, sharing a single package-lock.json and optimizing node_modules caching. | ✓ |
| Direct Subfolders | Keep frontend/ and backend/ entirely independent with separate node_modules. Commands are run by prefixing npm commands (e.g., --prefix). | |
| You decide | Let the agent decide during implementation. | |

**User's choice:** Npm Workspaces
**Notes:** None

---

## TypeScript Type-Sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Direct Import Path Alias | Define a path alias in the frontend tsconfig.json pointing directly to backend source files (e.g., "@backend/types/*"). This is fast and requires no build steps or separate packaging. | ✓ |
| Shared Workspace Package | Create a third package in the monorepo workspace (e.g., "packages/shared" or "packages/types") containing shared interfaces, and list it as a dependency in both frontend/package.json and backend/package.json. | |
| You decide | Let the agent decide the best path during implementation. | |

**User's choice:** Direct Import Path Alias
**Notes:** None

---

## Root Script Coordination

| Option | Description | Selected |
|--------|-------------|----------|
| Run Concurrently | Install "concurrently" in the root package.json devDependencies, and map "npm run dev" to run both frontend and backend dev servers simultaneously in a single terminal. | ✓ |
| Native Workspace Scripts | Map the root "npm run dev" script to run natively across workspaces (e.g., "npm run dev --workspaces --if-present"). This relies purely on npm built-in features but doesn't handle interactive prefixes/coloring as neatly as concurrently. | |
| Separate Commands | Provide explicit separate scripts in the root package.json (e.g., "npm run dev:frontend" and "npm run dev:backend") and let the developer run them in separate terminals. | |
| You decide | Let the agent decide during implementation. | |

**User's choice:** Run Concurrently
**Notes:** None

---

## Express Backend Boilerplate Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Modular structure | Separate files into logical directories (e.g., backend/src/app.ts as entrypoint, routes/ for api endpoints, controllers/ for handling requests, and config/ for initialization). This provides a clean foundation for subsequent migrations. | ✓ |
| Minimal single-file | Create a single main backend file (e.g., backend/src/server.ts) containing everything (basic routes, server config). This keeps the initialization lightweight and defers structuring details to Phase 6. | |
| You decide | Let the agent decide during implementation. | |

**User's choice:** Modular structure
**Notes:** None

---

## the agent's Discretion

None — all choices followed recommended options.

## Deferred Ideas

None — discussion stayed within phase scope

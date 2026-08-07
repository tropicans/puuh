<!-- generated-by: gsd-doc-writer -->
# Development

**Analysis Date:** 2026-08-07

This document outlines the workflow and guidelines for developing the PUU Tracker application.

## Local Setup

Ensure that you have completed the basic installation steps described in [GETTING-STARTED.md](GETTING-STARTED.md). 

For active development, run:
```bash
npm run dev
```
This runs the frontend in Next.js dev server on port `3006` and watch-compiles the backend Express routes using `tsx watch` on port `3007`.

## Build Commands

All build scripts are managed from the root package manager and delegated to the respective workspaces:

| Command | Workspace | Description |
|---|---|---|
| `npm run dev` | Root | Concurrently runs frontend and backend dev environments. |
| `npm run build` | Root | Compiles backend TypeScript and builds frontend Next.js production files. |
| `npm run lint` | Root | Executes ESLint analysis on all source code. |
| `npm run format` | Root | Code formatting (where configured). |
| `npm run test` | Root | Executes Vitest unit tests in all workspaces. |
| `npm run smoke` | Root | Runs integration smoke flow testing scripts. |
| `npm run db:generate` | Root | Regenerates Prisma clients for both workspaces. |
| `npm run db:migrate` | Root | Deploys Prisma SQL migrations and seeds the backend. |

## Code Style

- **Linting:** ESLint is configured to inspect code quality. You can check for violations by running `npm run lint` from the monorepo root.
- **Formatting:** Code formatting should preserve nearby styles. Indentation is generally set to 2 spaces. Semicolons and quotes follow file-local styling conventions.
- **Types:** Strictly avoid using `any` types. TypeScript should be compiled under strict compiler settings.

## Branch Conventions

When working on features or bug fixes, branch names should follow these conventions:
- **Features:** `feat/feature-name` (e.g. `feat/ocr-toggle`)
- **Bug Fixes:** `fix/bug-description` (e.g. `fix/db-timeout`)
- **Maintenance:** `chore/task-name` (e.g. `chore/archive-milestone`)

The main development branch is `master`.

## PR Process

1. Create a branch from `master` following naming conventions.
2. Complete coding and verify all changes locally.
3. Ensure all unit and E2E smoke tests are passing before submitting:
   ```bash
   npm run test
   npm run smoke
   ```
4. Verify there are no lint violations by running `npm run lint`.
5. Open a Pull Request detailing the changes, and wait for CI/CD checks to pass and peer code review approval.

---

*Development analysis: 2026-08-07*

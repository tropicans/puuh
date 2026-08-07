# @puu/backend

Part of the [PUU Tracker](../../README.md) monorepo.

This workspace contains the Express.js API backend service hosting the core database access, file storage, and PDF layout extraction workflows.

## Tech Stack
- Express.js (TypeScript)
- Prisma (PostgreSQL)
- MinIO (S3 Client)
- OpenAI API Client

## Setup & Run

Dependencies are managed in the monorepo root workspace. To run the backend Express server individually in development mode:
```bash
npm run dev --workspace=backend
```
The server will start listening on port `3007`.

## Project Structure

- **`prisma/`** — Contains DB schemas, seeder script, and migration histories.
- **`src/routes/`** — Houses Express REST API endpoints (e.g. regulations, versions, authentication login).
- **`src/lib/`** — Hosts core business logic:
  - `pdf-service.ts` — Orchestrates PDF uploads to MinIO and layout-aware extraction conversions via Docling-serve fallback pipeline.
  - `ai-service.ts` — Parses raw converted text into articles and lists.
  - `storage.ts` — Connects to S3-compliant MinIO instance.
- **`src/middleware/auth.ts`** — Verifies session headers `X-User-Id` and `X-User-Role` received from Next.js BFF proxy.

## Testing

Run backend unit tests using Vitest:
```bash
npm run test --workspace=backend
```

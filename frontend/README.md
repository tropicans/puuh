# @puu/frontend

Part of the [PUU Tracker](../../README.md) monorepo.

This workspace contains the Next.js web application frontend which serves the UI pages and acts as a Backend-For-Frontend (BFF) proxy to the Express.js API backend.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- NextAuth.js
- Tailwind CSS v4 + shadcn/ui

## Setup & Run

Dependencies are managed in the monorepo root workspace. To run the frontend in development mode individually:
```bash
npm run dev --workspace=frontend
```
The server will start listening on port `3006`.

## BFF Integration Architecture

- **`src/actions/`** — Contains Next.js Server Actions (e.g. `regulations.ts`, `users.ts`) that proxy client calls to backend Express endpoints.
- **`src/lib/api.ts`** — Exporting helper `fetchFromBackend<T>` which attaches authenticated NextAuth session headers (`X-User-Id`, `X-User-Role`) to backend REST calls.
- **`src/proxy.ts`** — Default Next.js Middleware route authorization proxy.

## Testing

Run frontend unit tests using Vitest:
```bash
npm run test --workspace=frontend
```

<!-- generated-by: gsd-doc-writer -->
# Deployment

**Analysis Date:** 2026-08-07

This document details the deployment procedures and runtime environments for the PUU Tracker application.

## Deployment Targets

The primary deployment mechanism is containerization using Docker Compose.

### Monorepo Docker Compose Services
- **`app`** (Frontend): Serves Next.js on port `3006`. Uses multi-stage Docker builds.
- **`backend`** (Backend REST API): Serves Express.js on port `3007`. Uses multi-stage builds. Runs secure execution context as a non-root `node` user.
- **`db-migrate`** (Database Migrations): One-shot Prisma deployer executing migrations and seeds sequentially on DB bootstrap.
- **`postgres`** (Database): PostgreSQL relational database on port `5434`.
- **`minio`** (File Storage): Object storage host mapped to port `9002` (S3 API) and `9003` (Console).
- **`docling-serve`** (Layout Parser): Microservice running CPU-only layout conversion on port `5001`.

## Build Pipeline

To deploy the application stack in production mode:

1. Clone repository to host:
   ```bash
   git clone <repo-url>
   cd puuh
   ```
2. Verify production environment values (`.env` files in workspaces are set up correctly).
3. Build and launch all container services concurrently:
   ```bash
   docker compose up --build -d
   ```
4. On container starts, the `db-migrate` service will block until the PostgreSQL instance is healthy, then run `npx prisma migrate deploy` followed by `npx prisma db seed`.

## Environment Setup

Production environments require secure environment variables configuration (e.g. `DATABASE_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `OPENAI_API_KEY`, `AUTH_SECRET`). See [CONFIGURATION.md](CONFIGURATION.md) for details.

## Rollback Procedure

To roll back a deployment:
1. Revert to the previous stable git commit tag (e.g., `v2.0`):
   ```bash
   git checkout v2.0
   ```
2. Rebuild and run containers using Docker Compose:
   ```bash
   docker compose up --build -d
   ```
3. If database schema was changed, Prisma rollbacks must be handled manually using SQL migrations scripts from `.planning/milestones/v2.0-REQUIREMENTS.md` references or similar database snapshots.

## Monitoring

- **Logs:** Handled via console stdout formatting in `backend/src/utils/logger.ts`. Logs are stored in local container runtimes.
- **Health Checks:** Next.js container configuration includes a health check pinging `/login` (public page) to prevent false-unhealthy reporting due to NextAuth session verification blocks on API routes.

---

*Deployment analysis: 2026-08-07*

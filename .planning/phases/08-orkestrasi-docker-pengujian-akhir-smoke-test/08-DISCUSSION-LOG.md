# Phase 8: Orkestrasi Docker, Pengujian Akhir & Smoke Test - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-07
**Phase:** 8-Orkestrasi Docker, Pengujian Akhir & Smoke Test
**Areas discussed:** Backend Dockerization Strategy, Database Migration Strategy in Docker Compose, Environment Variable Management, Smoke Test Automation & Credentials Seeding

---

## Backend Dockerization Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-stage Production Dockerfile | Install dependencies, compile TypeScript via tsc to dist/, and run node dist/server.js using a non-root alpine node user. | ✓ |
| Simple/Development Dockerfile | Run tsx watch src/server.ts directly, mounting the source code for easier live debugging inside the container. | |

**User's choice:** Multi-stage Production Dockerfile (Recommended)
**Notes:** Reuses similar multi-stage optimizations from the frontend's Dockerfile.

---

## Database Migration Strategy in Docker Compose

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated Migration Container | Run a one-shot db-migrate service in docker-compose.yml that depends on postgres health, runs prisma migrate deploy && db seed, and blocks the backend container until it finishes successfully. | ✓ |
| Inline Startup Entrypoint | Run migrations directly in the backend container startup command (e.g. via a shell script that runs prisma migrate deploy && node dist/server.js). | |

**User's choice:** Dedicated Migration Container (Recommended)
**Notes:** Cleaner separation of concerns, ensuring backend starts only after DB setup is complete.

---

## Environment Variable Management

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated env_file properties | Use the env_file attribute in docker-compose.yml for the frontend and backend services, pointing directly to frontend/.env and backend/.env. | ✓ |
| Explicit environment block mapping | Keep docker-compose.yml environment variables mapped explicitly (e.g. key: ${VALUE}) referencing a single root-level .env file for simplicity. | |

**User's choice:** Dedicated env_file properties (Recommended)
**Notes:** Follows OPS-03's preference for separate `.env` files.

---

## Smoke Test Automation & Credentials Seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Host-side smoke execution | Seed a dedicated admin user via the database seed script using BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, and run the smoke test from the host machine (via npm run smoke) once the Docker Compose services are up and healthy. | ✓ |
| Self-contained Docker-side smoke execution | Create a short-lived smoke-test container inside docker-compose.yml that waits for the frontend container to be healthy, executes the script inside Docker, and exits. | |

**User's choice:** Host-side smoke execution (Recommended)
**Notes:** Keeps Compose clean while making host-side local verification easy.

---

## the agent's Discretion

- Wait-for-it or script mechanism to handle PG health checks.
- Container healthchecks timeout, interval, and retries configuration.

## Deferred Ideas

None — discussion stayed within phase scope.

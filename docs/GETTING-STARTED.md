<!-- generated-by: gsd-doc-writer -->
# Getting Started

**Analysis Date:** 2026-08-07

This guide walks you through setting up and running the PUU Tracker application.

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** >= 22.0.0 (LTS is recommended)
- **npm** >= 10.0.0
- **Docker Desktop** >= 4.0.0 (required for Postgres, MinIO, and Docling microservice)
- **Git**

## Installation Steps

Follow these steps to set up the project locally:

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd puu
   ```

2. Install the monorepo workspace dependencies:
   ```bash
   npm ci
   ```

3. Spin up the supporting services inside Docker Compose:
   ```bash
   docker compose up -d postgres minio docling-serve
   ```

4. Configure your environment variables:
   Copy `.env.example` to `.env` in both the `frontend/` and `backend/` directories, then customize the keys:
   ```bash
   cp frontend/.env.example frontend/.env
   # copy backend env example (if exists, or configure based on configuration guide)
   ```

5. Deploy the database migrations and seed default administrative users:
   ```bash
   npm run db:migrate
   ```

## First Run

Start the development server for both frontend and backend concurrently:
```bash
npm run dev
```

Open your browser to `http://localhost:3006`. The backend is running on `http://localhost:3007`.

## Common Setup Issues

### 1. Database Connection Failures
- **Issue:** Backend fails to start with error: `Invalid environment variables: DATABASE_URL`.
- **Solution:** Ensure `puu-tracker-postgres` container is running in Docker Compose and port `5434` is not bound by another local PostgreSQL instance.

### 2. NextAuth Secret Warnings
- **Issue:** Authentication fails or logs encrypt signature warnings.
- **Solution:** Generate a secure random base64 key by running `node -e "console.log(crypto.randomBytes(32).toString('base64'))"` and assign it to `AUTH_SECRET` in `frontend/.env`.

## Next Steps

- For local development standards and command scripting, see [DEVELOPMENT.md](DEVELOPMENT.md).
- To run unit and smoke tests, see [TESTING.md](TESTING.md).
- For environment flags configurations, see [CONFIGURATION.md](CONFIGURATION.md).

---

*Getting started analysis: 2026-08-07*

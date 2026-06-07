# Phase 1 Research: Environment, Authentication & Security Stabilization

This document outlines the findings and recommended implementation approach for stabilizing the environment, securing the application pages, and preparing the database schema migration workflow.

## 1. Database Port Mismatch Analysis

### Current Configuration
- **`.env` Database URL:**
  `DATABASE_URL="postgresql://puu_admin:puu123@localhost:5433/puu_tracker?schema=public"`
- **`docker-compose.yml` Postgres Service Ports:**
  ```yaml
  ports:
    - "5434:5432"
  ```

### Mismatch Details
The container runtime routes incoming host traffic on port `5434` to the container's PostgreSQL server on port `5432`. However, the local development configuration (`.env`) is configured to connect to port `5433`.
Because of this mismatch, when running the application on the host machine (e.g., via `npm run dev` or when running Prisma CLI migrations), the application will attempt to connect to port `5433` and fail.

### Recommendation
Update the `DATABASE_URL` in `.env` to map to port `5434`:
```env
DATABASE_URL="postgresql://puu_admin:puu123@localhost:5434/puu_tracker?schema=public"
```
This ensures local commands and the dev server on localhost can reach the Docker PostgreSQL instance.

---

## 2. Prisma Schema & Initial Migration Setup

### Current Status
- `prisma/schema.prisma` is missing the `url` field inside its `datasource db` block:
  ```prisma
  datasource db {
    provider = "postgresql"
  }
  ```
- No migration files currently exist under `prisma/migrations/`.

### Recommendation
To establish a version-controlled database migrations flow using Prisma, perform the following steps:

1. **Update `prisma/schema.prisma`:**
   Modify the `datasource db` block to explicitly reference the environment variable:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   *Note: Even though the Prisma Pg driver adapter resolves connections dynamically at runtime, the Prisma CLI needs this `url` schema entry to compile, track schema drift, and run migrations.*

2. **Generate and Apply Initial Migration:**
   Run the following commands:
   ```bash
   # Make sure Postgres container is running
   docker compose up -d postgres
   
   # Run Prisma migrate dev
   npx prisma migrate dev --name init_schema
   ```
   This command will compare the local schema in `prisma/schema.prisma` with the target database, generate an initial SQL migration script under `prisma/migrations/<timestamp>_init_schema/migration.sql`, apply it to the PostgreSQL database, and run `prisma generate` to update the Prisma Client bundle.

---

## 3. Page Guards: Upload & Manage Security

### Current Status
- Both `/upload/page.tsx` and `/manage/page.tsx` (and `/manage/version/[id]/page.tsx`) are marked as Client Components (`'use client';`) and lack access protection checks.
- Non-admin users or unauthenticated users can access these views, which exposes administrative controls (file uploads, parsing triggers, database edits).

### Recommended Approach: Layout-Level Route Protection
We recommend implementing security guards at the Next.js layout level by introducing layout Server Components at:
- `src/app/upload/layout.tsx`
- `src/app/manage/layout.tsx`

By using Layout Server Components:
1. Security checks are evaluated on the server *before* client-side scripts are fetched or rendered by the user's browser, preventing client-side bypasses.
2. Layout guards protect the main path and all sub-routes nested within them recursively. For instance, `src/app/manage/layout.tsx` automatically secures `/manage/version/[id]/page.tsx` without needing separate guards.

### Layout Implementation Code
Create `src/app/manage/layout.tsx` (and an identical version at `src/app/upload/layout.tsx`):
```typescript
import { getCurrentUser, isAdminRole } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function ManageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    // D-01: Redirect unauthenticated or non-admin users to the login page
    if (!user || !isAdminRole(user.role)) {
        redirect('/login');
    }

    return <>{children}</>;
}
```

---

## 4. Environment-Based Seed Credentials

### Current Status
- `src/actions/users.ts` and `seed-users.ts` hardcode the default passwords for the admin (`admin123`) and viewer (`viewer123`) roles.

### Recommendation
1. Add environment variables to `.env`:
   ```env
   # Seed Credentials
   SEED_ADMIN_PASSWORD="admin123"
   SEED_VIEWER_PASSWORD="viewer123"
   ```
2. Refactor `src/actions/users.ts` to check these env variables, falling back to current values:
   ```typescript
   const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
   const viewerPassword = process.env.SEED_VIEWER_PASSWORD || 'viewer123';
   ```
3. Refactor `seed-users.ts` in the same way to load from `process.env`.

---

## 5. File Changes Manifest

Below is the list of files that will be modified or added to implement Phase 01:

| File Path | Change Type | Description |
|-----------|-------------|-------------|
| `.env` | Modified | Update `DATABASE_URL` port to `5434` and add `SEED_ADMIN_PASSWORD`/`SEED_VIEWER_PASSWORD` |
| `prisma/schema.prisma` | Modified | Add `url = env("DATABASE_URL")` to the `datasource db` block |
| `prisma/migrations/` | Added (New Dir) | Initial database migrations containing the SQL schema snapshot (`init_schema`) |
| `src/actions/users.ts` | Modified | Read seed passwords from `process.env` with defaults |
| `seed-users.ts` | Modified | Read seed passwords from `process.env` with defaults |
| `src/app/upload/layout.tsx` | Created | Server-side security layout to guard `/upload` |
| `src/app/manage/layout.tsx` | Created | Server-side security layout to guard `/manage` and sub-pages |

---

## 6. Validation Architecture

To ensure the security guards and environmental configurations are correctly implemented, follow this verification flow:

### Local Docker & DB Alignment Verification
1. Start postgres and minio services:
   ```bash
   docker compose up -d postgres minio
   ```
2. Run Prisma migration check:
   ```bash
   npx prisma migrate status
   ```
   Confirm that the migration history matches the local directory state.

### Authentication & Role Verification Tests
1. **Unauthenticated Access Attempt:**
   - Log out of the application (clear cookies / clear session).
   - Navigate directly to `/upload` and `/manage`.
   - **Expected behavior:** Instantly redirected to `/login`.
2. **Viewer Account Access Attempt:**
   - Log in using a viewer account (e.g., `viewer@puu.local` / `viewer123`).
   - Navigate directly to `/upload` and `/manage`.
   - **Expected behavior:** Instantly redirected to `/login`.
3. **Admin Account Access Attempt:**
   - Log in using an admin account (e.g., `admin@puu.local` / `admin123`).
   - Navigate to `/upload` and `/manage`.
   - **Expected behavior:** Pages render successfully with full interactive capabilities.

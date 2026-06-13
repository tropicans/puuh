# Milestones

## v1.4 v1.4 (Shipped: 2026-06-13)

**Phases completed:** 1 phases, 0 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.0 v1.0 (Shipped: 2026-06-07)

**Phases completed:** 3 phases, 5 plans, 14 tasks

**Key accomplishments:**

- Aligned local development database port mapping to port 5434 and generated the initial Prisma migration history using Prisma v7 configuration standards.
- Implemented server-side layout guards to protect `/upload` and `/manage` pages from unauthenticated and non-admin access, and decoupled default credentials from the seeding script using environment variables.
- Scanned PDF page chunking and vision OCR processing parallelized using a lightweight promise pooling worker pattern
- Hardened article splitting regex parser for Indonesian legislation and Next.js server-side streaming download proxy route
- Configure Vitest testing environment and implement automated unit test suite for the verbatim LCS diff engine

---

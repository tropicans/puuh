# Technology Stack

**Analysis Date:** 2026-07-25

## Languages

**Primary:**
- TypeScript 5.x - All application code and server actions
- TS path alias `@/*` maps to `src/*` (strict typing enabled)

**Secondary:**
- JavaScript (ES Modules) - Build scripts and configuration files (`eslint.config.mjs`, `postcss.config.mjs`)

## Runtime

**Environment:**
- Node.js 20.x (indicated by `@types/node` dependency)
- Browser runtime for Next.js frontend

**Package Manager:**
- npm - Version indicated by package-lock.json presence
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack framework (App Router)
- React 19.2.3 - UI library

**Testing:**
- Vitest 4.1.8 - Unit and integration testing framework

**Build/Dev:**
- Tailwind CSS 4.x - CSS framework (using `@tailwindcss/postcss` and PostCSS)
- TypeScript compiler (`tsc`)
- PostCSS for styling compilation

## Key Dependencies

**Critical:**
- `prisma` & `@prisma/client` ^7.3.0 - Database ORM
- `next-auth` ^5.0.0-beta.30 - Authentication system
- `minio` ^8.0.6 - Object storage client for local/self-hosted PDF storage
- `openai` ^6.17.0 - LLM API client (configured for custom proxy)
- `pdfjs-dist` ^4.0.379 - Primary digital PDF text extraction library
- `pdf-lib` ^1.17.1 - PDF document manipulation and page splitting
- `pdf-parse` ^2.4.5 - Fallback PDF text extraction library
- `zod` ^4.3.6 - Input validation schema engine
- `@prisma/adapter-pg` ^7.3.0 / `pg` ^8.18.0 - PostgreSQL database client
- `bcryptjs` ^3.0.3 - Password hashing

**Infrastructure & UI:**
- `framer-motion` ^12.34.0 - UI animation library
- `lucide-react` ^0.563.0 - Icon set
- `next-themes` ^0.4.6 - Theme management (dark/light mode)
- `@radix-ui/*` - Headless UI component primitives (scroll-area, separator, slot, tabs)
- `class-variance-authority` & `clsx` & `tailwind-merge` - Tailwind CSS class utilities

## Configuration

**Environment:**
- Configured via `.env` file containing database credentials, MinIO access details, NextAuth secrets, Google Vision keys, and custom OpenAI proxy parameters.
- Key configuration variables: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `VISION_MODEL`, `GOOGLE_VISION_API_KEY`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`, `PASAL_ID_TOKEN`, `AUTH_SECRET`, `NEXTAUTH_URL`.

**Build:**
- `tsconfig.json` - TypeScript compiler options with alias paths mapping.
- `next.config.ts` - Next.js configuration.
- `postcss.config.mjs` - PostCSS configuration with Tailwind compiler.
- `eslint.config.mjs` - ESLint linter configuration.
- `components.json` - shadcn/ui configuration.
- `vitest.config.ts` - Vitest test suite runner setup.
- `prisma.config.ts` - Prisma ORM database connection setup.

## Platform Requirements

**Development:**
- Windows/macOS/Linux (any platform with Node.js 20.x and npm)
- Docker Desktop or container hosting runtime for running PostgreSQL and MinIO services locally.

**Production:**
- Multi-stage build `Dockerfile` and `docker-compose.yml` configured to build and package the application, database, and object storage services in container environments.

---

*Stack analysis: 2026-07-25*
*Update after major dependency changes*

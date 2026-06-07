# Technology Stack

**Analysis Date:** 2026-06-07

## Languages

**Primary:**
- TypeScript 5.x - All application code and server actions

**Secondary:**
- JavaScript (ES Modules) - Configuration files (`eslint.config.mjs`, `postcss.config.mjs`)

## Runtime

**Environment:**
- Node.js 20.x (indicated by `@types/node` dependency)
- Browser runtime for Next.js frontend

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack framework (App Router)
- React 19.2.3 - UI library
- Tailwind CSS 4.x - CSS framework (using `@tailwindcss/postcss`)

**Testing:**
- None - No test runner configured in `package.json`

**Build/Dev:**
- Next.js compiler
- TypeScript compiler (`tsc`)
- PostCSS for styling compilation

## Key Dependencies

**Critical:**
- `prisma` & `@prisma/client` 7.3.0 - Database ORM
- `next-auth` 5.0.0-beta.30 - Authentication system
- `minio` 8.0.6 - Object storage client for local/self-hosted PDF storage
- `openai` 6.17.0 - LLM API client (configured for custom proxy)
- `pdfjs-dist` 4.0.379 - Primary PDF text extraction library
- `pdf-lib` 1.17.1 - PDF document manipulation and page splitting

**Infrastructure:**
- `@prisma/adapter-pg` 7.3.0 / `pg` 8.18.0 - PostgreSQL database client
- `bcryptjs` 3.0.3 - Password hashing
- `zod` 4.3.6 - Input validation schema engine
- `framer-motion` 12.34.0 - UI animation library
- `lucide-react` 0.563.0 - Icon set
- `next-themes` 0.4.6 - Theme management (dark/light mode)

## Configuration

**Environment:**
- Configured via `.env` file containing:
  - Database connection (`DATABASE_URL`)
  - LLM credentials (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`)
  - App settings (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`)
  - Google Vision API (`GOOGLE_VISION_API_KEY`)
  - Auth settings (`AUTH_SECRET`, `NEXTAUTH_URL`)
  - MinIO Storage config (`MINIO_ENDPOINT`, `MINIO_PORT`, etc.)

**Build:**
- `tsconfig.json` - TypeScript configuration with `@/*` mapping to `./src/*`
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration

## Platform Requirements

**Development:**
- Windows/macOS/Linux
- Docker Desktop (for running PostgreSQL and MinIO services locally)

**Production:**
- Docker container hosting
- `Dockerfile` (multi-stage build) and `docker-compose.yml` configured

---

*Stack analysis: 2026-06-07*
*Update after major dependency changes*

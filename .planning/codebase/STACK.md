# Technology Stack

**Analysis Date:** 2026-06-08

## Languages

**Primary:**
- TypeScript 5.x - All application code (server actions, API routes, components, layout)

**Secondary:**
- JavaScript (ESLint config, smoke test scripts, build configuration)

## Runtime

**Environment:**
- Node.js v20.x (with npm 10.x, lockfile `package-lock.json` present)
- React 19.2.3 (server-side and client-side rendering)

**Package Manager:**
- npm 10.x

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router framework for routing, layouts, server-side rendering, and server actions
- React 19.2.3 - UI library

**Styling:**
- Tailwind CSS v4 - Styling utility library
- PostCSS - CSS preprocessor

**Testing:**
- None configured in `package.json` for unit testing (no Vitest/Jest)
- Smoke Test Runner: Custom JavaScript test script (`scripts/smoke-flow.mjs`)

**Build/Dev:**
- TypeScript 5.x - Static typing and compiler
- ESLint 9.x - Code linting and style compliance

## Key Dependencies

**Critical:**
- `@prisma/client` & `prisma` ^7.3.0 - Database schema compilation and ORM queries
- `next-auth` ^5.0.0-beta.30 - User authentication and session handling
- `openai` ^6.17.0 - Connection to custom LLM proxy for regulation parsing and change analysis
- `minio` ^8.0.6 - Client SDK for MinIO Object Storage (PDF/Document storage)
- `pdf-lib` ^1.17.1, `pdf-parse` ^2.4.5, `pdfjs-dist` ^4.0.379 - PDF reading, text extraction, and page splitting
- `zod` ^4.3.6 - Schema validation for incoming request payloads and forms
- `bcryptjs` ^3.0.3 - Password hashing and comparisons

**UI/Layout:**
- `lucide-react` ^0.563.0 - Standard icons library
- `framer-motion` ^12.34.0 - Fluid animations and transitions
- `@radix-ui/react-scroll-area` ^1.2.10, `@radix-ui/react-separator` ^1.1.8, `@radix-ui/react-slot` ^1.2.4, `@radix-ui/react-tabs` ^1.1.13 - Low-level UI primitives

## Configuration

**Environment:**
- `.env` - Environment variables configuration (ignored in Git)
- Configured keys: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `GOOGLE_VISION_API_KEY`, `AUTH_SECRET`, `NEXTAUTH_URL`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`

**Build:**
- `tsconfig.json` - TS compiler options
- `next.config.ts` - Next.js compiler settings and redirects
- `eslint.config.mjs` - ESLint linter configuration
- `postcss.config.mjs` - CSS processing rules
- `components.json` - Shadcn UI components registry configuration

## Platform Requirements

**Development:**
- Windows/macOS/Linux with Node.js 20.x
- Docker and Docker Compose (runs postgres on port 5434 and minio on 9002/9003 console, 9000 api)

**Production:**
- Deployment target: Docker container (`Dockerfile` and `docker-compose.yml` present)
- Environment Variables setup: Set in the container environment/docker-compose environment definition

---

*Stack analysis: 2026-06-08*
*Update after major dependency changes*

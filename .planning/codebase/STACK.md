# Technology Stack

**Analysis Date:** 2026-06-10

## Languages

**Primary:**
- TypeScript 5.x - All application code (`.ts`, `.tsx`, `.mts`)
- SQL (PostgreSQL) - Database queries via Prisma

**Secondary:**
- JavaScript (ESNext) - Next.js runtime and configuration files (`.mjs`)
- Docker Compose (YAML) - Container orchestration

## Runtime

**Environment:**
- Node.js 20.x - Server runtime
- Next.js 16.1.6 - React framework with App Router

**Package Manager:**
- npm 10.x - Package management
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - React framework with App Router, server actions, and API routes
- React 19.2.3 - UI library

**Testing:**
- Vitest 4.1.8 - Test runner with globals enabled
- TypeScript - Type checking in test environment

**Build/Dev:**
- Next.js build system - Automatic bundling and optimization
- ESLint 9 - Code linting with `eslint-config-next`
- Tailwind CSS 4 - Utility-first CSS framework
- PostCSS `@tailwindcss/postcss` - CSS processing

## Key Dependencies

**Critical:**
- `@prisma/client` 7.3.0 - ORM for PostgreSQL database operations
- `prisma` 7.3.0 - Database migration and schema management
- `next-auth` 5.0.0-beta.30 - Authentication system with JWT sessions
- `bcryptjs` 3.0.3 - Password hashing for user credentials
- `zod` 4.3.6 - Runtime type validation for forms and APIs

**Infrastructure:**
- `pg` 8.18.0 - PostgreSQL client pool
- `@prisma/adapter-pg` 7.3.0 - Prisma adapter for Node.js pg pool
- `minio` 8.0.6 - MinIO client for object storage
- `next` 16.1.6 - Framework core

**UI/UX:**
- `@radix-ui/react-*` - Accessible component primitives (tabs, slot, separator, scroll-area)
- `class-variance-authority` 0.7.1 - Class name variance management
- `clsx` 2.1.1 - Conditional class name utility
- `tailwind-merge` 3.4.0 - Tailwind class merging
- `framer-motion` 12.34.0 - Animation library
- `lucide-react` 0.563.0 - Icon library
- `next-themes` 0.4.6 - Dark/light theme support

**PDF & OCR:**
- `pdfjs-dist` 4.0.379 - PDF parsing in browser
- `pdf-parse` 2.4.5 - PDF text extraction
- `pdf-lib` 1.17.1 - PDF manipulation (splitting chunks)
- `sharp` 0.34.5 - Image processing

**LLM Integration:**
- `openai` 6.17.0 - OpenAI client library (used for custom proxy)
- Custom LLM proxy at `https://sembilan.kelazz.my.id/v1`

## Configuration

**Environment:**
- `.env` file in root directory
- `dotenv` 17.2.3 - Environment variable loading
- Key configs required:
  - `DATABASE_URL` - PostgreSQL connection string
  - `AUTH_SECRET` - NextAuth secret
  - `OPENAI_API_KEY`, `OPENAI_BASE_URL` - LLM provider
  - `GOOGLE_VISION_API_KEY` - OCR service
  - `MINIO_*` - Object storage credentials

**Build:**
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript compiler options
- `vitest.config.ts` - Test runner configuration
- `eslint.config.mjs` - ESLint rules

## Platform Requirements

**Development:**
- Node.js 20.x
- PostgreSQL 15+ (port 5433 locally, 5432 in Docker)
- MinIO (port 9000 locally, 9000 in Docker)
- npm or yarn

**Production:**
- Node.js 20.x runtime
- PostgreSQL 15+ (Docker container)
- MinIO object storage (Docker container)
- Standalone output mode (`output: "standalone"` in Next.js config)

---

*Stack analysis: 2026-06-10*

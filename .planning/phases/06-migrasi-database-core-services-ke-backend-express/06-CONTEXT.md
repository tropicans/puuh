# Phase 6: Migrasi Database & Core Services ke Backend Express - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Memindahkan modul data/database (Prisma schema, client, seed, dan migrasi) dan service inti backend (Minio Object Storage client, PDF extraction service, OCR service, dan AI LLM service) dari codebase Next.js ke Express backend terpisah di direktori `backend/`. Menyediakan REST API endpoint di Express untuk menerima file PDF secara multi-part via Multer, menyimpannya di Minio, mengekstrak data PDF, dan mengintegrasikan framework CORS untuk komunikasi aman dengan frontend.

</domain>

<decisions>
## Implementation Decisions

### Prisma & Database Workflow
- **D-01:** Pindahkan direktori `prisma/` sepenuhnya dari `frontend/` ke `backend/prisma/`. Backend akan menjadi satu-satunya pemilik schema, file migrasi, dan seed script database.
- **D-02:** Konfigurasi script pendelegasian di root `package.json` menggunakan npm workspaces agar developer tetap bisa memicu generate, migrate, dan seed secara langsung dari root directory (misalnya via workspace command).

### TypeScript & Prisma Types Sharing
- **D-03:** Jalankan `prisma generate` di kedua workspace (`frontend` dan `backend`). Hal ini memungkinkan frontend Next.js dan backend Express mengimpor types database secara natural dari `@prisma/client` tanpa memerlukan path-mapping yang kompleks ke `node_modules` backend.

### Multer / PDF Upload Storage
- **D-04:** Gunakan memory storage (`multer.memoryStorage()`) untuk penanganan unggahan file PDF di REST API backend. File PDF akan ditampung di memory sebagai buffer dan langsung distreaming ke MinIO, menghindari penulisan temporer ke disk server backend dan menyederhanakan proses cleanup.

### External Service Configs
- **D-05:** Implementasikan modul konfigurasi tersentralisasi di `backend/src/config/index.ts`. Modul ini akan membaca, memvalidasi (menggunakan Zod atau asersi type), dan mengekspor typed config objects untuk seluruh secrets/API keys/ports agar error konfigurasi dapat terdeteksi langsung saat startup backend.

### the agent's Discretion
- Struktur detail routing modular Express di backend (misalnya pengorganisasian folder `routes/` dan `controllers/` untuk resource regulations/versions) diserahkan ke kebijaksanaan implementation agent.
- Detail konfigurasi middleware CORS dan setup port database (port 5433/5434) dapat ditentukan secara fleksibel oleh agent demi kelancaran integrasi.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope & Requirements
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/ROADMAP.md) §Phase 6 — Goal, success criteria, and roadmap layout for Phase 6
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/REQUIREMENTS.md) §2 (API-01 to API-06) — Detailed requirements for database and backend REST API migration

### Prior Context
- [.planning/phases/05-reorganisasi-direktori-inisialisasi-monorepo-next-js-express/05-CONTEXT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/.planning/phases/05-reorganisasi-direktori-inisialisasi-monorepo-next-js-express/05-CONTEXT.md) — Phase 5 decisions on monorepo directory structures and npm workspaces

### Existing Configurations to Migrate
- [frontend/prisma/schema.prisma](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/frontend/prisma/schema.prisma) — Database schema definition to be moved to backend
- [frontend/src/lib/prisma.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/frontend/src/lib/prisma.ts) — Prisma client singleton setup
- [frontend/src/lib/pdf-service.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/frontend/src/lib/pdf-service.ts) — PDF extraction service
- [frontend/src/lib/ai-service.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/frontend/src/lib/ai-service.ts) — LLM integration for article parsing
- [frontend/src/lib/storage.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/puuh/frontend/src/lib/storage.ts) — MinIO storage integration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Database Client setup**: `frontend/src/lib/prisma.ts` template can be replicated in backend to initialize connection to PostgreSQL.
- **Multer client configuration**: Backend Express can use standard standard `multer` library configuration with memory storage.
- **Service modules**: `pdf-service.ts`, `ai-service.ts`, `ocr-service.ts`, and `storage.ts` are modular and can be directly moved to backend package with minor path changes.

### Established Patterns
- **Env files**: Environment variable naming conventions from frontend's `.env` (like `DATABASE_URL`, `MINIO_*`, `OPENAI_*`) should be carried over to backend.
- **Port mapping**: Backend port is configured on `3007` (defined in Phase 5).

### Integration Points
- **Next.js frontend**: API routing handlers currently defined in `frontend/src/app/api/upload/route.ts` and `frontend/src/app/api/regulations/route.ts` will eventually point to `http://localhost:3007/api/...` instead of direct Prisma/storage calls (to be fully integrated in Phase 7).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-Migrasi Database & Core Services ke Backend Express*
*Context gathered: 2026-08-07*

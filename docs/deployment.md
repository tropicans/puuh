# PUU Tracker Deployment & Operations Guide

This guide details the steps required to deploy, run, and maintain the **PUU Tracker** application in local development or production environments.

---

## 1. Environment Configuration

The application requires several environment variables to establish database, storage, and AI service connections. Create a `.env` file in the project root based on the following template:

```env
# Database Settings
# Note: For local development, connect to host port 5434
DATABASE_URL="postgresql://puu_admin:puu123@localhost:5434/puu_tracker?schema=public"

# NextAuth Settings
# Generate a secret key using: openssl rand -base64 32
AUTH_SECRET="your-32-character-nextauth-secret"
AUTH_URL="http://localhost:3006/api/auth"
AUTH_TRUST_HOST="true"

# MinIO Object Storage Settings
MINIO_ENDPOINT="localhost"
MINIO_PORT=9002
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="minio_admin"
MINIO_SECRET_KEY="minio_secret_pass"
MINIO_BUCKET_NAME="puu-documents"

# LLM, Vision OCR & Fetcher Settings
OPENAI_API_KEY="your-llm-api-key"
OPENAI_BASE_URL="https://proxy.kelazz.my.id/v1"
OPENAI_MODEL="gemini-2.5-flash"
GOOGLE_VISION_API_KEY="optional-google-vision-key"

# Optional Pasal.id API token (for automatic fetch fallback Strategy 4)
# Highly recommended for maximum automatic fetch success rates
PASAL_ID_TOKEN="your-pasal-id-personal-token"
```

---

## 2. Docker Compose Infrastructure

The project includes a `docker-compose.yml` file that orchestrates all auxiliary database and S3-compatible storage services:

```bash
docker compose up -d
```

### Managed Services
1. **postgres**: A PostgreSQL 15 database container.
   * **Host port**: `5434` (mapped to internal container port `5432`).
   * **Persistence**: Named volume `postgres_data`.
2. **minio**: An S3-compatible SQS object storage service.
   * **API port**: `9002` (mapped to internal container port `9000`).
   * **Console web UI**: `9003` (mapped to internal container port `9001`).
   * **Persistence**: Named volume `minio_data`.
3. **createbuckets**: A startup utility container using the MinIO CLI (`mc`) that:
   * Adds the local MinIO host configuration.
   * Creates the default bucket specified in `MINIO_BUCKET_NAME`.
   * Sets the bucket read policy to public `download` for secure, anonymous file downloads.
4. **app**: The production build container for the Next.js application, exposed on port `3006`.

---

## 3. Database Migrations & User Seeding

Before running the application, prepare the database:

### Generate Prisma Client
Generates the type-safe client query library:
```bash
npx prisma generate
```

### Apply Schema
Applies migrations to the target database:
* **Development/Local**: Use Prisma push for fast schema updates:
  ```bash
  npx prisma db push
  ```
* **Production**: Run migrations cleanly:
  ```bash
  npx prisma migrate deploy
  ```

### Seed Default Users
Seed database roles by executing the user seed script. Set target seed passwords using env variables `SEED_ADMIN_PASSWORD` and `SEED_VIEWER_PASSWORD`:
```bash
# Set passwords
$env:SEED_ADMIN_PASSWORD="secure_admin_pass"
$env:SEED_VIEWER_PASSWORD="secure_viewer_pass"

# Run seed command
npx tsx seed-users.ts
```

Seeded credentials will be created for:
* **Admin**: `admin@puutracker.com`
* **Viewer**: `viewer@puutracker.com`

---

## 4. Building & Running Locally

### Development Server
Run a hot-reloading development server on port `3006`:
```bash
npm run dev
```

### Production Build & Run
Test the production-ready build artifacts:
```bash
# Compile and build the Next.js application
npm run build

# Start the optimized production server
npm run start
```

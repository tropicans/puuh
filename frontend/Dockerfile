FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend --include-workspace-root

# Rebuild the source code only when needed
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/frontend
# Generate prisma client using schema from backend
RUN npx prisma generate --schema=../backend/prisma/schema.prisma
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install wget for healthcheck and poppler for PDF→PNG conversion (Vision OCR)
RUN apk add --no-cache wget poppler-utils

COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/login || exit 1

CMD ["node", "frontend/server.js"]

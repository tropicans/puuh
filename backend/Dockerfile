FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --include-workspace-root

# Rebuild the source code only when needed
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Production dependencies only
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --omit=dev --include-workspace-root
# Copy generated Prisma Client from builder to keep it
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client /app/node_modules/@prisma/client

# Production runner stage
FROM base AS runner
ENV NODE_ENV production

# Install wget for healthcheck and poppler for PDF→PNG conversion (Vision OCR)
USER root
RUN apk add --no-cache wget poppler-utils

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Copy dependencies and build artifacts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY backend/package.json ./backend/

WORKDIR /app/backend
EXPOSE 3007
ENV PORT 3007

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3007/health || exit 1

CMD ["node", "dist/server.js"]

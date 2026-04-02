# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy built output
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 ordex
USER ordex

EXPOSE 5000

# Run database migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

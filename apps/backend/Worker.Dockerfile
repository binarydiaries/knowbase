# ── Build stage ───────────────────────────────────────────────────────────────
FROM oven/bun AS build

WORKDIR /app

# Install deps first (cached until package manifests change).
COPY package.json bun.lock ./
COPY packages/models/package.json ./packages/models/
COPY packages/ui/package.json ./packages/ui/
COPY apps/backend/package.json ./apps/backend/
COPY apps/client/package.json ./apps/client/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/embed/package.json ./apps/embed/
COPY apps/landing/package.json ./apps/landing/
COPY apps/orchestration/package.json ./apps/orchestration/
COPY apps/orchestration2/package.json ./apps/orchestration2/

RUN bun install --frozen-lockfile

# Copy source after install
COPY packages/models/ ./packages/models/
COPY apps/backend/ ./apps/backend/

WORKDIR /app/apps/backend

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile out/worker-server \
	src/queue/worker.ts

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/apps/backend/out/worker-server ./worker-server

ENV NODE_ENV=production

CMD ["./worker-server"]

# ── Build stage ───────────────────────────────────────────────────────────────
FROM oven/bun AS build

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Install deps first (cached until package manifests change).
# All workspace package.jsons must be present so bun resolves workspace deps.
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

# Copy source (after install to keep the layer cache hot on code-only changes)
COPY packages/models/ ./packages/models/
COPY apps/backend/ ./apps/backend/

WORKDIR /app/apps/backend

ENV NODE_ENV=production

# Run migrations (fails the build if the DB is unreachable or migration errors)
RUN bun run db:migrate

# Compile server and worker binaries
RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile out/server \
	src/index.ts

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

COPY --from=build /app/apps/backend/out/server ./server
COPY --from=build /app/apps/backend/out/worker-server ./worker-server

ENV NODE_ENV=production

EXPOSE 3000

CMD ["./server"]

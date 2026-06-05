# ── Build stage ───────────────────────────────────────────────────────────────
FROM oven/bun AS build

WORKDIR /app

# Install deps first (cached until package manifests change).
# All workspace package.jsons must be present so bun resolves @knowbase/models.
COPY package.json bun.lock ./
COPY packages/models/package.json ./packages/models/
COPY packages/ui/package.json ./packages/ui/
COPY apps/orchestration/package.json ./apps/orchestration/
COPY apps/backend/package.json ./apps/backend/
COPY apps/client/package.json ./apps/client/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/embed/package.json ./apps/embed/
COPY apps/landing/package.json ./apps/landing/
COPY apps/orchestration2/package.json ./apps/orchestration2/

RUN bun install --frozen-lockfile

# Copy source (after install to keep the layer cache hot on code-only changes)
COPY packages/models/ ./packages/models/
COPY apps/orchestration/ ./apps/orchestration/

# ── Runtime stage ─────────────────────────────────────────────────────────────
# Bun runs TypeScript natively — no compile step needed.
# Docker's COPY follows workspace symlinks and materialises @knowbase/models
# as a real directory, so the monorepo layout resolves cleanly at runtime.
FROM oven/bun

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/models ./packages/models
COPY --from=build /app/apps/orchestration ./apps/orchestration

WORKDIR /app/apps/orchestration

ENV NODE_ENV=production
ENV PORT=2024

EXPOSE 2024

CMD ["bun", "run", "src/server.ts"]

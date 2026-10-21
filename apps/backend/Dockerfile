# Build from the repository root: docker build -f apps/backend/Dockerfile .
FROM oven/bun:1.4.3 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/client/package.json apps/client/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY apps/embed/package.json apps/embed/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN bun install --frozen-lockfile --ignore-scripts --network-concurrency 4
COPY . .
WORKDIR /app/apps/backend
# Bun folds NODE_ENV while compiling; select the production logger at build time.
ENV NODE_ENV=production
RUN bun build --compile --minify-whitespace --minify-syntax --outfile server src/index.ts

FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=build /app/apps/backend/server ./server
ENV NODE_ENV=production
CMD ["./server"]
EXPOSE 3000

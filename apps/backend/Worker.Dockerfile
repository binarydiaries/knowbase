# Build from the repository root: docker build -f apps/backend/Worker.Dockerfile .
FROM oven/bun:1.4.3 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile --ignore-scripts
WORKDIR /app/apps/backend
RUN bun build --compile --minify-whitespace --minify-syntax --outfile worker src/queue/worker.ts

FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=build /app/apps/backend/worker ./worker
ENV NODE_ENV=production
CMD ["./worker"]

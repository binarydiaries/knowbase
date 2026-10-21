# Build from the repository root: docker build -f apps/backend/Dockerfile .
FROM oven/bun:1.4.3 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile --ignore-scripts
WORKDIR /app/apps/backend
RUN bun build --compile --minify-whitespace --minify-syntax --outfile server src/index.ts

FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=build /app/apps/backend/server ./server
ENV NODE_ENV=production
CMD ["./server"]
EXPOSE 3000

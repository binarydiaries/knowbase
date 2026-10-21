# Build from the repository root.
FROM oven/bun:1.4.3 AS builder
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
ARG LANDING_URL
ARG PUBLIC_APP_URL
ARG PUBLIC_API_BASE
ARG PUBLIC_EMBED_URL
ARG PUBLIC_CHANNEL_ID
ARG PUBLIC_AMPLITUDE_API_KEY
ARG PUBLIC_RECAPTCHA_SITE_KEY
ARG PUBLIC_ENV
RUN bun run build:landing

FROM nginx:alpine AS runtime
COPY apps/landing/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 8080

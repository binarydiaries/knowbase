# Build from the repository root.
FROM oven/bun:1.4.3 AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile --ignore-scripts
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

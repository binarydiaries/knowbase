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

# Build
ARG VITE_API_BASE
ARG VITE_LANDING_URL
RUN bun run build:client


FROM nginx:alpine

COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

RUN echo 'server { \
  listen 3000; \
  root /usr/share/nginx/html; \
  \
  # index.html must never be cached — old HTML referencing stale \
  # asset hashes causes a broken UI after every redeployment. \
  location = /index.html { \
    add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    add_header Pragma "no-cache"; \
    add_header Expires "0"; \
  } \
  \
  # Hashed assets are immutable — cache them aggressively. \
  location /assets/ { \
    add_header Cache-Control "public, max-age=31536000, immutable"; \
  } \
  \
  # SPA fallback for client-side routes. \
  location / { \
    index index.html; \
    try_files $uri /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
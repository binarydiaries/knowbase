FROM oven/bun:1 AS builder

WORKDIR /app

# Copy everything FIRST (important for workspaces)
COPY . .

# Install ALL workspace deps properly
RUN bun install --frozen-lockfile

# Build
RUN bun run build:landing


FROM nginx:alpine

COPY --from=builder /app/apps/landing2/dist /usr/share/nginx/html

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
  # Proxy /docs to Mintlify. \
  location /docs { \
    proxy_pass https://arokart.mintlify.dev; \
    proxy_set_header Host arokart.mintlify.dev; \
    proxy_set_header X-Forwarded-Host agenvik.com; \
    proxy_set_header X-Forwarded-Proto https; \
    proxy_ssl_server_name on; \
  } \
  \
  # SPA fallback for client-side routes. \
  location / { \
    index index.html; \
    try_files $uri /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
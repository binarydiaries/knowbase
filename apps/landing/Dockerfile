FROM oven/bun:1 AS builder

WORKDIR /app

# Copy everything FIRST (important for workspaces)
COPY . .

# Install ALL workspace deps properly
RUN bun install --frozen-lockfile

# Build landing only
RUN bun run build:landing


FROM nginx:alpine

COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html

RUN echo 'server { \
  listen 3000; \
  server_name _; \
  root /usr/share/nginx/html; \
  \
  # index.html must never be cached. \
  location = /index.html { \
    add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    add_header Pragma "no-cache"; \
    add_header Expires "0"; \
  } \
  \
  # Hashed assets are immutable and can be cached aggressively. \
  location /assets/ { \
    add_header Cache-Control "public, max-age=31536000, immutable"; \
  } \
  \
  # Redirect /blog -> /blog/ \
  location = /blog { \
    return 301 /blog/; \
  } \
  \
  # Proxy /blog/* to the Astro blog. \
  # IMPORTANT: No trailing slash in proxy_pass so the /blog prefix is preserved. \
  # Astro is built with base=/blog, so the upstream expects URLs like /blog/... \
  location ^~ /blog/ { \
    proxy_pass https://blog-stage.agenvik.com; \
    proxy_set_header Host blog-stage.agenvik.com; \
    proxy_set_header X-Forwarded-Host stage.agenvik.com; \
    proxy_set_header X-Forwarded-Proto https; \
    proxy_ssl_server_name on; \
    proxy_redirect off; \
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

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
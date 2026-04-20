FROM oven/bun:1 AS builder

WORKDIR /app

# Copy everything FIRST (important for workspaces)
COPY . .

# Install ALL workspace deps properly
RUN bun install --frozen-lockfile

# Build
RUN bun run build:landing


FROM nginx:alpine

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

RUN echo 'server { \
  listen 3000; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
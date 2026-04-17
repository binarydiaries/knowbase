# Stage 1: Build
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy root files (important for monorepo)
COPY package.json bun.lock ./
RUN bun install

# Copy required code only
COPY apps/dashboard ./apps/dashboard
COPY packages ./packages

# Build dashboard
RUN bun run build:dashboard


# Stage 2: Serve
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

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb* bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html/blog

RUN echo 'server { \
  listen 80; \
  server_name _; \
  root /usr/share/nginx/html; \
  \
  location /blog/ { \
    index index.html; \
    try_files $uri $uri/ /blog/index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
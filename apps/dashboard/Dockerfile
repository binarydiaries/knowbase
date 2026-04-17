FROM oven/bun:1 AS builder

WORKDIR /app

# ✅ Copy ALL root config (CRITICAL)
COPY package.json bun.lock turbo.json ./

# Install deps
RUN bun install

# ✅ Copy EVERYTHING (not partial)
COPY . .

# ✅ Now Turbo will work properly
RUN bun run build:dashboard


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
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb* bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build Astro site
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy generated files directly to nginx root
# IMPORTANT: Do NOT copy to /usr/share/nginx/html/blog
# Astro already generates files inside a /blog folder because base='/blog'
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx configuration
RUN echo 'server { \
  listen 80; \
  server_name _; \
  root /usr/share/nginx/html; \
  \
  # Serve the blog under /blog without redirecting \
  location /blog/ { \
    try_files $uri $uri/ /blog/index.html; \
  } \
  \
  # Optional root response for direct access to blog-stage.agenvik.com \
  location = / { \
    return 404; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
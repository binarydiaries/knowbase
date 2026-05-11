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

# Copy generated static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
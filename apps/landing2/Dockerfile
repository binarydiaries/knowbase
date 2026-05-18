FROM oven/bun:1 AS builder

WORKDIR /app

# Copy everything FIRST (important for workspaces)
COPY . .

# Install ALL workspace deps properly
RUN bun install --frozen-lockfile

# Build
RUN bun run build

FROM httpd:2.4 AS runtime
COPY --from=build /app/dist /usr/local/apache2/htdocs/
EXPOSE 80
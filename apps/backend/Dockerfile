FROM oven/bun AS build

WORKDIR /app

# Legacy build-time migrations require this value. Supply development credentials
# only until migrations are moved to a separate release step; never print it.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY . .

ENV NODE_ENV=production

# ✅ RUN MIGRATIONS HERE (FAILS BUILD IF ERROR)
RUN bun run db:migrate

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000

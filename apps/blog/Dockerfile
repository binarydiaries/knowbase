FROM oven/bun:1 AS builder
WORKDIR /app

COPY . .

RUN bun install
RUN bun run build

CMD node ./dist/server/entry.mjs
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY core/package.json ./core/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN bun install --frozen-lockfile
COPY core ./core
COPY client ./client
COPY server ./server
RUN cd client && bun run build
RUN cd server && bunx prisma generate

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "cd server && bunx prisma migrate deploy && bun run src/index.ts"]

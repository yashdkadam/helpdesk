FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
COPY core/package.json ./core/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN mkdir -p e2e && echo '{"name":"e2e","version":"1.0.0","private":true}' > e2e/package.json
RUN bun install
COPY core ./core
COPY client ./client
COPY server ./server
RUN cd server && bunx prisma generate
RUN cd client && bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "cd server && bunx prisma migrate deploy && bun run src/index.ts"]

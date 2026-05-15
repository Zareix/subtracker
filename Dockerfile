FROM oven/bun:1.3.14 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
RUN bun run build


FROM oven/bun:1.3.14-distroless AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
ENV APP_DIR=/app/data

VOLUME ${APP_DIR}

EXPOSE 3000

USER nonroot:nonroot

CMD ["./.output/server/index.mjs"]

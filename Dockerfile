FROM oven/bun:1.4.0 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
RUN bun run build
RUN mkdir -p /app/data/


FROM oven/bun:1.4.0-distroless AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/db.sqlite
ENV UPLOADS_FOLDER=/app/data/uploads

WORKDIR /app

COPY --from=builder --chown=nonroot:nonroot /app/.output ./.output
COPY --from=builder --chown=nonroot:nonroot /app/drizzle ./drizzle
COPY --from=builder --chown=nonroot:nonroot /app/data ./data

VOLUME /app/data

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["bun", "-e", "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

EXPOSE 3000

USER nonroot:nonroot

CMD ["./.output/server/index.mjs"]

# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile -t lingo-sketch-api .
#
# Run locally:
#   docker run --rm -p 3000:3000 --env-file apps/api/.env lingo-sketch-api

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @lingo-sketch/api

COPY apps/api ./apps/api
RUN pnpm --filter @lingo-sketch/api build
RUN pnpm deploy --filter @lingo-sketch/api --prod /deploy/api
RUN cp -r /app/apps/api/dist /deploy/api/dist

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nestjs

COPY --from=build /deploy/api ./
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

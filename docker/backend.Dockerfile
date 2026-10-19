# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Backend image (NestJS + Prisma ORM 8) for the kafedra-week5 monorepo.
#
# Build context is the repository root so the npm workspace lockfile can be
# used:  docker build -f docker/backend.Dockerfile .
#
# Stages:
#   deps    -> installs backend dependencies (workspace-scoped)
#   build   -> compiles backend/dist/server.mjs with tsdown
#   dev     -> runtime with node_modules for `tsx watch` (hot reload)
#   runtime -> production image (dist + Prisma CLI for the DB schema init)
# ---------------------------------------------------------------------------

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace backend --include-workspace-root


FROM deps AS build
COPY backend ./backend
RUN npm run build --workspace backend


# ------------------------------- development -------------------------------
FROM deps AS dev
WORKDIR /app/backend
ENV NODE_ENV=development
# The whole backend/ directory is bind-mounted at run time for hot reload (see
# docker-compose.dev.yml); this copy is a fallback for running the dev image
# standalone. Uploads go to UPLOADS_DIR (a separate volume), not here.
COPY backend ./backend
COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint.sh
RUN chmod +x /usr/local/bin/backend-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["backend-entrypoint.sh"]
CMD ["npx", "--no-install", "tsx", "watch", "src/main.ts"]


# ------------------------------- production --------------------------------
FROM deps AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# Compiled server, Prisma migrations and the config required to run
# `prisma db migrate`.
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY backend/migrations ./migrations
COPY backend/prisma.config.ts ./prisma.config.ts
COPY backend/prisma-composer.config.ts ./prisma-composer.config.ts
COPY backend/module.ts ./module.ts
COPY backend/service.ts ./service.ts
COPY backend/src ./src

COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint.sh
RUN chmod +x /usr/local/bin/backend-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["backend-entrypoint.sh"]
CMD ["node", "dist/server.mjs"]

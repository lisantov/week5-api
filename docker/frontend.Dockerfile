# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Frontend image (Vite + React + TypeScript) for the kafedra-week5 monorepo.
#
# Build context is the repository root:  docker build -f docker/frontend.Dockerfile .
#
# Stages:
#   deps    -> installs frontend dependencies (workspace-scoped)
#   build   -> produces the static bundle in frontend/dist
#   dev     -> runs the Vite dev server (hot reload) on port 5173
#   runtime -> nginx serving the static bundle on port 80
# ---------------------------------------------------------------------------

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace frontend --include-workspace-root


FROM deps AS build
COPY frontend ./frontend
RUN npm run build --workspace frontend


# ------------------------------- development -------------------------------
FROM deps AS dev
WORKDIR /app/frontend
ENV NODE_ENV=development
# The whole frontend/ directory is bind-mounted at run time for hot reload
# (see docker-compose.dev.yml); this copy is a fallback for running the dev
# image standalone.
COPY frontend ./frontend
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


# ------------------------------- production --------------------------------
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80

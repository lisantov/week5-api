# kafedra-week5

Monorepo: NestJS API + React frontend.

## Structure

```
backend/    NestJS API (Prisma 8 + Prisma Composer), port 3000
frontend/   Vite + React + TypeScript, port 5173
```

## Run locally

```bash
npm install
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
```

Open http://localhost:5173 — the Vite dev server proxies `/videos` and
`/uploads` to the API on `http://localhost:3000`.

### Direct API mode (no Composer)

Requires `DATABASE_URL` (see `backend/.env.example`):

```bash
npm run dev:api
```

## Video flow

1. `POST /videos/preview` (multipart, field `file`) — cover is stored in
   `backend/uploads/temp`, responds with `{ "preview": "preview-<id>.<ext>" }`.
2. `POST /videos/video` (multipart, field `file`) — video goes to temp,
   responds with `{ "video": "video-<id>.<ext>" }`.
3. `POST /videos` (JSON) — body:

   ```json
   { "title": "...", "author": "...", "description": "...", "preview": "...", "video": "..." }
   ```

   Both files move from temp into `backend/uploads/previews` and
   `backend/uploads/videos`, a DB row is created with paths like
   `previews/<file>` / `videos/<file>`.

4. `GET /uploads/previews/<file>` / `GET /uploads/videos/<file>` — serves the
   files (Range support, so `<video>` seeking works).

## Docker Compose

Runs the whole stack: PostgreSQL, pgAdmin, the NestJS API, the frontend and an
nginx edge reverse proxy.

```bash
cp .env.example .env        # optional, the defaults work out of the box
docker compose up --build   # or: npm run docker:prod
```

| Service  | Published at        | Notes                                                              |
| -------- | ------------------- | ------------------------------------------------------------------ |
| nginx    | http://localhost    | `HTTP_PORT`. Single entrypoint: `/` → frontend, `/videos` + `/uploads` → backend |
| frontend | — (behind nginx)    | static build served by nginx                                        |
| backend  | — (behind nginx)    | applies `prisma db migrate` on start, then runs the compiled server |
| pgAdmin  | http://localhost:5050 | login `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`        |
| db       | localhost:5432      | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`               |

The database is migrated automatically: the backend entrypoint runs
`prisma db migrate` (idempotent) before the server starts, applying the
migrations from `backend/migrations`. After changing the contract
(`backend/src/prisma/contract.prisma`) plan a new migration (see
[Backend](#backend)) and rebuild the backend image so the migrations are baked
in.

Data is kept in named volumes: `db-data` (PostgreSQL), `uploads` (uploaded
videos / previews) and `pgadmin-data`.

Uploaded files are written to `UPLOADS_DIR` (default `./uploads` locally,
`/app/uploads` in Docker) and the `uploads` volume is mounted there — outside
the app directory — so Docker never creates a root-owned `backend/uploads`
directory in your working tree.

### Development (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# or: npm run docker:dev
```

The source directories (`backend` and `frontend`) are bind-mounted into the
container, so edits to code *and* config files (`tsconfig.json`,
`prisma.config.ts`, migrations, `vite.config.ts`) take effect immediately: the
backend runs `tsx watch` and the frontend runs the Vite dev server. The app and
its `node_modules` come from the image, and uploads go to the `uploads` volume
(`UPLOADS_DIR=/app/uploads`) instead of the bind mount, so Docker never creates
root-owned directories inside your working tree. Besides the nginx entrypoint,
the dev ports are published directly:

- http://localhost:5173 — Vite dev server (HMR, `/videos` and `/uploads`
  proxied to the backend)
- http://localhost:3000 — backend API

### Useful commands

```bash
docker compose logs -f backend   # follow a single service
docker compose down              # stop, keep data   (npm run docker:down)
docker compose down -v           # stop and delete volumes (npm run docker:reset)
```

## Backend

- Contract: `backend/src/prisma/contract.prisma`
- Migrations: `backend/migrations`
- Prisma and Composer config: `backend/prisma.config.ts`
- Composer app: `backend/module.ts` and `backend/service.ts`

```bash
npm run composer:deploy   # deploy via Composer
npm run dev:composer      # build + composer dev
```

### Changing the contract

```bash
# 1. edit backend/src/prisma/contract.prisma, then:
npm run contract:emit -w backend                 # regenerate contract.json / contract.d.ts
npm run migration:plan -w backend -- --name <slug>   # write a migration under backend/migrations
npm run migrate -w backend                       # apply migrations to the database
```

## Frontend

```bash
npm run build:web   # typecheck + vite build
```

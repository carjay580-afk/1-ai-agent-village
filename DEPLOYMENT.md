# Deploying AI Agent Village 🍁

**AI Agent Village** is architected for zero-friction deployment as a single unified service (compiled Express 5 server + Vite production SPA bundle on a single port) supporting **two interchangeable PostgreSQL storage modes**:

1. **Managed / Container PostgreSQL (`DATABASE_URL`)** — Recommended for horizontal scaling or multi-replica cloud setups (Render Postgres, Railway Postgres, Supabase, Neon, AWS RDS, or `docker-compose.yml`). Startup migrations are protected by PostgreSQL advisory locks (`pg_advisory_lock`) so concurrent replicas never conflict.
2. **Zero-Config Embedded Persistent PostgreSQL 16 (`PGlite`)** — Automatically active whenever `DATABASE_URL` is omitted. Persists full ACID PostgreSQL data directly to `/data/village-pgdata` (when a `/data` volume is mounted) or `.data/village-pgdata`.

---

## Option 1: Docker Compose (Full Stack: App + PostgreSQL 16)

```bash
POSTGRES_PASSWORD="your-strong-password" docker compose up -d --build
```

- App URL: `http://localhost:3000`
- Liveness check: `http://localhost:3000/healthz`
- Readiness check (verifies PostgreSQL connectivity): `http://localhost:3000/readyz`

---

## Option 2: Single Docker Container (Embedded Persistent Volume)

```bash
docker build -t ai-agent-village:latest .
docker run -d \
  --name ai-agent-village \
  -p 3000:3000 \
  -v village_data:/data \
  --restart unless-stopped \
  ai-agent-village:latest
```

---

## Option 3: Fly.io (Toronto `yyz` Canadian Region 🍁)

`fly.toml` is pre-configured for **Toronto (`yyz`)** with a persistent `/data` volume and HTTPS enforcement:

```bash
fly auth login
fly launch --copy-config --no-deploy
fly volumes create village_data --region yyz --size 3
fly deploy
```

*(Optional: attach Fly Postgres instead by setting `fly secrets set DATABASE_URL="postgres://..."`.)*

---

## Option 4: Render (1-Click Blueprint via `render.yaml`)

1. Open the **Render Dashboard** → **New +** → **Blueprint**.
2. Select your `carjay580-afk/1-ai-agent-village` repository.
3. Render automatically reads `render.yaml` and provisions:
   - **`ai-agent-village`** Node 22 Web Service (`npm ci && npm run build` → `npm run start`, healthcheck `/healthz`)
   - **`ai-agent-village-db`** Managed PostgreSQL 16 instance wired via `DATABASE_URL`.

---

## Option 5: Railway (1-Click via `railway.json`)

1. In **Railway**, click **New Project** → **Deploy from GitHub repo** → select `1-ai-agent-village`.
2. Railway automatically builds `Dockerfile` and monitors `/healthz`.
3. Add either a **Railway PostgreSQL** plugin (automatically injects `DATABASE_URL`) **or** attach a **Volume** mounted at `/data`.

---

## Option 6: Bare-Metal / VPS / Cloud VM (Node 20/22 + PM2 or systemd)

```bash
npm ci
npm run build
npm prune --omit=dev

# Optional standalone migration check before starting traffic:
npm run db:migrate

# Start compiled production server:
PORT=3000 NODE_ENV=production npm run start
```

---

## Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port bound by the unified server |
| `HOST` | `0.0.0.0` | Network interface bind address |
| `NODE_ENV` | `production` | Enables compiled static bundle serving & immutable asset caching |
| `DATABASE_URL` | *(unset)* | PostgreSQL connection URI; when unset, uses persistent PGlite |
| `PGSSLMODE` | *(auto)* | Set `require` for TLS cloud databases or `disable` for local private networks |
| `VILLAGE_DB_PATH` | `/data/village-pgdata` | Disk path for embedded PGlite when `DATABASE_URL` is unset |
| `VILLAGE_REGION` | `ca-central-1` | Region tag reported in `/healthz` telemetry |
| `ENABLE_AUTOMATION_WORKER` | `true` | Runs background scheduled Village automations |
| `RATE_LIMIT_MAX` | `240` | Max API requests per minute per client IP |

---

## Pre-Deploy & Post-Deploy Verification

Run the full production verification pipeline locally or in CI at any time:

```bash
npm run typecheck
npm run build
npm run test:dbt001
npm test
npm run verify:prod
```

For operational rollback procedures, see [`Rollback_runbook.md`](./Rollback_runbook.md).

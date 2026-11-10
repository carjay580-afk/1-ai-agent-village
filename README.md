# AI Agent Village 🍁

**All-in-One Canadian AI Commander & Specialist Multi-Agent Studio Platform**

> **PROPRIETARY NOTICE**
>
> Copyright (c) 2026. All rights reserved.
>
> The AI Agent Village software, source code, configuration, documentation, designs, workflows, schemas, prompts, and other materials contained in this repository are proprietary.
>
> No open-source licence is granted for this repository. See [`LICENSE`](./LICENSE) for the full proprietary notice and restrictions.

---

## Overview

**AI Agent Village** combines a warm, polymath **Canadian All-in-One Lead Agent (`Village Commander` / "Commander North")** with seven specialized guild agents backed by a canonical PostgreSQL 16 relational vault (`@electric-sql/pglite` + Docker PostgreSQL 16 compatibility) and deterministic **DBT-001 v1.1** lifecycle verification:

- **Talk & Omni-Knowledge Hub (`en-CA` / `fr-CA`)**: Natural text and live Web Speech voice dialogue, quantitative math/finance reasoning, and encyclopedic research.
- **Counseling & Wellness Sanctuary**: Compassionate active listening, CBT thought reframing, mood & energy check-ins, and an interactive Northern Aurora Box Breathing pacer with **Counselor Cedar**.
- **Builder Forge**: Prompt-to-App generator with live sandboxed HTML/CSS/JS execution and companion PostgreSQL schemas via **Builder MacKenzie**.
- **Creative Multimedia & Cinema Studio**:
  - **Photos & Fine Art** (*Artist Laurentian* — layered SVG & high-res PNG export)
  - **Audio & Music Lab** (*Maestro St. Lawrence* — real 16-bit PCM `.wav` multi-voice DSP synthesis)
  - **Motion Videos** (*Director Borealis* — 60fps canvas cinematography + `.webm` video export)
  - **4-Act Movies** (*Director Borealis* — full screenplay, cast voices, camera moves, subtitles & WAV score)
  - **3-Episode TV / Web Shows** (*Director Borealis* — multi-episode showrunner theater)
- **Tasks & Workflow Automation**: Scheduled & triggered pipelines executing all **7 canonical DBT-001 lifecycle stages** (`TASK_CREATED` -> `TASK_PLANNED` -> `AGENT_ASSIGNED` -> `TASK_EXECUTION_STARTED` -> `TASK_VERIFICATION_STARTED` -> `TASK_VERIFIED` -> `TASK_COMPLETED`), audited by **Sentinel Algonquin**.

---

## Repository Structure

```text
1-ai-agent-village/
├── config/
│   └── canonical_agent_configuration_v1.0.json
├── database/
│   ├── migrations/
│   │   ├── 0001_initial_village_schema.sql
│   │   └── 0002_village_studio_schema.sql
│   └── docs/
│       └── village_schema_v1.0.md
├── tests/
│   ├── DBT-001/
│   │   ├── 0001_initial_village_schema.sql
│   │   ├── DBT-001_fixture_v1.0.sql
│   │   ├── DBT-001_fixture_v1.1.sql
│   │   ├── DBT-001_assertions_v1.0.sql
│   │   ├── DBT-001_assertions_v1.1.sql
│   │   ├── DBT-001_transaction_rollback_v1.0.sql
│   │   ├── DBT-001_transaction_rollback_v1.1.sql
│   │   ├── DBT-001-v1.1-PATCH-NOTES.md
│   │   ├── compose.dbt001.yaml
│   │   ├── run_DBT-001.sh
│   │   ├── run_DBT-001-v1.1.sh
│   │   └── village-test.sh
│   └── village_api.test.ts
├── docs/
│   ├── architecture/village_architecture_v1.0.md
│   ├── decisions/ADR-001-canonical-lifecycle.md
│   └── testing/troubleshooting-dbt-001.md
├── server/          # Express 5 + PGlite PostgreSQL + Studio / Builder / Task Engines
├── client/          # React 19 + Tailwind CSS v4 + Screening Room Theater UI
├── shared/          # Strict shared TypeScript domain contracts
├── Rollback_runbook.md
└── LICENSE
```

---

## Quick Start

```bash
npm install
npm run dev
```

### Run Canonical DBT-001 v1.1 Database Integrity Suite

```bash
npm run test:dbt001
# or directly:
./tests/DBT-001/village-test.sh
```

### Typecheck, Build & Integration Tests

```bash
npm run typecheck
npm run build
npm run test:dbt001
npm test
npm run verify:prod
```

---

## Production Deployment

This repository is turnkey-deployable across Docker, Docker Compose, Fly.io (`yyz` Toronto), Render, Railway, Cloud Run / AWS, and bare-metal Node 20/22 servers — supporting both **Managed PostgreSQL (`DATABASE_URL`)** and **Zero-Config Persistent Volume (`/data`)** modes:

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Step-by-step deployment guide & environment variables
- [`Dockerfile`](./Dockerfile) & [`docker-compose.yml`](./docker-compose.yml) — Multi-stage non-root container & PostgreSQL 16 stack
- [`fly.toml`](./fly.toml) · [`render.yaml`](./render.yaml) · [`railway.json`](./railway.json) · [`Procfile`](./Procfile) — 1-click cloud platform manifests
- [`Rollback_runbook.md`](./Rollback_runbook.md) — Production rollback & DBT-001 recovery runbook

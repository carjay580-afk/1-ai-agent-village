# Troubleshooting DBT-001

If DBT-001 fails, identify the actual failing stage before changing the test.

## 1. Check Docker

```bash
docker version
docker compose version
docker info
```

All three should succeed when running in Docker mode (note: `village-test.sh` also supports automatic PGlite PostgreSQL 16 execution in container environments without a Docker daemon).

---

## 2. Check the test package

From:

```bash
cd tests/DBT-001
ls -la
```

Expected files:

```text
0001_initial_village_schema.sql
DBT-001_fixture_v1.0.sql
DBT-001_fixture_v1.1.sql
DBT-001_assertions_v1.0.sql
DBT-001_assertions_v1.1.sql
DBT-001_transaction_rollback_v1.0.sql
DBT-001_transaction_rollback_v1.1.sql
DBT-001-v1.1-PATCH-NOTES.md
compose.dbt001.yaml
run_DBT-001.sh
run_DBT-001-v1.1.sh
village-test.sh
```

If necessary:

```bash
chmod +x village-test.sh run_DBT-001.sh run_DBT-001-v1.1.sh
```

---

## 3. Validate Docker Compose

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  config --quiet
```

---

## 4. Inspect & Reset DBT-001

Clean only the disposable Village test environment:

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  down -v --remove-orphans --timeout 5
```

Then rerun:

```bash
./village-test.sh
```

---

## 5. Failure Classification

Classify failures as one of:

- `DOCKER_FAILURE`
- `COMPOSE_FAILURE`
- `POSTGRES_STARTUP_FAILURE`
- `MIGRATION_FAILURE`
- `FIXTURE_FAILURE`
- `ASSERTION_FAILURE`
- `ROLLBACK_FAILURE`
- `CLEANUP_FAILURE`
- `UNKNOWN_FAILURE`

Do not weaken an assertion simply to obtain a passing result. Correct the underlying schema, fixture, lifecycle, verification, or rollback defect until a complete DBT-001 execution reaches:

```text
DBT-001 VERIFIED RUN: PASS
```

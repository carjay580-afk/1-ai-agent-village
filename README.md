# Troubleshooting DBT-001

If DBT-001 fails, identify the actual failing stage before changing the test.

## 1. Check Docker

```bash
docker version
docker compose version
docker info
```

All three should succeed.

If `docker info` fails, make sure Docker Desktop or the Docker Engine is running.

---

## 2. Check the test package

From:

```bash
cd tests/DBT-001
```

verify the required files:

```bash
ls -la
```

Expected:

```text
0001_initial_village_schema.sql
DBT-001_fixture_v1.0.sql
DBT-001_assertions_v1.0.sql
DBT-001_transaction_rollback_v1.0.sql
compose.dbt001.yaml
run_DBT-001.sh
village-test.sh
```

If necessary:

```bash
chmod +x village-test.sh run_DBT-001.sh
```

---

## 3. Validate Docker Compose

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  config --quiet
```

Fix any reported configuration error before continuing.

---

## 4. Inspect DBT-001

Check service state:

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  ps -a
```

View logs:

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  logs --tail 200 --timestamps
```

PostgreSQL only:

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  logs --tail 200 postgres
```

The canonical runner may also produce:

```text
DBT-001-last-run.log
```

Docker documents `docker compose logs` as the command for viewing service output and supports options including `--tail`, `--timestamps`, and `--follow`.

---

## 5. Reset DBT-001

DBT-001 uses a disposable database.

Clean only the Village test environment:

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

Avoid using:

```bash
docker system prune
```

as a routine fix. It can remove unused Docker resources outside DBT-001.

---

## 6. Common failures

**Docker command missing**

```bash
docker version
```

Install/start Docker before continuing.

**Docker Engine unavailable**

```bash
docker info
```

Start Docker Desktop or Docker Engine.

**Compose configuration error**

```bash
docker compose -f compose.dbt001.yaml config
```

Correct the reported configuration problem.

**PostgreSQL unhealthy**

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  logs postgres
```

Inspect the actual startup error before changing health-check settings.

**Fixture already exists**

Reset the disposable environment:

```bash
docker compose \
  -p ai-agent-village-dbt001-local \
  -f compose.dbt001.yaml \
  down -v --remove-orphans --timeout 5
```

Then rerun DBT-001.

**Assertion failure**

Record the exact failed assertion.

Do not weaken an assertion simply to obtain a passing result. Correct the underlying schema, fixture, lifecycle, verification, or rollback defect.

---

## 7. Report failures

Record:

```text
Operating system:
Docker version:
Docker Compose version:
Failing stage:
Failing command:
Exit code:
First relevant error:
Diagnostic log:
Cleanup status:
```

Classify the failure as:

```text
DOCKER_FAILURE
COMPOSE_FAILURE
POSTGRES_STARTUP_FAILURE
MIGRATION_FAILURE
FIXTURE_FAILURE
ASSERTION_FAILURE
ROLLBACK_FAILURE
CLEANUP_FAILURE
UNKNOWN_FAILURE
```

Then fix the underlying problem and rerun:

```bash
./village-test.sh
```

A failed run remains:

```text
UNVERIFIED / FAILED
```

until a subsequent complete DBT-001 execution reaches:

```text
DBT-001 VERIFIED RUN: PASS
```

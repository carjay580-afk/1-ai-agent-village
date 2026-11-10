#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${SCRIPT_DIR}/DBT-001-last-run.log"
PROJECT_NAME="ai-agent-village-dbt001-local"
COMPOSE_FILE="${SCRIPT_DIR}/compose.dbt001.yaml"

exec > >(tee "${LOG_FILE}") 2>&1

echo "=== AI Agent Village DBT-001 Authoritative Integrity Suite v1.1 ==="
echo "Started at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "[Engine] Docker PostgreSQL 16 disposable environment"
  cleanup() {
    docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" down -v --remove-orphans --timeout 5 >/dev/null 2>&1 || true
  }
  trap cleanup EXIT
  cleanup

  docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" config --quiet
  docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" up -d --wait

  for sql_file in \
    "${REPO_ROOT}/database/migrations/0001_initial_village_schema.sql" \
    "${SCRIPT_DIR}/DBT-001_fixture_v1.1.sql" \
    "${SCRIPT_DIR}/DBT-001_assertions_v1.1.sql" \
    "${SCRIPT_DIR}/DBT-001_transaction_rollback_v1.1.sql"; do
    echo "[DBT-001 v1.1] Executing $(basename "${sql_file}")"
    docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" exec -T postgres \
      psql -v ON_ERROR_STOP=1 -U village_test -d ai_agent_village_dbt001 < "${sql_file}"
  done

  echo "DBT-001 VERIFIED RUN: PASS"
else
  echo "[Engine] PGlite Ephemeral PostgreSQL 16 Engine (Docker daemon unavailable)"
  node "${SCRIPT_DIR}/pglite_dbt001_runner.mjs" 1.1
fi

# ADR-001: Canonical 7-Stage Task Lifecycle & Verification Gate

- **Status**: Accepted
- **Date**: 2026-11-10

## Context

Autonomous AI agents must never report unverified or partially persisted work as complete. All task executions across conversation, automation, building, counseling, and multimedia generation require deterministic state transitions and auditable verification.

## Decision

1. Separate `execution_status` (`CREATED`, `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED`) from `verification_status` (`UNVERIFIED`, `IN_REVIEW`, `VERIFIED`, `REJECTED`) on `tasks`.
2. Enforce `CHECK (execution_status <> 'COMPLETED' OR verification_status = 'VERIFIED')` directly in PostgreSQL (`0001_initial_village_schema.sql`).
3. Require all 7 canonical audit events (`TASK_CREATED`, `TASK_PLANNED`, `AGENT_ASSIGNED`, `TASK_EXECUTION_STARTED`, `TASK_VERIFICATION_STARTED`, `TASK_VERIFIED`, `TASK_COMPLETED`) and validate via `tests/DBT-001/DBT-001_assertions_v1.1.sql`.

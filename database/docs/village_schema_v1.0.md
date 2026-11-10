# AI Agent Village — Canonical Database Schema (v1.0)

## Overview

`database/migrations/0001_initial_village_schema.sql` establishes the authoritative relational state store for the **AI Agent Village** platform, designed for PostgreSQL 14+ and PGlite (PostgreSQL 16).

## Entity Hierarchy

```text
users (1) ──< workspaces (N) ──< projects (N) ──< tasks (N)
                                                    ├──< task_agent_assignments (N) >── agent_versions ──> agents
                                                    ├──< task_steps (N) ──< tool_executions (N)
                                                    └──< audit_events (entity_type='task')
```

## Core Invariants

1. **Ownership Chain**: Every `task` resolves deterministically through `projects.workspace_id -> workspaces.owner_user_id -> users.id`.
2. **Versioned Agent Binding**: `task_agent_assignments` uses a composite foreign key `(agent_version_id, agent_id) -> agent_versions(id, agent_id)` so a task cannot bind an agent version belonging to a different agent.
3. **Step-to-Task Tool Integrity**: `tool_executions` uses `(task_step_id, task_id) -> task_steps(id, task_id)` so tool executions cannot cross task boundaries.
4. **Verification Gate (`chk_tasks_completed_requires_verified`)**: No row in `tasks` may reach `execution_status = 'COMPLETED'` unless `verification_status = 'VERIFIED'`.
5. **7-Stage Canonical Audit Trail**: Every completed task records `TASK_CREATED`, `TASK_PLANNED`, `AGENT_ASSIGNED`, `TASK_EXECUTION_STARTED`, `TASK_VERIFICATION_STARTED`, `TASK_VERIFIED`, and `TASK_COMPLETED` in `audit_events`.

-- ============================================================================
-- AI Agent Village — Migration 0001: Initial Canonical Village Schema (v1.0)
-- Compatible with PostgreSQL 14+ and PGlite (PostgreSQL 16 WASM)
-- Uses core PostgreSQL gen_random_uuid() (native since PostgreSQL 13)
-- ============================================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  locale text NOT NULL DEFAULT 'en-CA',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL DEFAULT 'ca-central-1',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_user_id ON workspaces(owner_user_id);

-- 3. Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_projects_workspace_slug UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);

-- 4. Agents
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  callsign text NOT NULL DEFAULT '',
  guild text NOT NULL DEFAULT 'Command',
  origin_country text NOT NULL DEFAULT 'CA',
  persona_summary text NOT NULL DEFAULT '',
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Agent Versions (strictly bound to parent agent)
CREATE TABLE IF NOT EXISTS agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version text NOT NULL,
  system_prompt text NOT NULL,
  model_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  tool_allowlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_canonical boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_agent_versions_agent_version UNIQUE (agent_id, version),
  CONSTRAINT uq_agent_versions_id_agent UNIQUE (id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent_id ON agent_versions(agent_id);

-- 6. Tasks (authoritative execution + verification state machine)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  execution_status text NOT NULL DEFAULT 'CREATED' CHECK (
    execution_status IN ('CREATED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  verification_status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (
    verification_status IN ('UNVERIFIED', 'IN_REVIEW', 'VERIFIED', 'REJECTED')
  ),
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  verified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_tasks_completed_requires_verified CHECK (
    execution_status <> 'COMPLETED' OR verification_status = 'VERIFIED'
  )
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_statuses ON tasks(execution_status, verification_status);

-- 7. Task Agent Assignments (enforces version belongs to assigned agent)
CREATE TABLE IF NOT EXISTS task_agent_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  agent_version_id uuid NOT NULL,
  role text NOT NULL CHECK (
    role IN ('commander', 'specialist', 'verifier', 'counselor', 'builder', 'producer')
  ),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_task_assignment_agent_version
    FOREIGN KEY (agent_version_id, agent_id)
    REFERENCES agent_versions(id, agent_id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_task_agent_role UNIQUE (task_id, agent_id, role)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_agent_assignments(task_id);

-- 8. Task Steps
CREATE TABLE IF NOT EXISTS task_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_order integer NOT NULL CHECK (step_order > 0),
  step_type text NOT NULL CHECK (step_type IN ('PLAN', 'EXECUTE', 'VERIFY', 'SYNTHESIZE')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED')
  ),
  assigned_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_task_steps_order UNIQUE (task_id, step_order),
  CONSTRAINT uq_task_steps_id_task UNIQUE (id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);

-- 9. Tool Executions (enforces step belongs to same task)
CREATE TABLE IF NOT EXISTS tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_step_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  tool_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  executed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_tool_executions_step_task
    FOREIGN KEY (task_step_id, task_id)
    REFERENCES task_steps(id, task_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tool_executions_task_id ON tool_executions(task_id);

-- 10. Audit Events (immutable lifecycle & operational audit trail)
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  event_type text NOT NULL,
  actor_type text NOT NULL DEFAULT 'agent' CHECK (actor_type IN ('user', 'agent', 'system')),
  actor_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);

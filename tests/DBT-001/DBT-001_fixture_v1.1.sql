-- AI Agent Village DBT-001 seed & lifecycle fixture v1.1
-- Authoritative persisted-state fixture with explicit versioned Commander & Verifier bindings.

BEGIN;

DO $$
DECLARE
  v_user_id uuid := '11111111-1111-4111-8111-111111111101';
  v_workspace_id uuid := '22222222-2222-4222-8222-222222222201';
  v_project_id uuid := '33333333-3333-4333-8333-333333333301';
  v_commander_id uuid := '44444444-4444-4444-8444-444444444401';
  v_commander_ver_id uuid := '55555555-5555-4555-8555-555555555501';
  v_verifier_id uuid := '44444444-4444-4444-8444-444444444402';
  v_verifier_ver_id uuid := '55555555-5555-4555-8555-555555555502';
  v_task_id uuid := '66666666-6666-4666-8666-666666666601';
  v_step_plan uuid := '77777777-7777-4777-8777-777777777701';
  v_step_exec uuid := '77777777-7777-4777-8777-777777777702';
  v_step_verify uuid := '77777777-7777-4777-8777-777777777703';
BEGIN
  INSERT INTO users (id, email, display_name, locale, status)
  VALUES (v_user_id, 'founder@aiagentvillage.ca', 'Village Founder', 'en-CA', 'ACTIVE');

  INSERT INTO workspaces (id, owner_user_id, slug, name, region)
  VALUES (v_workspace_id, v_user_id, 'northern-observatory', 'Northern Observatory Workspace', 'ca-central-1');

  INSERT INTO projects (id, workspace_id, slug, name, description)
  VALUES (v_project_id, v_workspace_id, 'dbt-001-suite', 'DBT-001 Canonical Verification', 'Lifecycle integrity harness v1.1');

  INSERT INTO agents (id, slug, name, callsign, guild, origin_country, persona_summary)
  VALUES
    (v_commander_id, 'village-commander', 'Village Commander', 'Commander North', 'Command & Omni-Intelligence', 'CA', 'Canadian All-in-One Lead Agent'),
    (v_verifier_id, 'sentinel-algonquin', 'Sentinel Algonquin', 'TrueNorth QA', 'Independent Verification & Audit', 'CA', 'Canonical QA Verifier');

  INSERT INTO agent_versions (id, agent_id, version, system_prompt, model_profile, tool_allowlist, is_canonical)
  VALUES
    (
      v_commander_ver_id,
      v_commander_id,
      '1.0.0-dbt001',
      'You are Commander North (Village Commander v1.0.0-dbt001), Canadian All-in-One Lead Agent.',
      '{"tier":"commander","locale":"en-CA"}'::jsonb,
      '["knowledge.query","task.plan","verifier.audit_deliverable"]'::jsonb,
      true
    ),
    (
      v_verifier_ver_id,
      v_verifier_id,
      '1.0.0-dbt001',
      'You are Sentinel Algonquin (Verifier v1.0.0-dbt001), independent audit verifier.',
      '{"tier":"verifier","locale":"en-CA"}'::jsonb,
      '["verifier.audit_deliverable"]'::jsonb,
      true
    );

  -- 1. TASK_CREATED
  INSERT INTO tasks (
    id, project_id, created_by_user_id, title, description, category, priority,
    execution_status, verification_status, input_payload
  ) VALUES (
    v_task_id, v_project_id, v_user_id,
    'DBT-001 Commander lifecycle test',
    'Authoritative v1.1 persisted-state test across creation, planning, assignment, execution, verification, and completion.',
    'verification', 'HIGH',
    'CREATED', 'UNVERIFIED',
    '{"suite":"DBT-001","version":"1.1"}'::jsonb
  );

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'TASK_CREATED', 'user', v_user_id::text, '{"stage":1}'::jsonb);

  -- 2. TASK_PLANNED
  INSERT INTO task_steps (id, task_id, step_order, step_type, title, status, assigned_agent_id, started_at, completed_at)
  VALUES
    (v_step_plan, v_task_id, 1, 'PLAN', 'Decompose objective into deterministic execution & verification plan', 'SUCCEEDED', v_commander_id, now(), now()),
    (v_step_exec, v_task_id, 2, 'EXECUTE', 'Execute Commander tool invocation and synthesize output', 'PENDING', v_commander_id, NULL, NULL),
    (v_step_verify, v_task_id, 3, 'VERIFY', 'Run independent Sentinel verification gate', 'PENDING', v_verifier_id, NULL, NULL);

  UPDATE tasks SET execution_status = 'PLANNED', updated_at = now() WHERE id = v_task_id;

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'TASK_PLANNED', 'agent', v_commander_id::text, '{"stage":2,"steps":3}'::jsonb);

  -- 3. AGENT_ASSIGNED
  INSERT INTO task_agent_assignments (task_id, agent_id, agent_version_id, role)
  VALUES
    (v_task_id, v_commander_id, v_commander_ver_id, 'commander'),
    (v_task_id, v_verifier_id, v_verifier_ver_id, 'verifier');

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'AGENT_ASSIGNED', 'system', 'orchestrator', '{"stage":3,"version":"1.0.0-dbt001"}'::jsonb);

  -- 4. TASK_EXECUTION_STARTED
  UPDATE tasks
  SET execution_status = 'IN_PROGRESS', started_at = now(), updated_at = now()
  WHERE id = v_task_id;

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'TASK_EXECUTION_STARTED', 'agent', v_commander_id::text, '{"stage":4}'::jsonb);

  INSERT INTO tool_executions (task_id, task_step_id, agent_id, tool_name, status, duration_ms, input_payload, output_payload)
  VALUES (
    v_task_id, v_step_exec, v_commander_id, 'knowledge.query', 'SUCCEEDED', 38,
    '{"query":"DBT-001 lifecycle validation"}'::jsonb,
    '{"summary":"Canonical synthesis produced"}'::jsonb
  );

  UPDATE task_steps
  SET status = 'SUCCEEDED', started_at = now(), completed_at = now(),
      output_payload = '{"tool":"knowledge.query","ok":true}'::jsonb
  WHERE id = v_step_exec;

  -- 5. TASK_VERIFICATION_STARTED
  UPDATE tasks
  SET verification_status = 'IN_REVIEW', updated_at = now()
  WHERE id = v_task_id;

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'TASK_VERIFICATION_STARTED', 'agent', v_verifier_id::text, '{"stage":5}'::jsonb);

  INSERT INTO tool_executions (task_id, task_step_id, agent_id, tool_name, status, duration_ms, input_payload, output_payload)
  VALUES (
    v_task_id, v_step_verify, v_verifier_id, 'verifier.audit_deliverable', 'SUCCEEDED', 17,
    '{"check":"invariants"}'::jsonb,
    '{"verified":true,"checks_passed":7}'::jsonb
  );

  UPDATE task_steps
  SET status = 'SUCCEEDED', started_at = now(), completed_at = now(),
      output_payload = '{"verified":true}'::jsonb
  WHERE id = v_step_verify;

  -- 6. TASK_VERIFIED
  UPDATE tasks
  SET verification_status = 'VERIFIED', verified_at = now(), updated_at = now()
  WHERE id = v_task_id;

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'TASK_VERIFIED', 'agent', v_verifier_id::text, '{"stage":6}'::jsonb);

  -- 7. TASK_COMPLETED
  UPDATE tasks
  SET execution_status = 'COMPLETED',
      completed_at = now(),
      output_payload = '{"dbt001":"v1.1-pass","verified":true}'::jsonb,
      updated_at = now()
  WHERE id = v_task_id;

  INSERT INTO audit_events (workspace_id, entity_type, entity_id, event_type, actor_type, actor_id, payload)
  VALUES (v_workspace_id, 'task', v_task_id::text, 'TASK_COMPLETED', 'agent', v_commander_id::text, '{"stage":7}'::jsonb);

  RAISE NOTICE 'DBT-001 fixture v1.1: SEEDED';
END
$$ LANGUAGE plpgsql;

COMMIT;

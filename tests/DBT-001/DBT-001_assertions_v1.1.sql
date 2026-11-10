-- AI Agent Village DBT-001 assertion suite v1.1
-- Run AFTER 0001_initial_village_schema.sql and DBT-001 seed/lifecycle fixture.
-- Uses explicit RAISE EXCEPTION rather than ASSERT so checks cannot be disabled.

DO $$
DECLARE
  v_task uuid;
  v_project uuid;
  v_commander uuid;
  v_commander_version uuid;
  v_count bigint;
  v_exec text;
  v_verify text;
BEGIN
  SELECT count(*) INTO v_count FROM users;
  IF v_count < 1 THEN
    RAISE EXCEPTION 'DBT-001: users table empty';
  END IF;

  SELECT count(*) INTO v_count FROM workspaces;
  IF v_count < 1 THEN
    RAISE EXCEPTION 'DBT-001: workspaces table empty';
  END IF;

  SELECT id INTO v_commander FROM agents WHERE name = 'Village Commander';
  IF v_commander IS NULL THEN
    RAISE EXCEPTION 'DBT-001: Village Commander missing';
  END IF;

  SELECT id INTO v_commander_version
  FROM agent_versions
  WHERE agent_id = v_commander AND version = '1.0.0-dbt001';
  IF v_commander_version IS NULL THEN
    RAISE EXCEPTION 'DBT-001: expected Commander test version missing';
  END IF;

  SELECT count(*) INTO v_count FROM tasks WHERE title = 'DBT-001 Commander lifecycle test';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'DBT-001: expected exactly 1 task, found %', v_count;
  END IF;

  SELECT id, project_id, execution_status, verification_status
    INTO v_task, v_project, v_exec, v_verify
    FROM tasks
   WHERE title = 'DBT-001 Commander lifecycle test';

  SELECT count(*) INTO v_count FROM task_agent_assignments
   WHERE task_id = v_task
     AND agent_id = v_commander
     AND agent_version_id = v_commander_version
     AND role = 'commander';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'DBT-001: expected exactly 1 versioned Commander assignment, found %', v_count;
  END IF;

  SELECT count(*) INTO v_count FROM task_steps WHERE task_id = v_task;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'DBT-001: expected 3 task steps, found %', v_count;
  END IF;

  SELECT count(*) INTO v_count FROM task_steps
   WHERE task_id = v_task AND status <> 'SUCCEEDED';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'DBT-001: found % incomplete task steps', v_count;
  END IF;

  IF v_exec <> 'COMPLETED' THEN
    RAISE EXCEPTION 'DBT-001: expected execution_status COMPLETED, got %', v_exec;
  END IF;

  IF v_verify <> 'VERIFIED' THEN
    RAISE EXCEPTION 'DBT-001: expected verification_status VERIFIED, got %', v_verify;
  END IF;

  SELECT count(*) INTO v_count FROM tool_executions
   WHERE task_id = v_task AND status = 'SUCCEEDED';
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'DBT-001: expected 2 succeeded tool executions, found %', v_count;
  END IF;

  SELECT count(*) INTO v_count FROM tool_executions
   WHERE task_id = v_task AND status <> 'SUCCEEDED';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'DBT-001: unexpected tool executions: %', v_count;
  END IF;

  SELECT count(DISTINCT event_type) INTO v_count
  FROM audit_events
  WHERE entity_type = 'task'
    AND entity_id = v_task::text
    AND event_type IN (
      'TASK_CREATED',
      'TASK_PLANNED',
      'AGENT_ASSIGNED',
      'TASK_EXECUTION_STARTED',
      'TASK_VERIFICATION_STARTED',
      'TASK_VERIFIED',
      'TASK_COMPLETED'
    );
  IF v_count <> 7 THEN
    RAISE EXCEPTION 'DBT-001: expected all 7 lifecycle audit event types, found %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM tasks t
  JOIN projects p ON p.id = t.project_id
  JOIN workspaces w ON w.id = p.workspace_id
  JOIN users u ON u.id = w.owner_user_id
  WHERE t.id = v_task;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'DBT-001: task/project/workspace/user relationship invalid';
  END IF;

  RAISE NOTICE 'DBT-001 positive assertions: PASS (authoritative persisted-state assertions)';
END
$$ LANGUAGE plpgsql;

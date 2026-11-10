-- AI Agent Village DBT-001 assertion suite v1.0
-- Run AFTER 0001_initial_village_schema.sql and DBT-001 seed/lifecycle fixture.
-- Uses explicit RAISE EXCEPTION rather than ASSERT so checks cannot be disabled.

DO $$
DECLARE
  v_task uuid;
  v_project uuid;
  v_commander uuid;
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

  SELECT count(*) INTO v_count FROM tasks WHERE title = 'DBT-001 Commander lifecycle test';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'DBT-001: expected exactly 1 task, found %', v_count;
  END IF;

  SELECT id, project_id, execution_status, verification_status
    INTO v_task, v_project, v_exec, v_verify
    FROM tasks
   WHERE title = 'DBT-001 Commander lifecycle test';

  SELECT count(*) INTO v_count FROM task_agent_assignments
   WHERE task_id = v_task AND agent_id = v_commander;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'DBT-001: expected exactly 1 Commander assignment, found %', v_count;
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

  SELECT count(*) INTO v_count FROM audit_events
   WHERE entity_type = 'task' AND entity_id = v_task::text;
  IF v_count < 1 THEN
    RAISE EXCEPTION 'DBT-001: audit history missing';
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

  RAISE NOTICE 'DBT-001 positive assertions: PASS';
END
$$ LANGUAGE plpgsql;

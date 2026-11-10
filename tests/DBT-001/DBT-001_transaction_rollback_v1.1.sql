-- AI Agent Village DBT-001 transaction rollback & invariant suite v1.1
-- 1. Verifies unverified completion attempt is rejected by PostgreSQL CHECK constraint.
-- 2. Verifies full multi-table transaction ROLLBACK leaves zero orphaned rows across all tables.

-- Check 1: Unverified COMPLETED transition MUST be blocked by chk_tasks_completed_requires_verified
DO $$
DECLARE
  v_caught boolean := false;
BEGIN
  BEGIN
    INSERT INTO tasks (
      id, project_id, title, execution_status, verification_status
    ) VALUES (
      '99999999-9999-4999-8999-999999999900',
      '33333333-3333-4333-8333-333333333301',
      'DBT-001 Illegal unverified completion attempt',
      'COMPLETED',
      'UNVERIFIED'
    );
  EXCEPTION
    WHEN check_violation THEN
      v_caught := true;
  END;

  IF NOT v_caught THEN
    RAISE EXCEPTION 'DBT-001 v1.1 invariant failure: unverified COMPLETED task was allowed';
  END IF;
END
$$ LANGUAGE plpgsql;

-- Check 2: Explicit multi-table transaction rollback atomicity
BEGIN;

INSERT INTO tasks (
  id, project_id, title, description, execution_status, verification_status
) VALUES (
  '99999999-9999-4999-8999-999999999901',
  '33333333-3333-4333-8333-333333333301',
  'DBT-001 Rollback transient task v1.1',
  'Must never persist after ROLLBACK',
  'IN_PROGRESS',
  'UNVERIFIED'
);

INSERT INTO task_agent_assignments (
  task_id, agent_id, agent_version_id, role
) VALUES (
  '99999999-9999-4999-8999-999999999901',
  '44444444-4444-4444-8444-444444444401',
  '55555555-5555-4555-8555-555555555501',
  'commander'
);

INSERT INTO task_steps (
  id, task_id, step_order, step_type, title, status
) VALUES (
  '99999999-9999-4999-8999-999999999902',
  '99999999-9999-4999-8999-999999999901',
  1, 'EXECUTE', 'Transient rollback step v1.1', 'RUNNING'
);

INSERT INTO tool_executions (
  task_id, task_step_id, agent_id, tool_name, status, duration_ms
) VALUES (
  '99999999-9999-4999-8999-999999999901',
  '99999999-9999-4999-8999-999999999902',
  '44444444-4444-4444-8444-444444444401',
  'knowledge.query', 'RUNNING', 5
);

INSERT INTO audit_events (
  entity_type, entity_id, event_type, actor_type
) VALUES (
  'task', '99999999-9999-4999-8999-999999999901', 'TASK_CREATED', 'system'
);

ROLLBACK;

DO $$
DECLARE
  v_leaked bigint;
  v_valid_tasks bigint;
BEGIN
  SELECT count(*) INTO v_leaked
  FROM tasks
  WHERE id = '99999999-9999-4999-8999-999999999901';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 v1.1 rollback failure: leaked % task rows', v_leaked;
  END IF;

  SELECT count(*) INTO v_leaked
  FROM task_steps
  WHERE task_id = '99999999-9999-4999-8999-999999999901';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 v1.1 rollback failure: leaked % task_steps rows', v_leaked;
  END IF;

  SELECT count(*) INTO v_leaked
  FROM task_agent_assignments
  WHERE task_id = '99999999-9999-4999-8999-999999999901';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 v1.1 rollback failure: leaked % task_agent_assignments rows', v_leaked;
  END IF;

  SELECT count(*) INTO v_leaked
  FROM tool_executions
  WHERE task_id = '99999999-9999-4999-8999-999999999901';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 v1.1 rollback failure: leaked % tool_executions rows', v_leaked;
  END IF;

  SELECT count(*) INTO v_leaked
  FROM audit_events
  WHERE entity_id = '99999999-9999-4999-8999-999999999901';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 v1.1 rollback failure: leaked % audit_events rows', v_leaked;
  END IF;

  -- Confirm baseline verified fixture task remains completely intact
  SELECT count(*) INTO v_valid_tasks
  FROM tasks
  WHERE title = 'DBT-001 Commander lifecycle test'
    AND execution_status = 'COMPLETED'
    AND verification_status = 'VERIFIED';
  IF v_valid_tasks <> 1 THEN
    RAISE EXCEPTION 'DBT-001 v1.1 rollback failure: baseline fixture task corrupted';
  END IF;

  RAISE NOTICE 'DBT-001 rollback assertions: PASS (transactional atomicity & check constraints verified)';
END
$$ LANGUAGE plpgsql;

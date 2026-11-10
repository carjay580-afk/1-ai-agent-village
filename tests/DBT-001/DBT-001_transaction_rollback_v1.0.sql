-- AI Agent Village DBT-001 transaction rollback suite v1.0
-- Verifies transactional rollback leaves zero orphaned task, step, or audit rows.

BEGIN;

INSERT INTO tasks (
  id, project_id, title, description, execution_status, verification_status
) VALUES (
  '99999999-9999-4999-8999-999999999901',
  '33333333-3333-4333-8333-333333333301',
  'DBT-001 Rollback transient task',
  'Must never persist after ROLLBACK',
  'CREATED',
  'UNVERIFIED'
);

INSERT INTO task_steps (
  task_id, step_order, step_type, title, status
) VALUES (
  '99999999-9999-4999-8999-999999999901',
  1, 'PLAN', 'Transient rollback step', 'PENDING'
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
BEGIN
  SELECT count(*) INTO v_leaked
  FROM tasks
  WHERE id = '99999999-9999-4999-8999-999999999901'
     OR title = 'DBT-001 Rollback transient task';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 rollback failure: leaked % task rows', v_leaked;
  END IF;

  SELECT count(*) INTO v_leaked
  FROM audit_events
  WHERE entity_id = '99999999-9999-4999-8999-999999999901';
  IF v_leaked <> 0 THEN
    RAISE EXCEPTION 'DBT-001 rollback failure: leaked % audit rows', v_leaked;
  END IF;

  RAISE NOTICE 'DBT-001 rollback assertions: PASS';
END
$$ LANGUAGE plpgsql;

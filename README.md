PROPRIETARY NOTICE

Copyright (c) 2026. All rights reserved.

The AI Agent Village software, source code, configuration,
documentation, designs, workflows, schemas, prompts, and other
materials contained in this repository are proprietary.

No licence is granted to copy, reproduce, modify, adapt, translate,
distribute, publish, sublicense, sell, publicly display, publicly
perform, create derivative works from, or otherwise use the Software
except with prior written permission from the applicable copyright
holder, or as otherwise permitted by applicable law or the terms of
the service through which the Software is made available.
## Licence

**Proprietary. All rights reserved.**

No open-source licence is granted for this repository.
See LICENSE for the proprietary notice and restrictions.
## Licence

**Proprietary. All rights reserved.**

No open-source licence is granted for this repository.
See LICENSE for the proprietary notice and restrictions.
## Licence

**Proprietary. All rights reserved.**

No open-source licence is granted for this repository.
See LICENSE for the proprietary notice and restrictions.
test(db): harden DBT-001 integrity checks to v1.1
git status
git diff --cached
git commit -m "test(db): harden DBT-001 integrity checks to v1.1"
git statusgit status --short
git diff --cached --name-status

tests/DBT-001/DBT-001_fixture_v1.1.sql
tests/DBT-001/DBT-001_assertions_v1.1.sql
tests/DBT-001/DBT-001_transaction_rollback_v1.1.sql
tests/DBT-001/compose.dbt001.yaml
tests/DBT-001/run_DBT-001-v1.1.sh
tests/DBT-001/DBT-001-v1.1-PATCH-NOTES.md
--- /mnt/data/DBT-001_assertions_v1.0.sql	2026-11-10 07:03:03.195584872 +0000
+++ /mnt/data/dbt001-v1.1-patch/DBT-001_assertions_v1.1.sql	2026-11-10 07:08:48.796799219 +0000
@@ -1,4 +1,4 @@
--- AI Agent Village DBT-001 assertion suite v1.0
+-- AI Agent Village DBT-001 assertion suite v1.1
 -- Run AFTER 0001_initial_village_schema.sql and DBT-001 seed/lifecycle fixture.
 -- Uses explicit RAISE EXCEPTION rather than ASSERT so checks cannot be disabled.
 
@@ -9,6 +9,7 @@
   v_task uuid;
   v_project uuid;
   v_commander uuid;
+  v_commander_version uuid;
   v_count bigint;
   v_exec text;
   v_verify text;
@@ -27,6 +28,13 @@
     RAISE EXCEPTION 'DBT-001: Village Commander missing';
   END IF;
 
+  SELECT id INTO v_commander_version
+  FROM agent_versions
+  WHERE agent_id = v_commander AND version = '1.0.0-dbt001';
+  IF v_commander_version IS NULL THEN
+    RAISE EXCEPTION 'DBT-001: expected Commander test version missing';
+  END IF;
+
   SELECT count(*) INTO v_count FROM tasks WHERE title = 'DBT-001 Commander lifecycle test';
   IF v_count <> 1 THEN
     RAISE EXCEPTION 'DBT-001: expected exactly 1 task, found %', v_count;
@@ -38,9 +46,12 @@
   END IF;
 
   SELECT count(*) INTO v_count FROM task_agent_assignments
-   WHERE task_id = v_task AND agent_id = v_commander;
+   WHERE task_id = v_task
+     AND agent_id = v_commander
+     AND agent_version_id = v_commander_version
+     AND role = 'commander';
   IF v_count <> 1 THEN
-    RAISE EXCEPTION 'DBT-001: expected exactly 1 Commander assignment, found %', v_count;
+    RAISE EXCEPTION 'DBT-001: expected exactly 1 versioned Commander assignment, found %', v_count;
   END IF;
 
   SELECT count(*) INTO v_count FROM task_steps WHERE task_id = v_task;
@@ -80,10 +91,21 @@
     RAISE EXCEPTION 'DBT-001: unexpected tool executions: %', v_count;
   END IF;
 
-  SELECT count(*) INTO v_count FROM audit_events
-   WHERE entity_type = 'task' AND entity_id = v_task::text;
-  IF v_count < 1 THEN
-    RAISE EXCEPTION 'DBT-001: audit history missing';
+  SELECT count(DISTINCT event_type) INTO v_count
+  FROM audit_events
+  WHERE entity_type = 'task'
+    AND entity_id = v_task::text
+    AND event_type IN (
+      'TASK_CREATED',
+      'TASK_PLANNED',
+      'AGENT_ASSIGNED',
+      'TASK_EXECUTION_STARTED',
+      'TASK_VERIFICATION_STARTED',
+      'TASK_VERIFIED',
+      'TASK_COMPLETED'
+    );
+  IF v_count <> 7 THEN
+    RAISE EXCEPTION 'DBT-001: expected all 7 lifecycle audit event types, found %', v_count;
   END IF;
 
   SELECT count(*) INTO v_count
@@ -96,7 +118,7 @@
     RAISE EXCEPTION 'DBT-001: task/project/workspace/user relationship invalid';
   END IF;
 
-  RAISE NOTICE 'DBT-001 positive assertions: PASS';
+  RAISE NOTICE 'DBT-001 positive assertions: PASS (authoritative persisted-state assertions)';
 END
 $$ LANGUAGE plpgsql;
 git diff --cached

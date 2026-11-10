import type { AutomationRecord } from '../../shared/types.js';
import type { VillageDb } from '../db.js';
import { synthesizePolymathAnswer } from './polymathKnowledge.js';
import { executeCanonicalVillageTask } from './taskLifecycleRunner.js';

let timerHandle: NodeJS.Timeout | null = null;
let runningCycle = false;

export function startAutomationWorker(db: VillageDb, pollMs = 30_000): void {
  if (timerHandle || process.env.ENABLE_AUTOMATION_WORKER === 'false' || process.env.VITEST === 'true') {
    return;
  }

  timerHandle = setInterval(async () => {
    if (runningCycle) return;
    runningCycle = true;
    try {
      const dueRes = await db.query<AutomationRecord>(
        `SELECT *
         FROM automations
         WHERE enabled = true
           AND (
             last_run_at IS NULL
             OR last_run_at + (interval_seconds * interval '1 second') <= now()
           )
         ORDER BY last_run_at ASC NULLS FIRST
         LIMIT 3`
      );

      for (const auto of dueRes.rows) {
        const task = await executeCanonicalVillageTask(db, {
          title: `[Scheduled] ${auto.name}`,
          description: auto.prompt_template,
          category: `automation:${auto.category}`,
          priority: 'NORMAL',
          specialistSlug: 'scholar-champlain',
          specialistRole: 'specialist',
          toolName: 'automation.schedule',
          inputPayload: { automationId: auto.id, scheduled: true },
          executeWork: async () => ({
            summary: synthesizePolymathAnswer(auto.prompt_template),
            automationName: auto.name,
          }),
        });

        await db.query(
          `UPDATE automations
           SET run_count = run_count + 1,
               last_run_at = now(),
               last_task_id = $2,
               updated_at = now()
           WHERE id = $1`,
          [auto.id, task.id]
        );
      }
    } catch (err) {
      console.error('[AutomationWorker] Cycle error:', err);
    } finally {
      runningCycle = false;
    }
  }, pollMs);

  // Allow Node process to exit cleanly if nothing else is active
  timerHandle.unref?.();
}

export function stopAutomationWorker(): void {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

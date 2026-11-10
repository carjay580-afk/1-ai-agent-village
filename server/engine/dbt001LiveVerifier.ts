import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { Dbt001RunReport } from '../../shared/types.js';
import { REPO_ROOT } from '../repoRoot.js';

export async function runLiveDbt001Suite(version: '1.0' | '1.1' = '1.1'): Promise<Dbt001RunReport> {
  const started = Date.now();
  const notices: string[] = [];
  const stages: Dbt001RunReport['stages'] = [];

  const db = new PGlite('memory://');
  await db.waitReady;

  const steps = [
    {
      name: 'MIGRATION (0001_initial_village_schema.sql)',
      file: path.join(REPO_ROOT, 'database', 'migrations', '0001_initial_village_schema.sql'),
    },
    {
      name: `FIXTURE (DBT-001_fixture_v${version}.sql)`,
      file: path.join(REPO_ROOT, 'tests', 'DBT-001', `DBT-001_fixture_v${version}.sql`),
    },
    {
      name: `ASSERTION (DBT-001_assertions_v${version}.sql)`,
      file: path.join(REPO_ROOT, 'tests', 'DBT-001', `DBT-001_assertions_v${version}.sql`),
    },
    {
      name: `ROLLBACK (DBT-001_transaction_rollback_v${version}.sql)`,
      file: path.join(REPO_ROOT, 'tests', 'DBT-001', `DBT-001_transaction_rollback_v${version}.sql`),
    },
  ];

  let passed = true;

  try {
    for (const st of steps) {
      try {
        const sql = fs.readFileSync(st.file, 'utf8');
        await db.exec(sql, {
          onNotice: (notice) => {
            if (notice?.message) notices.push(notice.message);
          },
        });
        stages.push({ name: st.name, status: 'PASS', detail: 'Executed cleanly against ephemeral PostgreSQL 16' });
      } catch (err) {
        passed = false;
        stages.push({
          name: st.name,
          status: 'FAIL',
          detail: err instanceof Error ? err.message : String(err),
        });
        break;
      }
    }
  } finally {
    await db.close().catch(() => {});
  }

  return {
    passed,
    suiteVersion: version,
    durationMs: Date.now() - started,
    stages,
    notices,
    banner: passed ? 'DBT-001 VERIFIED RUN: PASS' : 'UNVERIFIED / FAILED',
    executedAt: new Date().toISOString(),
  };
}

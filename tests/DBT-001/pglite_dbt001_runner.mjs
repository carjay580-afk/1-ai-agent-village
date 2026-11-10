import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const suiteVersion = process.argv[2] === '1.0' ? '1.0' : '1.1';

const files = [
  { stage: 'MIGRATION', file: path.join(__dirname, '..', '..', 'database', 'migrations', '0001_initial_village_schema.sql') },
  { stage: 'FIXTURE', file: path.join(__dirname, `DBT-001_fixture_v${suiteVersion}.sql`) },
  { stage: 'ASSERTION', file: path.join(__dirname, `DBT-001_assertions_v${suiteVersion}.sql`) },
  { stage: 'ROLLBACK', file: path.join(__dirname, `DBT-001_transaction_rollback_v${suiteVersion}.sql`) },
];

async function main() {
  const db = new PGlite('memory://');
  await db.waitReady;

  let currentStage = 'POSTGRES_STARTUP';
  try {
    for (const step of files) {
      currentStage = step.stage;
      console.log(`[DBT-001 v${suiteVersion}] Running ${step.stage}: ${path.basename(step.file)}`);
      const sql = fs.readFileSync(step.file, 'utf8');
      await db.exec(sql, {
        onNotice: (msg) => {
          if (msg?.message) {
            console.log(`NOTICE:  ${msg.message}`);
          }
        },
      });
    }
    await db.close();
    console.log(`DBT-001 VERIFIED RUN: PASS`);
  } catch (err) {
    console.error(`Failing stage: ${currentStage}_FAILURE`);
    console.error(`First relevant error: ${err instanceof Error ? err.message : String(err)}`);
    console.error('UNVERIFIED / FAILED');
    await db.close().catch(() => {});
    process.exit(1);
  }
}

main();

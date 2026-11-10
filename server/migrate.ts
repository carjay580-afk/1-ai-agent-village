import { closeDb, getDb } from './db.js';

async function runMigrations() {
  console.log('[db:migrate] Initializing database migrations and canonical Village seed...');
  const db = await getDb();
  await db.ping();
  console.log(`[db:migrate] Migration & seed complete on engine=${db.engine}`);
  await closeDb();
}

runMigrations().catch((err) => {
  console.error('[db:migrate] Migration failed:', err);
  process.exit(1);
});

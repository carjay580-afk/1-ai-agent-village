import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveRepoRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
  ];

  for (const dir of candidates) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) &&
      fs.existsSync(path.join(dir, 'database', 'migrations', '0001_initial_village_schema.sql'))
    ) {
      return dir;
    }
  }
  return process.cwd();
}

export const REPO_ROOT = resolveRepoRoot();

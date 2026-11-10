import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('dist/server');
fs.mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: ['server/index.ts', 'server/migrate.ts'],
  outdir: outDir,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});

import { spawn } from 'node:child_process';
import net from 'node:net';

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4099;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitForReady(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const port = await getFreePort();
  console.log(`[smoke-check] Booting compiled production bundle on port ${port}...`);

  const child = spawn(process.execPath, ['dist/server/index.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      VILLAGE_DB_PATH: 'memory://',
      ENABLE_AUTOMATION_WORKER: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (d) => process.stdout.write(`[prod] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[prod:err] ${d}`));

  const base = `http://127.0.0.1:${port}`;

  try {
    await waitForReady(`${base}/readyz`);

    const healthRes = await fetch(`${base}/healthz`);
    const health = await healthRes.json();
    if (!health.ok || health.status !== 'healthy') {
      throw new Error(`Unexpected /healthz payload: ${JSON.stringify(health)}`);
    }

    const readyRes = await fetch(`${base}/readyz`);
    const ready = await readyRes.json();
    if (!ready.ok || ready.status !== 'ready') {
      throw new Error(`Unexpected /readyz payload: ${JSON.stringify(ready)}`);
    }

    const rootRes = await fetch(`${base}/`);
    const rootHtml = await rootRes.text();
    if (rootRes.status !== 200 || !rootHtml.includes('<div id="root"></div>')) {
      throw new Error('Root SPA HTML failed verification');
    }

    const deepLinkRes = await fetch(`${base}/studio/cinema`);
    const deepHtml = await deepLinkRes.text();
    if (deepLinkRes.status !== 200 || !deepHtml.includes('<div id="root"></div>')) {
      throw new Error('SPA fallback deep-link failed verification');
    }

    const assetRes = await fetch(`${base}/assets/commander-north.png`);
    if (assetRes.status !== 200 || !(assetRes.headers.get('content-type') || '').includes('image/png')) {
      throw new Error('Static image asset verification failed');
    }

    const bootRes = await fetch(`${base}/api/bootstrap`);
    const boot = await bootRes.json();
    if (!Array.isArray(boot.agents) || boot.agents.length !== 8) {
      throw new Error(`Expected 8 canonical agents in production bootstrap, got ${boot.agents?.length}`);
    }

    console.log('[smoke-check] Sending SIGTERM to verify graceful shutdown...');
    const exitCode = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Graceful SIGTERM shutdown timed out')), 10_000);
      child.once('exit', (code) => {
        clearTimeout(t);
        resolve(code);
      });
      child.kill('SIGTERM');
    });

    if (exitCode !== 0) {
      throw new Error(`Expected exit code 0 on SIGTERM, got ${exitCode}`);
    }

    console.log('PRODUCTION SMOKE VERIFICATION: PASS');
  } finally {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }
}

main().catch((err) => {
  console.error('[smoke-check] FAILED:', err);
  process.exit(1);
});

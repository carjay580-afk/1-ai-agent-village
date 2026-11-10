import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { closeDb } from '../server/db.js';
import { createVillageApp } from '../server/index.js';

describe('AI Agent Village — Full-Stack API & Canonical Lifecycle Suite', () => {
  let server: Server;
  let baseUrl = '';

  beforeAll(async () => {
    process.env.VILLAGE_DB_PATH = 'memory://';
    const app = await createVillageApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  it('exposes production liveness (/healthz) and database readiness (/readyz) probes', async () => {
    const hRes = await fetch(`${baseUrl}/healthz`);
    expect(hRes.status).toBe(200);
    const health = await hRes.json();
    expect(health.ok).toBe(true);
    expect(health.status).toBe('healthy');

    const rRes = await fetch(`${baseUrl}/readyz`);
    expect(rRes.status).toBe(200);
    const ready = await rRes.json();
    expect(ready.ok).toBe(true);
    expect(ready.status).toBe('ready');
  });

  it('bootstraps all 8 canonical Canadian Village agents and starter studio artifacts', async () => {
    const res = await fetch(`${baseUrl}/api/bootstrap`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.agents.length).toBe(8);
    expect(data.agents[0].name).toBe('Village Commander');
    expect(data.agents[0].origin_country).toBe('CA');
    expect(data.mediaArtifacts.length).toBeGreaterThanOrEqual(5);
    expect(data.automations.length).toBeGreaterThanOrEqual(3);
  });

  it('executes live DBT-001 v1.1 authoritative verification suite with PASS', async () => {
    const res = await fetch(`${baseUrl}/api/dbt001/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: '1.1' }),
    });
    expect(res.status).toBe(200);
    const report = await res.json();
    expect(report.passed).toBe(true);
    expect(report.banner).toBe('DBT-001 VERIFIED RUN: PASS');
    expect(report.stages.every((s: { status: string }) => s.status === 'PASS')).toBe(true);
  });

  it('routes Commander North chat to direct a 4-act movie with verified 7-stage task', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Make a sci-fi movie about an aurora observatory in Yukon',
        mode: 'omni',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistantMessage.attachedMedia.media_type).toBe('movie');
    expect(data.assistantMessage.attachedMedia.spec.scenes.length).toBe(4);
    expect(data.assistantMessage.attachedMedia.spec.audioWavDataUrl).toMatch(/^data:audio\/wav;base64,/);
    expect(data.assistantMessage.attachedTask.execution_status).toBe('COMPLETED');
    expect(data.assistantMessage.attachedTask.verification_status).toBe('VERIFIED');
    expect(data.assistantMessage.attachedTask.audit_events.length).toBe(7);
  });

  it('generates episodic TV shows, interactive builder apps, counseling reflections, and automation runs', async () => {
    // 1. Episodic Show
    const showRes = await fetch(`${baseUrl}/api/media/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaType: 'show',
        prompt: 'Make a comedy show about moose rangers in Algonquin Park',
      }),
    });
    expect(showRes.status).toBe(200);
    const showData = await showRes.json();
    expect(showData.artifact.media_type).toBe('show');
    expect(showData.artifact.spec.episodes.length).toBe(3);

    // 2. Builder Forge App
    const buildRes = await fetch(`${baseUrl}/api/builder/forge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Build a CAD savings calculator' }),
    });
    expect(buildRes.status).toBe(200);
    const buildData = await buildRes.json();
    expect(buildData.creation.preview_html).toContain('<!doctype html>');

    // 3. Counseling Reflection
    const counselRes = await fetch(`${baseUrl}/api/counseling/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moodLabel: 'Stressed / Stretched',
        moodScore: 5,
        energyScore: 4,
        userThought: 'Feeling overwhelmed by deadlines this week.',
      }),
    });
    expect(counselRes.status).toBe(200);
    const counselData = await counselRes.json();
    expect(counselData.reflection.reframed_perspective.length).toBeGreaterThan(20);
  });
});

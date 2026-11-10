import compression from 'compression';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import type {
  AutomationRecord,
  BuilderCreation,
  ConversationMessage,
  ConversationRecord,
  CounselingReflection,
  MediaArtifact,
  MediaType,
  TaskRecord,
  VillageAgent,
} from '../shared/types.js';
import {
  closeDb,
  DEFAULT_CONVERSATION_ID,
  DEFAULT_PROJECT_ID,
  DEFAULT_WORKSPACE_ID,
  getDb,
} from './db.js';
import {
  startAutomationWorker,
  stopAutomationWorker,
} from './engine/automationScheduler.js';
import {
  createBuildInVillage,
  createMediaInVillage,
  handleCommanderConversationTurn,
} from './engine/commanderBrain.js';
import { generateCounselingGuidance } from './engine/counselorSanctuary.js';
import { runLiveDbt001Suite } from './engine/dbt001LiveVerifier.js';
import { synthesizePolymathAnswer } from './engine/polymathKnowledge.js';
import { executeCanonicalVillageTask, getTaskWithDetails } from './engine/taskLifecycleRunner.js';
import { REPO_ROOT } from './repoRoot.js';

async function hydrateMessages(messages: ConversationMessage[]): Promise<ConversationMessage[]> {
  const db = await getDb();
  const out: ConversationMessage[] = [];
  for (const m of messages) {
    let attachedMedia: MediaArtifact | null = null;
    let attachedBuild: BuilderCreation | null = null;
    let attachedTask: TaskRecord | null = null;

    if (m.artifact_type === 'media' && m.artifact_id) {
      const r = await db.query<MediaArtifact>(`SELECT * FROM media_artifacts WHERE id = $1`, [m.artifact_id]);
      attachedMedia = r.rows[0] || null;
    } else if (m.artifact_type === 'builder' && m.artifact_id) {
      const r = await db.query<BuilderCreation>(`SELECT * FROM builder_creations WHERE id = $1`, [m.artifact_id]);
      attachedBuild = r.rows[0] || null;
    } else if (m.artifact_type === 'task' && m.artifact_id) {
      attachedTask = await getTaskWithDetails(db, m.artifact_id).catch(() => null);
    }

    out.push({
      ...m,
      attachedMedia,
      attachedBuild,
      attachedTask,
    });
  }
  return out;
}

export async function createVillageApp() {
  const db = await getDb();
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Safe HTTP security headers (iframe-friendly for embedded previews while preventing MIME sniffing)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });

  app.use(compression());
  app.use(express.json({ limit: '15mb' }));

  // Lightweight sliding-window API rate limiter for public cloud deployments
  const maxReqsPerMin = Number(process.env.RATE_LIMIT_MAX || 240);
  const ipBuckets = new Map<string, { count: number; resetAt: number }>();
  if (process.env.VITEST !== 'true' && maxReqsPerMin > 0) {
    app.use('/api', (req, res, next) => {
      if (req.path === '/health' || req.path === '/ready') return next();
      const now = Date.now();
      const ip = req.ip || 'unknown';
      const entry = ipBuckets.get(ip);
      if (!entry || now > entry.resetAt) {
        ipBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
        return next();
      }
      entry.count += 1;
      if (entry.count > maxReqsPerMin) {
        res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
        return;
      }
      next();
    });
  }

  // Liveness & Readiness Probes (Kubernetes / Cloud Run / Fly.io / Render / Railway / Docker)
  const livenessHandler: express.RequestHandler = (_req, res) => {
    res.json({
      ok: true,
      status: 'healthy',
      service: 'ai-agent-village',
      version: '1.1.0',
      dbEngine: db.engine,
      region: process.env.VILLAGE_REGION || 'ca-central-1',
      uptimeSeconds: Math.round(process.uptime()),
    });
  };
  app.get('/healthz', livenessHandler);
  app.get('/api/health', livenessHandler);

  const readinessHandler: express.RequestHandler = async (_req, res) => {
    try {
      await db.ping();
      res.json({
        ok: true,
        status: 'ready',
        dbEngine: db.engine,
      });
    } catch (err) {
      res.status(503).json({
        ok: false,
        status: 'unready',
        error: err instanceof Error ? err.message : 'Database ping failed',
      });
    }
  };
  app.get('/readyz', readinessHandler);
  app.get('/api/ready', readinessHandler);

  app.get('/api/bootstrap', async (_req, res, next) => {
    try {
      const currentDb = await getDb();

      const agentsRes = await currentDb.query<VillageAgent>(
        `SELECT a.*, '1.0.0' AS canonical_version
         FROM agents a
         ORDER BY CASE WHEN a.slug = 'village-commander' THEN 0 ELSE 1 END, a.created_at ASC`
      );

      const convsRes = await currentDb.query<ConversationRecord>(
        `SELECT * FROM conversations ORDER BY updated_at DESC`
      );

      const activeConvId = convsRes.rows[0]?.id || DEFAULT_CONVERSATION_ID;
      const msgsRes = await currentDb.query<ConversationMessage>(
        `SELECT * FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [activeConvId]
      );
      const messages = await hydrateMessages(msgsRes.rows);

      const mediaRes = await currentDb.query<MediaArtifact>(
        `SELECT * FROM media_artifacts ORDER BY created_at DESC LIMIT 30`
      );

      const buildsRes = await currentDb.query<BuilderCreation>(
        `SELECT * FROM builder_creations ORDER BY created_at DESC LIMIT 20`
      );

      const autosRes = await currentDb.query<AutomationRecord>(
        `SELECT * FROM automations ORDER BY created_at DESC`
      );

      const tasksRes = await currentDb.query<TaskRecord>(
        `SELECT * FROM tasks ORDER BY created_at DESC LIMIT 25`
      );

      const reflectionsRes = await currentDb.query<CounselingReflection>(
        `SELECT * FROM counseling_reflections ORDER BY created_at DESC LIMIT 20`
      );

      const auditRes = await currentDb.query(
        `SELECT id, entity_type, entity_id, event_type, actor_type, actor_id, payload, created_at
         FROM audit_events ORDER BY created_at DESC LIMIT 35`
      );

      res.json({
        agents: agentsRes.rows,
        conversations: convsRes.rows,
        activeConversationId: activeConvId,
        messages,
        mediaArtifacts: mediaRes.rows,
        builderCreations: buildsRes.rows,
        automations: autosRes.rows,
        tasks: tasksRes.rows,
        counselingReflections: reflectionsRes.rows,
        recentAuditEvents: auditRes.rows,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/conversations', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const title = String(req.body?.title || 'New Village Session').slice(0, 80);
      const mode = String(req.body?.mode || 'omni');
      const r = await currentDb.query<ConversationRecord>(
        `INSERT INTO conversations (workspace_id, title, mode) VALUES ($1, $2, $3) RETURNING *`,
        [DEFAULT_WORKSPACE_ID, title, mode]
      );
      const conv = r.rows[0];
      await currentDb.query(
        `INSERT INTO conversation_messages (conversation_id, sender_role, agent_slug, agent_name, content)
         VALUES ($1, 'assistant', 'village-commander', 'Commander North', $2)`,
        [conv.id, `Fresh channel open, friend! 🍁 How can **Commander North** and the Village help you in **${mode.toUpperCase()}** mode?`]
      );
      res.json({ conversation: conv });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/conversations/:id/messages', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const msgsRes = await currentDb.query<ConversationMessage>(
        `SELECT * FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [req.params.id]
      );
      res.json({ messages: await hydrateMessages(msgsRes.rows) });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/chat', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const conversationId = String(req.body?.conversationId || DEFAULT_CONVERSATION_ID);
      const content = String(req.body?.content || '').trim();
      const mode = String(req.body?.mode || 'omni');
      if (!content) {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }
      const turn = await handleCommanderConversationTurn(currentDb, conversationId, content, mode);
      await currentDb.query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversationId]);
      res.json(turn);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/media/generate', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const mediaType = String(req.body?.mediaType || 'photo') as MediaType;
      const prompt = String(req.body?.prompt || '').trim();
      const style = req.body?.style ? String(req.body.style) : undefined;
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }
      const result = await createMediaInVillage(currentDb, mediaType, prompt, style);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/builder/forge', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const prompt = String(req.body?.prompt || '').trim();
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }
      const result = await createBuildInVillage(currentDb, prompt);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/counseling/reflect', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const moodLabel = String(req.body?.moodLabel || 'Reflective');
      const moodScore = Math.max(1, Math.min(10, Number(req.body?.moodScore || 6)));
      const energyScore = Math.max(1, Math.min(10, Number(req.body?.energyScore || 6)));
      const userThought = String(req.body?.userThought || '').trim();
      if (!userThought) {
        res.status(400).json({ error: 'Reflection text is required' });
        return;
      }

      const guidance = generateCounselingGuidance(userThought, moodLabel, moodScore, energyScore);
      const inserted = await currentDb.query<CounselingReflection>(
        `INSERT INTO counseling_reflections (
           workspace_id, mood_label, mood_score, energy_score,
           user_thought, compassionate_response, reframed_perspective, gentle_action_step
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          DEFAULT_WORKSPACE_ID,
          moodLabel,
          moodScore,
          energyScore,
          userThought,
          guidance.compassionateResponse,
          guidance.reframedPerspective,
          guidance.gentleActionStep,
        ]
      );

      res.json({
        reflection: inserted.rows[0],
        breathingPattern: guidance.breathingPattern,
        isCrisisCareIncluded: guidance.isCrisisCareIncluded,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/tasks', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const title = String(req.body?.title || '').trim();
      const description = String(req.body?.description || title).trim();
      const category = String(req.body?.category || 'general');
      const priority = (req.body?.priority || 'NORMAL') as TaskRecord['priority'];
      if (!title) {
        res.status(400).json({ error: 'Task title is required' });
        return;
      }

      const task = await executeCanonicalVillageTask(currentDb, {
        title,
        description,
        category,
        priority,
        specialistSlug: 'scholar-champlain',
        specialistRole: 'specialist',
        toolName: 'knowledge.query',
        inputPayload: { title, description },
        executeWork: async () => ({
          summary: synthesizePolymathAnswer(`${title}: ${description}`),
        }),
      });
      res.json({ task });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/tasks/:id', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const task = await getTaskWithDetails(currentDb, req.params.id);
      if (!task?.id) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json({ task });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/automations', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const name = String(req.body?.name || '').trim();
      const description = String(req.body?.description || name).trim();
      const scheduleExpr = String(req.body?.scheduleExpr || 'Every 1 hour');
      const intervalSeconds = Math.max(10, Number(req.body?.intervalSeconds || 3600));
      const category = String(req.body?.category || 'general');
      const promptTemplate = String(req.body?.promptTemplate || description);
      if (!name) {
        res.status(400).json({ error: 'Automation name is required' });
        return;
      }

      const inserted = await currentDb.query<AutomationRecord>(
        `INSERT INTO automations (project_id, name, description, schedule_expr, interval_seconds, category, prompt_template, enabled, last_run_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, now())
         RETURNING *`,
        [DEFAULT_PROJECT_ID, name, description, scheduleExpr, intervalSeconds, category, promptTemplate]
      );
      res.json({ automation: inserted.rows[0] });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/automations/:id/toggle', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const updated = await currentDb.query<AutomationRecord>(
        `UPDATE automations SET enabled = NOT enabled, updated_at = now() WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      res.json({ automation: updated.rows[0] });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/automations/:id/run', async (req, res, next) => {
    try {
      const currentDb = await getDb();
      const autoRes = await currentDb.query<AutomationRecord>(`SELECT * FROM automations WHERE id = $1`, [req.params.id]);
      const auto = autoRes.rows[0];
      if (!auto) {
        res.status(404).json({ error: 'Automation not found' });
        return;
      }

      const task = await executeCanonicalVillageTask(currentDb, {
        title: `[Auto] ${auto.name}`,
        description: auto.prompt_template,
        category: `automation:${auto.category}`,
        priority: 'NORMAL',
        specialistSlug: 'scholar-champlain',
        specialistRole: 'specialist',
        toolName: 'automation.schedule',
        inputPayload: { automationId: auto.id, schedule: auto.schedule_expr },
        executeWork: async () => ({
          summary: synthesizePolymathAnswer(auto.prompt_template),
          automationName: auto.name,
        }),
      });

      const updated = await currentDb.query<AutomationRecord>(
        `UPDATE automations
         SET run_count = run_count + 1,
             last_run_at = now(),
             last_task_id = $2,
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [auto.id, task.id]
      );

      res.json({ automation: updated.rows[0], task });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/dbt001/run', async (req, res, next) => {
    try {
      const ver = req.body?.version === '1.0' ? '1.0' : '1.1';
      const report = await runLiveDbt001Suite(ver);
      res.json(report);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/vault/summary', async (_req, res, next) => {
    try {
      const currentDb = await getDb();
      const tables = [
        'users',
        'workspaces',
        'projects',
        'agents',
        'agent_versions',
        'tasks',
        'task_agent_assignments',
        'task_steps',
        'tool_executions',
        'audit_events',
        'media_artifacts',
        'builder_creations',
        'automations',
        'counseling_reflections',
      ];

      const counts: Record<string, number> = {};
      for (const tbl of tables) {
        const r = await currentDb.query<{ count: string | number }>(`SELECT count(*) AS count FROM ${tbl}`);
        counts[tbl] = Number(r.rows[0]?.count || 0);
      }

      const auditEvents = await currentDb.query(
        `SELECT id, entity_type, entity_id, event_type, actor_type, actor_id, payload, created_at
         FROM audit_events
         ORDER BY created_at DESC
         LIMIT 40`
      );

      res.json({
        engine: currentDb.engine,
        counts,
        auditEvents: auditEvents.rows,
      });
    } catch (err) {
      next(err);
    }
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Village Server Error]', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unexpected server error',
    });
  });

  return app;
}

async function startServer() {
  const db = await getDb();
  const app = await createVillageApp();
  const httpServer = http.createServer(app);
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const clientDist = path.join(REPO_ROOT, 'dist', 'client');
    // Long-lived immutable caching on hashed Vite assets
    app.use(
      '/assets',
      express.static(path.join(clientDist, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );
    app.use(
      express.static(clientDist, {
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  startAutomationWorker(db);

  httpServer.listen(port, host, () => {
    console.log(
      `🍁 AI Agent Village (${isProd ? 'production' : 'development'} · db=${db.engine}) listening on http://${host}:${port}`
    );
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[AI Agent Village] Received ${signal}, draining connections gracefully...`);
    stopAutomationWorker();

    await new Promise<void>((resolve) => {
      const forceTimer = setTimeout(() => resolve(), 8_000);
      forceTimer.unref?.();
      httpServer.close(() => {
        clearTimeout(forceTimer);
        resolve();
      });
    });

    await closeDb().catch((err) => {
      console.error('[AI Agent Village] Error closing database:', err);
    });

    console.log('[AI Agent Village] Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (process.env.VITEST !== 'true') {
  startServer().catch((err) => {
    console.error('Failed to start AI Agent Village server:', err);
    process.exit(1);
  });
}

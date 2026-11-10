import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { synthesizeWavDataUrl } from './engine/audioSynthesizer.js';
import { forgeBuilderApplication } from './engine/builderForge.js';
import { produceMovieArtifact, produceShowArtifact, produceVideoArtifact } from './engine/cinemaDirector.js';
import { composePhotoSvg } from './engine/photoCompositor.js';
import { REPO_ROOT } from './repoRoot.js';

const { Pool } = pg;

export const DEFAULT_USER_ID = '11111111-1111-4111-8111-000000000001';
export const DEFAULT_WORKSPACE_ID = '22222222-2222-4222-8222-000000000001';
export const DEFAULT_PROJECT_ID = '33333333-3333-4333-8333-000000000001';
export const DEFAULT_CONVERSATION_ID = '88888888-8888-4888-8888-000000000001';

export interface VillageDb {
  readonly engine: 'postgres-pool' | 'pglite';
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

let dbInstance: VillageDb | null = null;
let initPromise: Promise<VillageDb> | null = null;

function shouldEnableSsl(connectionString: string): boolean {
  const mode = (process.env.PGSSLMODE || '').toLowerCase();
  if (mode === 'disable') return false;
  if (mode === 'require' || mode === 'verify-full') return true;
  return /sslmode=require|neon\.tech|supabase\.co|render\.com|amazonaws\.com|railway\.app/i.test(connectionString);
}

function resolveDefaultPglitePath(): string {
  if (process.env.VILLAGE_DB_PATH) {
    return process.env.VILLAGE_DB_PATH;
  }
  try {
    if (fs.existsSync('/data')) {
      fs.accessSync('/data', fs.constants.W_OK);
      return '/data/village-pgdata';
    }
  } catch {
    // Fall back to workspace .data directory
  }
  return path.join(REPO_ROOT, '.data', 'village-pgdata');
}

export async function getDb(): Promise<VillageDb> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mig1 = fs.readFileSync(
      path.join(REPO_ROOT, 'database', 'migrations', '0001_initial_village_schema.sql'),
      'utf8'
    );
    const mig2 = fs.readFileSync(
      path.join(REPO_ROOT, 'database', 'migrations', '0002_village_studio_schema.sql'),
      'utf8'
    );

    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (databaseUrl && process.env.VILLAGE_DB_PATH !== 'memory://') {
      const pool = new Pool({
        connectionString: databaseUrl,
        max: Number(process.env.PGPOOL_MAX || 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: shouldEnableSsl(databaseUrl)
          ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === 'true' }
          : undefined,
      });

      const adapter: VillageDb = {
        engine: 'postgres-pool',
        async query<T = Record<string, unknown>>(sql: string, params?: unknown[]) {
          const res = await pool.query(sql, params as any[]);
          return { rows: res.rows as T[] };
        },
        async exec(sql: string) {
          await pool.query(sql);
        },
        async ping() {
          await pool.query('SELECT 1');
          return true;
        },
        async close() {
          await pool.end();
        },
      };

      // Advisory lock prevents race conditions across concurrent container replicas
      const client = await pool.connect();
      try {
        await client.query('SELECT pg_advisory_lock(88421001)');
        await client.query(mig1);
        await client.query(mig2);
        await seedCanonicalVillageIfEmpty({
          engine: 'postgres-pool',
          query: async <T = Record<string, unknown>>(sql: string, params?: unknown[]) => {
            const r = await client.query(sql, params as any[]);
            return { rows: r.rows as T[] };
          },
          exec: async (sql: string) => {
            await client.query(sql);
          },
          ping: async () => true,
          close: async () => {},
        });
      } finally {
        await client.query('SELECT pg_advisory_unlock(88421001)').catch(() => {});
        client.release();
      }

      dbInstance = adapter;
      return adapter;
    }

    // Embedded Persistent PGlite PostgreSQL 16 Engine
    const storageTarget = resolveDefaultPglitePath();
    if (storageTarget !== 'memory://') {
      fs.mkdirSync(path.dirname(storageTarget), { recursive: true });
    }

    const pglite = new PGlite(storageTarget);
    await pglite.waitReady;

    const adapter: VillageDb = {
      engine: 'pglite',
      async query<T = Record<string, unknown>>(sql: string, params?: unknown[]) {
        const res = await pglite.query<T>(sql, params);
        return { rows: res.rows };
      },
      async exec(sql: string) {
        await pglite.exec(sql);
      },
      async ping() {
        await pglite.query('SELECT 1');
        return true;
      },
      async close() {
        await pglite.close();
      },
    };

    await adapter.exec(mig1);
    await adapter.exec(mig2);
    await seedCanonicalVillageIfEmpty(adapter);

    dbInstance = adapter;
    return adapter;
  })();

  return initPromise;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    const current = dbInstance;
    dbInstance = null;
    initPromise = null;
    await current.close();
  }
}

async function seedCanonicalVillageIfEmpty(db: VillageDb) {
  const existing = await db.query<{ count: string | number }>('SELECT count(*) AS count FROM users');
  if (Number(existing.rows[0]?.count || 0) > 0) {
    return;
  }

  const configRaw = fs.readFileSync(
    path.join(REPO_ROOT, 'config', 'canonical_agent_configuration_v1.0.json'),
    'utf8'
  );
  const canonicalConfig = JSON.parse(configRaw);

  await db.query(
    `INSERT INTO users (id, email, display_name, locale, status)
     VALUES ($1, 'creator@aiagentvillage.ca', 'Canadian Creator', 'en-CA', 'ACTIVE')`,
    [DEFAULT_USER_ID]
  );

  await db.query(
    `INSERT INTO workspaces (id, owner_user_id, slug, name, region, settings)
     VALUES ($1, $2, 'aurora-command-village', 'AI Agent Village — Northern Observatory', 'ca-central-1', $3::jsonb)`,
    [DEFAULT_WORKSPACE_ID, DEFAULT_USER_ID, JSON.stringify({ country: 'CA', voiceLocale: 'en-CA' })]
  );

  await db.query(
    `INSERT INTO projects (id, workspace_id, slug, name, description, status)
     VALUES ($1, $2, 'all-in-one-command', 'All-in-One Village Command & Studio', 'Unified workspace for tasks, automations, counseling, code builds, photos, audio, videos, movies, and shows.', 'ACTIVE')`,
    [DEFAULT_PROJECT_ID, DEFAULT_WORKSPACE_ID]
  );

  for (const ag of canonicalConfig.agents) {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO agents (slug, name, callsign, guild, origin_country, persona_summary, capabilities, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true)
       RETURNING id`,
      [
        ag.slug,
        ag.name,
        ag.callsign,
        ag.guild,
        ag.origin_country || 'CA',
        ag.persona_summary,
        JSON.stringify(ag.capabilities),
      ]
    );
    const agentId = inserted.rows[0].id;

    for (const ver of ['1.0.0', '1.0.0-dbt001']) {
      await db.query(
        `INSERT INTO agent_versions (agent_id, version, system_prompt, model_profile, tool_allowlist, is_canonical)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, true)`,
        [
          agentId,
          ver,
          `Canonical ${ag.name} (${ag.callsign}) v${ver} — ${ag.persona_summary}`,
          JSON.stringify({ role: ag.role, locale: 'en-CA' }),
          JSON.stringify(ag.tool_allowlist),
        ]
      );
    }
  }

  await db.query(
    `INSERT INTO conversations (id, workspace_id, title, mode)
     VALUES ($1, $2, 'Commander North — All-in-One Hub', 'omni')`,
    [DEFAULT_CONVERSATION_ID, DEFAULT_WORKSPACE_ID]
  );

  await db.query(
    `INSERT INTO conversation_messages (conversation_id, sender_role, agent_slug, agent_name, content, metadata)
     VALUES ($1, 'assistant', 'village-commander', 'Commander North', $2, $3::jsonb)`,
    [
      DEFAULT_CONVERSATION_ID,
      `Welcome home to the **AI Agent Village**, friend! 🍁\n\nI'm **Commander North** (*Village Commander v1.0.0*) — your all-in-one Canadian AI partner. Whether you want to **talk out loud by voice**, **work through life's big moments in Counseling**, **automate your daily tasks**, **build live apps & software**, or **generate photos, music, videos, full multi-scene movies, and episodic TV shows**, our entire Village is online and ready.\n\nTry asking me anything right here — like *"Direct a sci-fi movie about an aurora station over Lake Superior"*, *"Build me a CAD savings calculator app"*, or *"Help me decompress from a busy week"*!`,
      JSON.stringify({ welcome: true }),
    ]
  );

  const starterAutomations = [
    {
      name: 'True North Morning Briefing & Priority Plan',
      description: 'Synthesizes top priorities, weather-ready focus blocks, and executive task plan automatically.',
      schedule_expr: 'Daily · 07:30 EST',
      interval_seconds: 86400,
      category: 'planning',
      prompt_template: 'Compile today’s prioritized action briefing and verify milestone readiness.',
    },
    {
      name: 'Cinema & Media Studio Daily Concept Reel',
      description: 'Generates fresh visual storyboard art and ambient aurora audio score for creative inspiration.',
      schedule_expr: 'Every 12 hours',
      interval_seconds: 43200,
      category: 'studio',
      prompt_template: 'Generate an atmospheric Northern Cinema concept frame and companion score.',
    },
    {
      name: 'Evening Grounding & Wellness Check-In',
      description: 'Prepares a gentle end-of-day reflection prompt and stress decompression exercise with Counselor Cedar.',
      schedule_expr: 'Daily · 20:30 EST',
      interval_seconds: 86400,
      category: 'counseling',
      prompt_template: 'Prepare a calm evening gratitude and cognitive decompression check-in.',
    },
  ];

  for (const auto of starterAutomations) {
    await db.query(
      `INSERT INTO automations (project_id, name, description, schedule_expr, interval_seconds, category, prompt_template, enabled, last_run_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, now())`,
      [
        DEFAULT_PROJECT_ID,
        auto.name,
        auto.description,
        auto.schedule_expr,
        auto.interval_seconds,
        auto.category,
        auto.prompt_template,
      ]
    );
  }

  const photoShowcase = composePhotoSvg(
    'Emerald aurora borealis dancing over a cedar geodesic observatory on Manitoulin Island',
    'Northern Aurora Cinema',
    '16:9',
    'Manitoulin Aurora Observatory'
  );
  await db.query(
    `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
     VALUES ($1, 'photo', 'Manitoulin Aurora Observatory', $2, 'Northern Aurora Cinema', 0, $3, $3, $4::jsonb, 'Artist Laurentian')`,
    [
      DEFAULT_PROJECT_ID,
      'Emerald aurora borealis dancing over a cedar geodesic observatory on Manitoulin Island',
      photoShowcase.svgDataUrl,
      JSON.stringify({
        aspectRatio: photoShowcase.aspectRatio,
        palette: photoShowcase.palette,
        svgDataUrl: photoShowcase.svgDataUrl,
      }),
    ]
  );

  const audioShowcase = synthesizeWavDataUrl('Midnight aurora ambient piano and warm northern strings', 'aurora-ambient', 9);
  const audioCover = composePhotoSvg('Midnight aurora soundwaves over calm northern lake', 'Sound Lab Cover', '1:1', 'Midnight over Georgian Bay');
  await db.query(
    `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
     VALUES ($1, 'audio', 'Midnight over Georgian Bay', 'Midnight aurora ambient harmonic score and warm sub-bass', 'Aurora Ambient Score', $2, $3, $4, $5::jsonb, 'Maestro St. Lawrence')`,
    [
      DEFAULT_PROJECT_ID,
      audioShowcase.duration,
      audioCover.svgDataUrl,
      audioShowcase.dataUrl,
      JSON.stringify({
        musicalStyle: audioShowcase.style,
        bpm: audioShowcase.bpm,
        musicalKey: audioShowcase.keyName,
        svgDataUrl: audioCover.svgDataUrl,
        audioWavDataUrl: audioShowcase.dataUrl,
      }),
    ]
  );

  const videoShowcase = produceVideoArtifact('Aerial glide through neon snow-dusted Toronto skyline at twilight');
  await db.query(
    `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
     VALUES ($1, 'video', 'Twilight Over the Six', 'Aerial glide through neon snow-dusted Toronto skyline at twilight', $2, $3, $4, $5, $6::jsonb, 'Director Borealis')`,
    [
      DEFAULT_PROJECT_ID,
      videoShowcase.style,
      videoShowcase.durationSeconds,
      videoShowcase.thumbnailUrl,
      videoShowcase.assetUrl,
      JSON.stringify(videoShowcase.spec),
    ]
  );

  const movieShowcase = produceMovieArtifact('Make a sci-fi movie about Canadian astronauts discovering an ancient harmonic beacon beneath the northern lights');
  await db.query(
    `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
     VALUES ($1, 'movie', 'Aurora Station: Signal from Superior', 'Canadian astronauts and xenobiologists decode an ancient harmonic beacon beneath the northern lights', $2, $3, $4, $5, $6::jsonb, 'Director Borealis')`,
    [
      DEFAULT_PROJECT_ID,
      movieShowcase.style,
      movieShowcase.durationSeconds,
      movieShowcase.thumbnailUrl,
      movieShowcase.assetUrl,
      JSON.stringify(movieShowcase.spec),
    ]
  );

  const showShowcase = produceShowArtifact('Make a warm funny Canadian comedy-drama show about inventors running an AI lodge in Banff');
  await db.query(
    `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
     VALUES ($1, 'show', 'North of Banff — Season 1', 'Warm Canadian comedy-drama series following three inventors running a high-tech mountain lodge', $2, $3, $4, $5, $6::jsonb, 'Director Borealis')`,
    [
      DEFAULT_PROJECT_ID,
      showShowcase.style,
      showShowcase.durationSeconds,
      showShowcase.thumbnailUrl,
      showShowcase.assetUrl,
      JSON.stringify(showShowcase.spec),
    ]
  );

  const starterBuild = forgeBuilderApplication('Build a CAD compound savings & financial freedom calculator');
  await db.query(
    `INSERT INTO builder_creations (project_id, title, prompt, blueprint_type, summary, preview_html, files)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      DEFAULT_PROJECT_ID,
      'True North CAD Wealth Planner',
      'Build a CAD compound savings & financial freedom calculator',
      starterBuild.blueprintType,
      starterBuild.summary,
      starterBuild.previewHtml,
      JSON.stringify(starterBuild.files),
    ]
  );

  await db.query(
    `INSERT INTO counseling_reflections (workspace_id, mood_label, mood_score, energy_score, user_thought, compassionate_response, reframed_perspective, gentle_action_step)
     VALUES ($1, 'Hopeful & Focused', 8, 7, 'Excited to launch a big creative project, trying to pace myself sustainably.', 'What a great place to stand—ambition paired with self-awareness is where your best craft lives.', 'Sustainable rhythm always beats a frantic sprint; steady daily stones build cathedrals.', 'Celebrate completing Milestone 1 today, then step outside for 10 minutes of crisp air.')`,
    [DEFAULT_WORKSPACE_ID]
  );
}

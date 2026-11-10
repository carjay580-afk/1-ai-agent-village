-- ============================================================================
-- AI Agent Village — Migration 0002: Omni-Agent Studio, Counseling, Builder
-- and Automation Extensions
-- ============================================================================

-- 1. Conversations & Chat Messages (Commander North + Guild Stances)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  mode text NOT NULL DEFAULT 'omni' CHECK (
    mode IN ('omni', 'counseling', 'builder', 'studio', 'knowledge', 'automation')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
  agent_slug text NOT NULL DEFAULT 'village-commander',
  agent_name text NOT NULL DEFAULT 'Commander North',
  content text NOT NULL,
  artifact_type text,
  artifact_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conv_id ON conversation_messages(conversation_id, created_at);

-- 2. Automations (Scheduled & Triggered Autonomous Routines)
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  schedule_expr text NOT NULL DEFAULT 'Every 6 hours',
  interval_seconds integer NOT NULL DEFAULT 3600 CHECK (interval_seconds >= 10),
  category text NOT NULL DEFAULT 'general',
  prompt_template text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  last_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Multimedia Studio Artifacts (Photos, Audio, Videos, Movies, Shows)
CREATE TABLE IF NOT EXISTS media_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'audio', 'video', 'movie', 'show')),
  title text NOT NULL,
  prompt text NOT NULL,
  style text NOT NULL DEFAULT 'Northern Cinema',
  duration_seconds numeric(8,2) NOT NULL DEFAULT 0,
  thumbnail_url text,
  asset_url text,
  spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_agent text NOT NULL DEFAULT 'Director Borealis',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_artifacts_type ON media_artifacts(media_type, created_at DESC);

-- 4. Builder Forge Projects (Interactive Apps, Websites, Tools, Schemas)
CREATE TABLE IF NOT EXISTS builder_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  prompt text NOT NULL,
  blueprint_type text NOT NULL DEFAULT 'web-app',
  summary text NOT NULL DEFAULT '',
  preview_html text NOT NULL,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Counseling Sanctuary Reflections & Mood Check-ins
CREATE TABLE IF NOT EXISTS counseling_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  mood_label text NOT NULL,
  mood_score integer NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  energy_score integer NOT NULL CHECK (energy_score BETWEEN 1 AND 10),
  user_thought text NOT NULL,
  compassionate_response text NOT NULL,
  reframed_perspective text NOT NULL,
  gentle_action_step text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

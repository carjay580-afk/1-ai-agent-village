export type MediaType = 'photo' | 'audio' | 'video' | 'movie' | 'show';

export interface VillageAgent {
  id: string;
  slug: string;
  name: string;
  callsign: string;
  guild: string;
  origin_country: string;
  persona_summary: string;
  capabilities: string[];
  is_active: boolean;
  canonical_version?: string;
}

export interface TaskStepRecord {
  id: string;
  task_id: string;
  step_order: number;
  step_type: 'PLAN' | 'EXECUTE' | 'VERIFY' | 'SYNTHESIZE';
  title: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
  assigned_agent_id: string | null;
  assigned_agent_name?: string;
  output_payload: Record<string, unknown>;
}

export interface ToolExecutionRecord {
  id: string;
  task_id: string;
  task_step_id: string;
  agent_id: string;
  agent_name?: string;
  tool_name: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  duration_ms: number;
  output_payload: Record<string, unknown>;
  executed_at: string;
}

export interface AuditEventRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TaskRecord {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  execution_status: 'CREATED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  verification_status: 'UNVERIFIED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  steps?: TaskStepRecord[];
  tools?: ToolExecutionRecord[];
  audit_events?: AuditEventRecord[];
}

export interface CastCharacter {
  name: string;
  role: string;
  color: string;
  voicePitch: number;
  voiceRate: number;
  silhouette: 'ranger' | 'astronaut' | 'inventor' | 'counselor' | 'musician' | 'detective';
}

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion: 'warm' | 'urgent' | 'wonder' | 'humorous' | 'resolute' | 'reflective';
}

export interface CinemaScene {
  sceneNumber: number;
  title: string;
  setting: 'aurora-peaks' | 'neon-metropolis' | 'timber-lodge' | 'deep-cosmos' | 'misty-harbor' | 'enchanted-woods';
  weather: 'aurora' | 'snow' | 'rain' | 'embers' | 'starlight' | 'sunbeams';
  cameraMotion: 'pan-right' | 'zoom-in' | 'zoom-out' | 'dolly-up';
  skyTop: string;
  skyBottom: string;
  accentColor: string;
  durationSec: number;
  stageDirection: string;
  dialogue: DialogueLine[];
}

export interface ShowEpisode {
  episodeNumber: number;
  title: string;
  synopsis: string;
  runtimeLabel: string;
  scenes: CinemaScene[];
}

export interface MediaSpec {
  tagline?: string;
  genre?: string;
  rating?: string;
  aspectRatio?: string;
  palette?: string[];
  musicalStyle?: 'aurora-ambient' | 'cinematic-orchestral' | 'cozy-folk' | 'cyber-synthwave' | 'lofi-chill';
  bpm?: number;
  musicalKey?: string;
  narrationScript?: string;
  cast?: CastCharacter[];
  scenes?: CinemaScene[];
  episodes?: ShowEpisode[];
  svgDataUrl?: string;
  audioWavDataUrl?: string;
}

export interface MediaArtifact {
  id: string;
  project_id: string;
  task_id: string | null;
  media_type: MediaType;
  title: string;
  prompt: string;
  style: string;
  duration_seconds: number;
  thumbnail_url: string | null;
  asset_url: string | null;
  spec: MediaSpec;
  created_by_agent: string;
  created_at: string;
}

export interface BuilderFile {
  name: string;
  language: string;
  content: string;
}

export interface BuilderCreation {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  prompt: string;
  blueprint_type: string;
  summary: string;
  preview_html: string;
  files: BuilderFile[];
  created_at: string;
}

export interface AutomationRecord {
  id: string;
  project_id: string;
  name: string;
  description: string;
  schedule_expr: string;
  interval_seconds: number;
  category: string;
  prompt_template: string;
  enabled: boolean;
  run_count: number;
  last_run_at: string | null;
  last_task_id: string | null;
  created_at: string;
}

export interface CounselingReflection {
  id: string;
  mood_label: string;
  mood_score: number;
  energy_score: number;
  user_thought: string;
  compassionate_response: string;
  reframed_perspective: string;
  gentle_action_step: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_role: 'user' | 'assistant' | 'system';
  agent_slug: string;
  agent_name: string;
  content: string;
  artifact_type: string | null;
  artifact_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  attachedMedia?: MediaArtifact | null;
  attachedBuild?: BuilderCreation | null;
  attachedTask?: TaskRecord | null;
}

export interface ConversationRecord {
  id: string;
  title: string;
  mode: 'omni' | 'counseling' | 'builder' | 'studio' | 'knowledge' | 'automation';
  created_at: string;
  updated_at: string;
}

export interface Dbt001RunReport {
  passed: boolean;
  suiteVersion: string;
  durationMs: number;
  stages: {
    name: string;
    status: 'PASS' | 'FAIL';
    detail: string;
  }[];
  notices: string[];
  banner: string;
  executedAt: string;
}

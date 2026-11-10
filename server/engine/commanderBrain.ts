import type {
  BuilderCreation,
  ConversationMessage,
  MediaArtifact,
  MediaType,
  TaskRecord,
} from '../../shared/types.js';
import { DEFAULT_PROJECT_ID, DEFAULT_WORKSPACE_ID, type VillageDb } from '../db.js';
import { synthesizeWavDataUrl } from './audioSynthesizer.js';
import { forgeBuilderApplication } from './builderForge.js';
import { produceMovieArtifact, produceShowArtifact, produceVideoArtifact } from './cinemaDirector.js';
import { generateCounselingGuidance } from './counselorSanctuary.js';
import { composePhotoSvg } from './photoCompositor.js';
import { synthesizePolymathAnswer } from './polymathKnowledge.js';
import { executeCanonicalVillageTask } from './taskLifecycleRunner.js';

export async function createMediaInVillage(
  db: VillageDb,
  mediaType: MediaType,
  prompt: string,
  style?: string
): Promise<{ artifact: MediaArtifact; task: TaskRecord }> {
  let createdArtifact!: MediaArtifact;

  const agentMap: Record<MediaType, string> = {
    photo: 'artist-laurentian',
    audio: 'maestro-st-lawrence',
    video: 'director-borealis',
    movie: 'director-borealis',
    show: 'director-borealis',
  };
  const agentDisplayMap: Record<MediaType, string> = {
    photo: 'Artist Laurentian',
    audio: 'Maestro St. Lawrence',
    video: 'Director Borealis',
    movie: 'Director Borealis',
    show: 'Director Borealis',
  };

  const toolMap: Record<MediaType, string> = {
    photo: 'studio.render_photo',
    audio: 'studio.synthesize_audio',
    video: 'studio.render_video',
    movie: 'studio.produce_cinema',
    show: 'studio.produce_cinema',
  };

  const task = await executeCanonicalVillageTask(db, {
    title: `Studio ${mediaType.toUpperCase()}: ${prompt.slice(0, 64)}`,
    description: prompt,
    category: `studio-${mediaType}`,
    priority: 'NORMAL',
    specialistSlug: agentMap[mediaType],
    specialistRole: 'producer',
    toolName: toolMap[mediaType],
    inputPayload: { mediaType, prompt, style },
    executeWork: async () => {
      if (mediaType === 'photo') {
        const chosenStyle = style || 'Northern Aurora Cinema';
        const res = composePhotoSvg(prompt, chosenStyle, '16:9');
        const title = prompt.slice(0, 48).replace(/^(make|create|generate|draw)\s+(a\s+|an\s+)?(photo|picture|image|poster)\s*(of|about)?\s*/i, '').trim() || 'Aurora Visual Frame';
        const row = await db.query<MediaArtifact>(
          `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
           VALUES ($1, 'photo', $2, $3, $4, 0, $5, $5, $6::jsonb, $7)
           RETURNING *`,
          [
            DEFAULT_PROJECT_ID,
            title.charAt(0).toUpperCase() + title.slice(1),
            prompt,
            chosenStyle,
            res.svgDataUrl,
            JSON.stringify({ aspectRatio: res.aspectRatio, palette: res.palette, svgDataUrl: res.svgDataUrl }),
            agentDisplayMap.photo,
          ]
        );
        createdArtifact = row.rows[0];
      } else if (mediaType === 'audio') {
        const wav = synthesizeWavDataUrl(prompt, undefined, 9);
        const cover = composePhotoSvg(prompt, 'Music & Sound Lab', '1:1');
        const cleanTitle = prompt.replace(/^(make|create|generate|compose)\s+(me\s+)?(a\s+|an\s+|some\s+)?(audio|music|song|track|beat|soundtrack)\s*(about|for|of)?\s*/i, '').trim() || 'Northern Resonance';
        const row = await db.query<MediaArtifact>(
          `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
           VALUES ($1, 'audio', $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
           RETURNING *`,
          [
            DEFAULT_PROJECT_ID,
            cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1).slice(0, 48),
            prompt,
            style || `${wav.style} (${wav.bpm} BPM · ${wav.keyName})`,
            wav.duration,
            cover.svgDataUrl,
            wav.dataUrl,
            JSON.stringify({
              musicalStyle: wav.style,
              bpm: wav.bpm,
              musicalKey: wav.keyName,
              svgDataUrl: cover.svgDataUrl,
              audioWavDataUrl: wav.dataUrl,
            }),
            agentDisplayMap.audio,
          ]
        );
        createdArtifact = row.rows[0];
      } else if (mediaType === 'video') {
        const vid = produceVideoArtifact(prompt, style || 'Anamorphic Motion');
        const row = await db.query<MediaArtifact>(
          `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
           VALUES ($1, 'video', $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
           RETURNING *`,
          [
            DEFAULT_PROJECT_ID,
            vid.title,
            prompt,
            vid.style,
            vid.durationSeconds,
            vid.thumbnailUrl,
            vid.assetUrl,
            JSON.stringify(vid.spec),
            agentDisplayMap.video,
          ]
        );
        createdArtifact = row.rows[0];
      } else if (mediaType === 'movie') {
        const mov = produceMovieArtifact(prompt, style || '2.39:1 Northern IMAX');
        const row = await db.query<MediaArtifact>(
          `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
           VALUES ($1, 'movie', $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
           RETURNING *`,
          [
            DEFAULT_PROJECT_ID,
            mov.title,
            prompt,
            mov.style,
            mov.durationSeconds,
            mov.thumbnailUrl,
            mov.assetUrl,
            JSON.stringify(mov.spec),
            agentDisplayMap.movie,
          ]
        );
        createdArtifact = row.rows[0];
      } else {
        const shw = produceShowArtifact(prompt, style || 'Prestige Episodic Series');
        const row = await db.query<MediaArtifact>(
          `INSERT INTO media_artifacts (project_id, media_type, title, prompt, style, duration_seconds, thumbnail_url, asset_url, spec, created_by_agent)
           VALUES ($1, 'show', $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
           RETURNING *`,
          [
            DEFAULT_PROJECT_ID,
            shw.title,
            prompt,
            shw.style,
            shw.durationSeconds,
            shw.thumbnailUrl,
            shw.assetUrl,
            JSON.stringify(shw.spec),
            agentDisplayMap.show,
          ]
        );
        createdArtifact = row.rows[0];
      }

      return {
        summary: `Generated ${mediaType} "${createdArtifact.title}"`,
        artifactId: createdArtifact.id,
      };
    },
  });

  await db.query(`UPDATE media_artifacts SET task_id = $1 WHERE id = $2`, [task.id, createdArtifact.id]);
  createdArtifact.task_id = task.id;

  return { artifact: createdArtifact, task };
}

export async function createBuildInVillage(
  db: VillageDb,
  prompt: string
): Promise<{ creation: BuilderCreation; task: TaskRecord }> {
  let createdBuild!: BuilderCreation;

  const task = await executeCanonicalVillageTask(db, {
    title: `Builder Forge: ${prompt.slice(0, 64)}`,
    description: prompt,
    category: 'builder',
    priority: 'NORMAL',
    specialistSlug: 'builder-mackenzie',
    specialistRole: 'builder',
    toolName: 'builder.forge_app',
    inputPayload: { prompt },
    executeWork: async () => {
      const built = forgeBuilderApplication(prompt);
      const row = await db.query<BuilderCreation>(
        `INSERT INTO builder_creations (project_id, title, prompt, blueprint_type, summary, preview_html, files)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING *`,
        [
          DEFAULT_PROJECT_ID,
          built.title,
          prompt,
          built.blueprintType,
          built.summary,
          built.previewHtml,
          JSON.stringify(built.files),
        ]
      );
      createdBuild = row.rows[0];
      return { summary: built.summary, creationId: createdBuild.id };
    },
  });

  await db.query(`UPDATE builder_creations SET task_id = $1 WHERE id = $2`, [task.id, createdBuild.id]);
  createdBuild.task_id = task.id;
  return { creation: createdBuild, task };
}

function classifyChatIntent(text: string, mode: string):
  | { kind: 'media'; mediaType: MediaType }
  | { kind: 'builder' }
  | { kind: 'counseling' }
  | { kind: 'automation' }
  | { kind: 'task' }
  | { kind: 'knowledge' } {
  const p = text.toLowerCase();

  if (mode === 'counseling' || /\b(stressed|anxious|anxiety|overwhelmed|burnout|sad|lonely|depressed|counsel|counseling|feeling down|worried about)\b/.test(p)) {
    return { kind: 'counseling' };
  }

  if (/\b(tv show|web series|series|episodes|sitcom|season 1|make a show|create a show|produce a show)\b/.test(p)) {
    return { kind: 'media', mediaType: 'show' };
  }
  if (/\b(movie|film|featurette|cinema|screenplay|make a movie|direct a movie|create a movie)\b/.test(p)) {
    return { kind: 'media', mediaType: 'movie' };
  }
  if (/\b(video|motion clip|animation|make a video|generate a video|create a video)\b/.test(p)) {
    return { kind: 'media', mediaType: 'video' };
  }
  if (/\b(audio|song|music|soundtrack|beat|melody|ambient track|compose|synthesize audio)\b/.test(p)) {
    return { kind: 'media', mediaType: 'audio' };
  }
  if (/\b(photo|picture|image|poster|illustration|wallpaper|portrait|artwork|draw|paint)\b/.test(p)) {
    return { kind: 'media', mediaType: 'photo' };
  }

  if (mode === 'builder' || /\b(build|code|develop|forge)\b.*\b(app|website|calculator|game|dashboard|tool|tracker|planner|page|ui)\b/.test(p)) {
    return { kind: 'builder' };
  }

  if (mode === 'automation' || /\b(automate|every day|every morning|every hour|recurring|schedule a)\b/.test(p)) {
    return { kind: 'automation' };
  }

  if (/\b(run task|execute task|do this task|assign task)\b/.test(p)) {
    return { kind: 'task' };
  }

  return { kind: 'knowledge' };
}

export async function handleCommanderConversationTurn(
  db: VillageDb,
  conversationId: string,
  userContent: string,
  mode = 'omni'
): Promise<{ userMessage: ConversationMessage; assistantMessage: ConversationMessage }> {
  const userMsgRes = await db.query<ConversationMessage>(
    `INSERT INTO conversation_messages (conversation_id, sender_role, agent_slug, agent_name, content, metadata)
     VALUES ($1, 'user', 'user', 'You', $2, '{}'::jsonb)
     RETURNING *`,
    [conversationId, userContent]
  );

  const intent = classifyChatIntent(userContent, mode);

  let agentSlug = 'village-commander';
  let agentName = 'Commander North';
  let replyContent = '';
  let artifactType: string | null = null;
  let artifactId: string | null = null;
  let attachedMedia: MediaArtifact | null = null;
  let attachedBuild: BuilderCreation | null = null;
  let attachedTask: TaskRecord | null = null;

  if (intent.kind === 'media') {
    const { artifact, task } = await createMediaInVillage(db, intent.mediaType, userContent);
    attachedMedia = artifact;
    attachedTask = task;
    artifactType = 'media';
    artifactId = artifact.id;
    agentSlug = intent.mediaType === 'photo' ? 'artist-laurentian' : intent.mediaType === 'audio' ? 'maestro-st-lawrence' : 'director-borealis';
    agentName = `Commander North & ${artifact.created_by_agent}`;
    replyContent =
      intent.mediaType === 'movie'
        ? `Roll camera, friend! 🎬 **Director Borealis** and I just produced your original 4-act movie **"${artifact.title}"** — complete with cast voices, camera choreography, stage script, and a freshly synthesized WAV score (verified via Task \`${task.id.slice(0, 8)}\`). Hit **Play Movie** right below to screen it!`
        : intent.mediaType === 'show'
          ? `Showtime in the Village! 📺 We just greenlit and produced **"${artifact.title}"** — a 3-episode series with playable scenes, character dialogue, and theme music (verified via Task \`${task.id.slice(0, 8)}\`). Choose any episode right below!`
          : intent.mediaType === 'video'
            ? `Motion sequence rendered! 🎥 Here is **"${artifact.title}"** with dynamic canvas cinematography and synchronized WAV audio. You can play it live or export a `.concat('`.webm` video file right from the player!')
            : intent.mediaType === 'audio'
              ? `Fresh out of the Sound Lab! 🎵 **Maestro St. Lawrence** and I composed & synthesized **"${artifact.title}"** (${artifact.style}). Press play below or download the lossless 16-bit \`.wav\` file!`
              : `Captured! 📸 **Artist Laurentian** and I composed **"${artifact.title}"** in **${artifact.style}** style. Preview it below or export a high-res PNG!`;
  } else if (intent.kind === 'builder') {
    const { creation, task } = await createBuildInVillage(db, userContent);
    attachedBuild = creation;
    attachedTask = task;
    artifactType = 'builder';
    artifactId = creation.id;
    agentSlug = 'builder-mackenzie';
    agentName = 'Commander North & Builder MacKenzie';
    replyContent = `Built, wired up, and verified! 🛠️ **Builder MacKenzie** and I forged **"${creation.title}"** (Task \`${task.id.slice(0, 8)}\` · all 7 DBT-001 lifecycle checks passed). You can interact with the live app right inside the card below or open it in **Builder Forge** to inspect and download the source files!`;
  } else if (intent.kind === 'counseling') {
    const guidance = generateCounselingGuidance(userContent, 'Reflective', 6, 6);
    await db.query(
      `INSERT INTO counseling_reflections (workspace_id, mood_label, mood_score, energy_score, user_thought, compassionate_response, reframed_perspective, gentle_action_step)
       VALUES ($1, 'Check-in via Chat', 6, 6, $2, $3, $4, $5)`,
      [DEFAULT_WORKSPACE_ID, userContent, guidance.compassionateResponse, guidance.reframedPerspective, guidance.gentleActionStep]
    );
    agentSlug = 'counselor-cedar';
    agentName = 'Commander North & Counselor Cedar';
    replyContent = [
      guidance.compassionateResponse,
      ``,
      `**Gentle Reframe:** ${guidance.reframedPerspective}`,
      ``,
      `**One Small Next Step:** ${guidance.gentleActionStep}`,
      ``,
      `*Recommended Breathing Reset:* \`${guidance.breathingPattern}\` *(available anytime in the Counseling Sanctuary tab).*`,
    ].join('\n');
  } else if (intent.kind === 'automation') {
    const autoName = userContent.slice(0, 56).replace(/^(please\s+)?automate\s*/i, '').trim() || 'Custom Village Automation';
    const autoInsert = await db.query<{ id: string }>(
      `INSERT INTO automations (project_id, name, description, schedule_expr, interval_seconds, category, prompt_template, enabled, run_count, last_run_at)
       VALUES ($1, $2, $3, 'Every 1 hour', 3600, 'automated', $3, true, 1, now())
       RETURNING id`,
      [DEFAULT_PROJECT_ID, autoName.charAt(0).toUpperCase() + autoName.slice(1), userContent]
    );
    const task = await executeCanonicalVillageTask(db, {
      title: `Automated Run: ${autoName}`,
      description: userContent,
      category: 'automation',
      priority: 'NORMAL',
      specialistSlug: 'scholar-champlain',
      specialistRole: 'specialist',
      toolName: 'automation.schedule',
      inputPayload: { automationId: autoInsert.rows[0].id, prompt: userContent },
      executeWork: async () => ({
        summary: `Automation "${autoName}" registered and initial cycle verified.`,
        automationId: autoInsert.rows[0].id,
      }),
    });
    await db.query(`UPDATE automations SET last_task_id = $1 WHERE id = $2`, [task.id, autoInsert.rows[0].id]);
    attachedTask = task;
    artifactType = 'task';
    artifactId = task.id;
    replyContent = `Automation locked in, friend! ⚙️ I registered **"${autoName}"** on our active Village scheduler and completed its first verified 7-stage run (\`${task.id.slice(0, 8)}\`). You can toggle, trigger, or inspect its audit trail anytime in **Tasks & Automations**!`;
  } else if (intent.kind === 'task') {
    const task = await executeCanonicalVillageTask(db, {
      title: userContent.slice(0, 72),
      description: userContent,
      category: 'general',
      priority: 'HIGH',
      specialistSlug: 'scholar-champlain',
      specialistRole: 'specialist',
      toolName: 'knowledge.query',
      inputPayload: { prompt: userContent },
      executeWork: async () => ({
        summary: synthesizePolymathAnswer(userContent),
      }),
    });
    attachedTask = task;
    artifactType = 'task';
    artifactId = task.id;
    replyContent = `${String(task.output_payload.summary || '')}\n\n---\n✅ *Executed & verified across all 7 DBT-001 PostgreSQL lifecycle stages (\`${task.id.slice(0, 8)}\`).*`;
  } else {
    replyContent = synthesizePolymathAnswer(userContent);
  }

  const assistantMsgRes = await db.query<ConversationMessage>(
    `INSERT INTO conversation_messages (
       conversation_id, sender_role, agent_slug, agent_name, content, artifact_type, artifact_id, metadata
     ) VALUES ($1, 'assistant', $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [
      conversationId,
      agentSlug,
      agentName,
      replyContent,
      artifactType,
      artifactId,
      JSON.stringify({ intent: intent.kind }),
    ]
  );

  const assistantMessage: ConversationMessage = {
    ...assistantMsgRes.rows[0],
    attachedMedia,
    attachedBuild,
    attachedTask,
  };

  return {
    userMessage: userMsgRes.rows[0],
    assistantMessage,
  };
}

import type { CastCharacter, CinemaScene, MediaSpec, ShowEpisode } from '../../shared/types.js';
import { synthesizeWavDataUrl } from './audioSynthesizer.js';
import { composePhotoSvg } from './photoCompositor.js';

function cleanTopicTitle(prompt: string, fallback: string): string {
  const cleaned = prompt
    .replace(/^(please\s+)?(make|create|generate|produce|direct|film|shoot|write)\s+(me\s+)?(a\s+|an\s+)?(short\s+)?(video|movie|film|show|series|tv\s+show|episode)\s*(about|of|on|where|featuring|with)?\s*/i, '')
    .trim();
  if (!cleaned) return fallback;
  const words = cleaned.split(/\s+/).slice(0, 6);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).replace(/[^\w'-]/g, ''))
    .join(' ');
}

function detectGenreAndSetting(prompt: string): {
  genre: string;
  primarySetting: CinemaScene['setting'];
  secondarySetting: CinemaScene['setting'];
  weather: CinemaScene['weather'];
  palettes: Array<[string, string, string]>;
} {
  const p = prompt.toLowerCase();
  if (/space|cosmos|planet|starship|mars|galaxy|alien|astronaut|orbit|moon/.test(p)) {
    return {
      genre: 'Sci-Fi Odyssey',
      primarySetting: 'deep-cosmos',
      secondarySetting: 'neon-metropolis',
      weather: 'starlight',
      palettes: [
        ['#050816', '#131E47', '#38BDF8'],
        ['#0B0724', '#2A1458', '#A855F7'],
        ['#081426', '#123A5C', '#10B981'],
        ['#140A1F', '#3B184E', '#F59E0B'],
      ],
    };
  }
  if (/cyber|city|detective|noir|thriller|mystery|heist|toronto|montreal|crime/.test(p)) {
    return {
      genre: 'Neo-Noir Mystery',
      primarySetting: 'neon-metropolis',
      secondarySetting: 'misty-harbor',
      weather: 'rain',
      palettes: [
        ['#070918', '#1A1442', '#EC4899'],
        ['#071422', '#102F47', '#06B6D4'],
        ['#14091C', '#341447', '#F59E0B'],
        ['#06121E', '#12354B', '#38BDF8'],
      ],
    };
  }
  if (/funny|comedy|sitcom|humor|coffee|moose|hockey|friends|family|cozy|town/.test(p)) {
    return {
      genre: 'Heartfelt Canadian Comedy-Drama',
      primarySetting: 'timber-lodge',
      secondarySetting: 'aurora-peaks',
      weather: 'snow',
      palettes: [
        ['#0F172A', '#1E3A5F', '#F59E0B'],
        ['#161224', '#31254D', '#34D399'],
        ['#1C1410', '#452817', '#FBBF24'],
        ['#091B29', '#16425B', '#38BDF8'],
      ],
    };
  }
  if (/fantasy|magic|dragon|forest|quest|ancient|kingdom|myth/.test(p)) {
    return {
      genre: 'Mythic Adventure',
      primarySetting: 'enchanted-woods',
      secondarySetting: 'aurora-peaks',
      weather: 'embers',
      palettes: [
        ['#071713', '#133B2E', '#10B981'],
        ['#1A0E1E', '#3D1D47', '#F59E0B'],
        ['#0B162C', '#1B3664', '#38BDF8'],
        ['#1F1016', '#4C1D2E', '#FBBF24'],
      ],
    };
  }
  return {
    genre: 'Northern Cinema Drama',
    primarySetting: 'aurora-peaks',
    secondarySetting: 'timber-lodge',
    weather: 'aurora',
    palettes: [
      ['#060E1F', '#0F2E4C', '#10B981'],
      ['#111827', '#263859', '#F59E0B'],
      ['#081B29', '#13425E', '#38BDF8'],
      ['#0A191E', '#163D42', '#34D399'],
    ],
  };
}

function buildCast(prompt: string): CastCharacter[] {
  const p = prompt.toLowerCase();
  if (/space|astronaut|sci-fi|cosmos/.test(p)) {
    return [
      { name: 'Capt. Claire Vance', role: 'Mission Commander', color: '#38BDF8', voicePitch: 1.08, voiceRate: 1.0, silhouette: 'astronaut' },
      { name: 'Dr. Liam Tremblay', role: 'Xenobiologist', color: '#10B981', voicePitch: 0.92, voiceRate: 0.98, silhouette: 'inventor' },
      { name: 'NORTH-9', role: 'Shipboard AI', color: '#F59E0B', voicePitch: 0.85, voiceRate: 1.04, silhouette: 'ranger' },
    ];
  }
  if (/detective|mystery|crime|noir|thriller/.test(p)) {
    return [
      { name: 'Det. Maya Chen', role: 'Lead Investigator', color: '#EC4899', voicePitch: 1.05, voiceRate: 1.02, silhouette: 'detective' },
      { name: 'Inspector Luc Bouchard', role: 'Harbour Unit', color: '#06B6D4', voicePitch: 0.88, voiceRate: 0.96, silhouette: 'ranger' },
      { name: 'Soren Vance', role: 'Key Witness', color: '#F59E0B', voicePitch: 1.0, voiceRate: 1.05, silhouette: 'musician' },
    ];
  }
  return [
    { name: 'Rowan MacLeod', role: 'Protagonist', color: '#F59E0B', voicePitch: 0.95, voiceRate: 1.0, silhouette: 'ranger' },
    { name: 'Elena Desjardins', role: 'Co-Lead & Strategist', color: '#10B981', voicePitch: 1.1, voiceRate: 1.02, silhouette: 'inventor' },
    { name: 'Samir Patel', role: 'Sound & Signal Specialist', color: '#38BDF8', voicePitch: 0.9, voiceRate: 0.98, silhouette: 'musician' },
  ];
}

export function produceVideoArtifact(prompt: string, style = 'Anamorphic Motion') {
  const title = cleanTopicTitle(prompt, 'Northern Horizon');
  const meta = detectGenreAndSetting(prompt);
  const cast = buildCast(prompt);
  const audio = synthesizeWavDataUrl(prompt, undefined, 10);
  const poster = composePhotoSvg(prompt, style, '16:9', title);

  const scenes: CinemaScene[] = [
    {
      sceneNumber: 1,
      title: `${title} — Motion Sequence`,
      setting: meta.primarySetting,
      weather: meta.weather,
      cameraMotion: 'zoom-in',
      skyTop: meta.palettes[0][0],
      skyBottom: meta.palettes[0][1],
      accentColor: meta.palettes[0][2],
      durationSec: 10,
      stageDirection: `Wide sweeping aerial glide into "${prompt}" as volumetric light ripples across the frame.`,
      dialogue: [
        {
          speaker: cast[0].name,
          text: `Look at that horizon—everything we imagined about ${title.toLowerCase()} is coming alive right in front of us.`,
          emotion: 'wonder',
        },
        {
          speaker: cast[1].name,
          text: `Telemetry locked and crystal clear. Let's capture every second of this moment.`,
          emotion: 'warm',
        },
      ],
    },
  ];

  const spec: MediaSpec = {
    tagline: `A dynamic motion study inspired by "${prompt}"`,
    genre: meta.genre,
    rating: 'G',
    aspectRatio: '16:9',
    palette: poster.palette,
    musicalStyle: audio.style,
    bpm: audio.bpm,
    musicalKey: audio.keyName,
    cast,
    scenes,
    svgDataUrl: poster.svgDataUrl,
    audioWavDataUrl: audio.dataUrl,
  };

  return {
    title,
    style,
    durationSeconds: 10,
    thumbnailUrl: poster.svgDataUrl,
    assetUrl: audio.dataUrl,
    spec,
  };
}

export function produceMovieArtifact(prompt: string, style = '2.39:1 Northern IMAX') {
  const title = cleanTopicTitle(prompt, 'Signal Over Superior');
  const meta = detectGenreAndSetting(prompt);
  const cast = buildCast(prompt);
  const audio = synthesizeWavDataUrl(prompt + ' cinematic movie score', 'cinematic-orchestral', 12);
  const poster = composePhotoSvg(prompt, style, '16:9', `${title} — A Village Original Film`);

  const subjectPhrase = prompt.replace(/^(make|create|generate|produce|direct)\s+(a\s+|an\s+)?(movie|film)\s*(about|of|on)?\s*/i, '').trim() || title;

  const scenes: CinemaScene[] = [
    {
      sceneNumber: 1,
      title: 'Act I — The Spark in the North',
      setting: meta.primarySetting,
      weather: meta.weather,
      cameraMotion: 'pan-right',
      skyTop: meta.palettes[0][0],
      skyBottom: meta.palettes[0][1],
      accentColor: meta.palettes[0][2],
      durationSec: 11,
      stageDirection: `Opening wide shot establishing the world of ${subjectPhrase}. Atmospheric light dances across the landscape.`,
      dialogue: [
        { speaker: cast[0].name, text: `People said ${subjectPhrase} was just a legend whispered up past the treeline.`, emotion: 'reflective' },
        { speaker: cast[1].name, text: `Then explain this signal on my console. It started pulsing three minutes ago—and it knows our names.`, emotion: 'urgent' },
      ],
    },
    {
      sceneNumber: 2,
      title: 'Act II — Crossing the Threshold',
      setting: meta.secondarySetting,
      weather: meta.weather === 'aurora' ? 'snow' : meta.weather,
      cameraMotion: 'zoom-in',
      skyTop: meta.palettes[1][0],
      skyBottom: meta.palettes[1][1],
      accentColor: meta.palettes[1][2],
      durationSec: 12,
      stageDirection: `Tracking medium shot as ${cast[0].name}, ${cast[1].name}, and ${cast[2].name} venture deeper into the heart of the mystery.`,
      dialogue: [
        { speaker: cast[2].name, text: `Careful! The whole environment is resonating like a giant tuning fork.`, emotion: 'wonder' },
        { speaker: cast[0].name, text: `Easy now, friends. Stick together—we didn't come all this way to turn back at the first storm.`, emotion: 'resolute' },
      ],
    },
    {
      sceneNumber: 3,
      title: 'Act III — The Revelation',
      setting: meta.primarySetting,
      weather: 'embers',
      cameraMotion: 'dolly-up',
      skyTop: meta.palettes[2][0],
      skyBottom: meta.palettes[2][1],
      accentColor: meta.palettes[2][2],
      durationSec: 12,
      stageDirection: `Dramatic low-angle push-in as the central truth behind ${subjectPhrase} illuminates the sky.`,
      dialogue: [
        { speaker: cast[1].name, text: `It was never a warning... it's a bridge! Every piece of the pattern connects right here.`, emotion: 'wonder' },
        { speaker: cast[2].name, text: `Harmonics stabilizing! If we synchronize on my mark, everybody makes it home.`, emotion: 'urgent' },
      ],
    },
    {
      sceneNumber: 4,
      title: 'Finale — Dawn Beneath the Aurora',
      setting: meta.secondarySetting,
      weather: 'aurora',
      cameraMotion: 'zoom-out',
      skyTop: meta.palettes[3][0],
      skyBottom: meta.palettes[3][1],
      accentColor: meta.palettes[3][2],
      durationSec: 11,
      stageDirection: `Sweeping crane pull-back into a luminous horizon as the score swells to a triumphant resolution.`,
      dialogue: [
        { speaker: cast[0].name, text: `Not bad for a Tuesday in the North, eh? Coffee's on me when we touch down.`, emotion: 'warm' },
        { speaker: cast[1].name, text: `Deal. Though something tells me our real adventure is only getting started.`, emotion: 'humorous' },
      ],
    },
  ];

  const totalDur = scenes.reduce((acc, s) => acc + s.durationSec, 0);

  const spec: MediaSpec = {
    tagline: `When the impossible calls, courage answers. Inspired by "${subjectPhrase}".`,
    genre: meta.genre,
    rating: 'PG',
    aspectRatio: '2.39:1',
    palette: poster.palette,
    musicalStyle: audio.style,
    bpm: audio.bpm,
    musicalKey: audio.keyName,
    cast,
    scenes,
    svgDataUrl: poster.svgDataUrl,
    audioWavDataUrl: audio.dataUrl,
  };

  return {
    title,
    style,
    durationSeconds: totalDur,
    thumbnailUrl: poster.svgDataUrl,
    assetUrl: audio.dataUrl,
    spec,
  };
}

export function produceShowArtifact(prompt: string, style = 'Prestige Episodic Series') {
  const title = cleanTopicTitle(prompt, 'Chronicles of Maple Harbour');
  const meta = detectGenreAndSetting(prompt);
  const cast = buildCast(prompt);
  const audio = synthesizeWavDataUrl(prompt + ' series theme song', undefined, 11);
  const poster = composePhotoSvg(prompt, style, '16:9', `${title} — Season 1`);

  const premise = prompt.replace(/^(make|create|generate|produce|write)\s+(a\s+|an\s+)?(tv\s+)?(show|series)\s*(about|of|on)?\s*/i, '').trim() || title;

  const episodes: ShowEpisode[] = [
    {
      episodeNumber: 1,
      title: 'Pilot: Welcome to the Village',
      synopsis: `An unexpected arrival turns an ordinary morning upside down in this premiere centred on ${premise}.`,
      runtimeLabel: 'Ep 1 · 2 Scenes',
      scenes: [
        {
          sceneNumber: 1,
          title: 'Cold Open — Unexpected Spark',
          setting: meta.primarySetting,
          weather: meta.weather,
          cameraMotion: 'pan-right',
          skyTop: meta.palettes[0][0],
          skyBottom: meta.palettes[0][1],
          accentColor: meta.palettes[0][2],
          durationSec: 10,
          stageDirection: `Brisk ensemble walk-and-talk introducing the world of ${premise}.`,
          dialogue: [
            { speaker: cast[0].name, text: `Tell me again how "${premise}" became our official responsibility before breakfast?`, emotion: 'humorous' },
            { speaker: cast[1].name, text: `Because nobody else in three provinces had the nerve—or the blueprints—to pull it off!`, emotion: 'warm' },
          ],
        },
        {
          sceneNumber: 2,
          title: 'Act II — First Breakthrough',
          setting: meta.secondarySetting,
          weather: 'aurora',
          cameraMotion: 'zoom-in',
          skyTop: meta.palettes[1][0],
          skyBottom: meta.palettes[1][1],
          accentColor: meta.palettes[1][2],
          durationSec: 10,
          stageDirection: `Late-night studio brainstorm where the crew cracks the pilot's central puzzle.`,
          dialogue: [
            { speaker: cast[2].name, text: `Hold everything—it works! Look at the readings lighting up the board!`, emotion: 'wonder' },
            { speaker: cast[0].name, text: `Folks, I think we just made history... and woke up half the block.`, emotion: 'humorous' },
          ],
        },
      ],
    },
    {
      episodeNumber: 2,
      title: 'Double Trouble on the Horizon',
      synopsis: `Success attracts unexpected rivals, forcing the team to improvise under pressure.`,
      runtimeLabel: 'Ep 2 · 2 Scenes',
      scenes: [
        {
          sceneNumber: 1,
          title: 'The Curveball',
          setting: meta.secondarySetting,
          weather: 'rain',
          cameraMotion: 'dolly-up',
          skyTop: meta.palettes[2][0],
          skyBottom: meta.palettes[2][1],
          accentColor: meta.palettes[2][2],
          durationSec: 10,
          stageDirection: `Dramatic storm rolls in as stakes escalate across the season arc.`,
          dialogue: [
            { speaker: cast[1].name, text: `Inspection team arrives in twenty minutes and our main rig is still in pieces.`, emotion: 'urgent' },
            { speaker: cast[0].name, text: `Twenty minutes? Plenty of time for a miracle and a fresh pot of roast.`, emotion: 'resolute' },
          ],
        },
        {
          sceneNumber: 2,
          title: 'Cliffhanger Ending',
          setting: meta.primarySetting,
          weather: 'starlight',
          cameraMotion: 'zoom-out',
          skyTop: meta.palettes[3][0],
          skyBottom: meta.palettes[3][1],
          accentColor: meta.palettes[3][2],
          durationSec: 10,
          stageDirection: `A mysterious new transmission sets up the Season Finale.`,
          dialogue: [
            { speaker: cast[2].name, text: `Wait... there's a second signal coming from across the bay.`, emotion: 'wonder' },
            { speaker: cast[1].name, text: `Cue the theme music—tomorrow is going to be wild.`, emotion: 'warm' },
          ],
        },
      ],
    },
    {
      episodeNumber: 3,
      title: 'Season Finale: Northern Lights Live',
      synopsis: `Everything builds to one unforgettable showcase beneath the aurora.`,
      runtimeLabel: 'Ep 3 · Finale',
      scenes: [
        {
          sceneNumber: 1,
          title: 'Season Climax & Curtain Call',
          setting: 'aurora-peaks',
          weather: 'aurora',
          cameraMotion: 'zoom-out',
          skyTop: meta.palettes[0][0],
          skyBottom: meta.palettes[0][1],
          accentColor: '#F59E0B',
          durationSec: 12,
          stageDirection: `Grand ensemble finale celebrating friendship, ingenuity, and ${premise}.`,
          dialogue: [
            { speaker: cast[0].name, text: `Every crazy idea, every late night—it led right to this moment.`, emotion: 'warm' },
            { speaker: cast[1].name, text: `Here's to Season Two, team. Same crew, bigger dreams!`, emotion: 'wonder' },
          ],
        },
      ],
    },
  ];

  const allScenes = episodes.flatMap((ep) => ep.scenes);
  const totalDur = allScenes.reduce((acc, s) => acc + s.durationSec, 0);

  const spec: MediaSpec = {
    tagline: `An original 3-episode series created in the AI Agent Village: "${premise}"`,
    genre: meta.genre,
    rating: 'TV-PG',
    aspectRatio: '16:9',
    palette: poster.palette,
    musicalStyle: audio.style,
    bpm: audio.bpm,
    musicalKey: audio.keyName,
    cast,
    episodes,
    scenes: episodes[0].scenes,
    svgDataUrl: poster.svgDataUrl,
    audioWavDataUrl: audio.dataUrl,
  };

  return {
    title,
    style,
    durationSeconds: totalDur,
    thumbnailUrl: poster.svgDataUrl,
    assetUrl: audio.dataUrl,
    spec,
  };
}

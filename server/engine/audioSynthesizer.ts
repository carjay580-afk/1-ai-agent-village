import type { MediaSpec } from '../../shared/types.js';

export type MusicalStyle = NonNullable<MediaSpec['musicalStyle']>;

function hashPrompt(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function inferMusicalStyle(prompt: string): MusicalStyle {
  const p = prompt.toLowerCase();
  if (/cyber|synth|neon|retro|techno|electronic|beat|club|future/.test(p)) return 'cyber-synthwave';
  if (/epic|movie|cinema|orchestra|hero|battle|thriller|space|drama|trailer/.test(p)) return 'cinematic-orchestral';
  if (/folk|acoustic|guitar|cabin|campfire|country|maple|banff|forest|warm/.test(p)) return 'cozy-folk';
  if (/lofi|lo-fi|study|chill|jazz|coffee|rain|relax/.test(p)) return 'lofi-chill';
  return 'aurora-ambient';
}

/**
 * Generates a genuine 16-bit PCM mono WAV audio buffer encoded as a base64 data URL.
 * Produces rich harmonic progressions, melodies, bass, and subtle percussion.
 */
export function synthesizeWavDataUrl(
  prompt: string,
  styleInput?: MusicalStyle,
  durationSeconds = 8
): { dataUrl: string; style: MusicalStyle; bpm: number; keyName: string; duration: number } {
  const style = styleInput || inferMusicalStyle(prompt);
  const seed = hashPrompt(prompt + style);
  const sampleRate = 16000;
  const duration = Math.max(4, Math.min(14, durationSeconds));
  const numSamples = Math.floor(sampleRate * duration);

  const rootFreqs = [
    { name: 'D Dorian', root: 146.83, scale: [0, 2, 3, 5, 7, 9, 10, 12] },
    { name: 'F Lydian', root: 174.61, scale: [0, 2, 4, 6, 7, 9, 11, 12] },
    { name: 'A Minor', root: 220.0, scale: [0, 2, 3, 5, 7, 8, 10, 12] },
    { name: 'C Major', root: 130.81, scale: [0, 2, 4, 5, 7, 9, 11, 12] },
    { name: 'E Minor', root: 164.81, scale: [0, 2, 3, 5, 7, 8, 10, 12] },
  ];
  const chosenKey = rootFreqs[seed % rootFreqs.length];

  const bpmMap: Record<MusicalStyle, number> = {
    'aurora-ambient': 72,
    'cinematic-orchestral': 92,
    'cozy-folk': 98,
    'cyber-synthwave': 116,
    'lofi-chill': 82,
  };
  const bpm = bpmMap[style] + ((seed % 7) - 3);
  const beatDur = 60 / bpm;

  const semiToFreq = (base: number, semis: number) => base * Math.pow(2, semis / 12);

  // 4-chord progression degrees in scale
  const progressions = [
    [0, 5, 3, 4],
    [0, 3, 5, 4],
    [0, 4, 5, 3],
    [0, 2, 5, 4],
  ];
  const prog = progressions[(seed >>> 3) % progressions.length];

  const pcm = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = t / beatDur;
    const barIndex = Math.floor(beatPos / 4) % prog.length;
    const beatInBar = beatPos % 4;
    const subStep = Math.floor(beatPos * 2);

    const deg = prog[barIndex];
    const chordRoot = semiToFreq(chosenKey.root, chosenKey.scale[deg % chosenKey.scale.length]);
    const chordThird = semiToFreq(chosenKey.root, chosenKey.scale[(deg + 2) % chosenKey.scale.length]);
    const chordFifth = semiToFreq(chosenKey.root, chosenKey.scale[(deg + 4) % chosenKey.scale.length]);

    let sample = 0;

    // 1. Lush harmonic pad / strings
    const padSwell = 0.55 + 0.45 * Math.sin((Math.PI * (beatInBar % 4)) / 4);
    const padWave =
      Math.sin(2 * Math.PI * chordRoot * t) * 0.4 +
      Math.sin(2 * Math.PI * (chordThird * 1.002) * t) * 0.3 +
      Math.sin(2 * Math.PI * (chordFifth * 0.998) * t) * 0.3;
    sample += padWave * padSwell * (style === 'cyber-synthwave' ? 0.22 : 0.32);

    // 2. Warm sub-bass
    const bassFreq = chordRoot * 0.5;
    const bassEnv = style === 'cyber-synthwave'
      ? Math.exp(-((beatPos * 2) % 1) * 4.5)
      : 0.75 + 0.25 * Math.cos(Math.PI * (beatInBar / 2));
    sample += Math.sin(2 * Math.PI * bassFreq * t + 0.3 * Math.sin(2 * Math.PI * bassFreq * 2 * t)) * 0.28 * bassEnv;

    // 3. Melodic arpeggio / lead motif
    const arpIdx = (subStep + (seed % 5)) % chosenKey.scale.length;
    const arpFreq = semiToFreq(chosenKey.root * 2, chosenKey.scale[arpIdx]);
    const notePhase = (beatPos * 2) % 1;
    const noteEnv = Math.exp(-notePhase * (style === 'aurora-ambient' ? 2.6 : 5.2));
    const timbre =
      style === 'cozy-folk'
        ? Math.sin(2 * Math.PI * arpFreq * t) + 0.45 * Math.sin(2 * Math.PI * arpFreq * 2 * t) * Math.exp(-notePhase * 8)
        : style === 'cyber-synthwave'
          ? Math.tanh(1.8 * Math.sin(2 * Math.PI * arpFreq * t))
          : Math.sin(2 * Math.PI * arpFreq * t) + 0.25 * Math.sin(2 * Math.PI * arpFreq * 3 * t);
    sample += timbre * noteEnv * 0.22;

    // 4. Gentle rhythm / percussion for beat-driven styles
    if (style === 'cyber-synthwave' || style === 'lofi-chill' || style === 'cinematic-orchestral') {
      const beatFrac = beatPos % 1;
      // Soft kick on beats 0 and 2
      if (Math.floor(beatInBar) % 2 === 0 && beatFrac < 0.18) {
        const kickFreq = 115 * Math.exp(-beatFrac * 24) + 42;
        sample += Math.sin(2 * Math.PI * kickFreq * t) * Math.exp(-beatFrac * 18) * 0.32;
      }
      // Crisp brush/hat on offbeats
      if (style !== 'cinematic-orchestral' && ((beatPos * 2) % 1) < 0.08) {
        const noise = ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1) * 2 - 1;
        sample += noise * Math.exp(-((beatPos * 2) % 1) * 40) * 0.07;
      }
    }

    // Smooth master fade-in & fade-out envelope
    const fadeIn = Math.min(1, t / 0.45);
    const fadeOut = Math.min(1, (duration - t) / 0.75);
    const clamped = Math.max(-0.96, Math.min(0.96, sample * fadeIn * fadeOut));
    pcm[i] = Math.floor(clamped * 32767);
  }

  // Construct 44-byte RIFF WAV header
  const dataByteLen = pcm.length * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataByteLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20);  // Audio format 1 = PCM
  header.writeUInt16LE(1, 22);  // Mono = 1 channel
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  header.writeUInt16LE(2, 32);  // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataByteLen, 40);

  const pcmBuf = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const wavBuf = Buffer.concat([header, pcmBuf]);

  return {
    dataUrl: `data:audio/wav;base64,${wavBuf.toString('base64')}`,
    style,
    bpm,
    keyName: chosenKey.name,
    duration,
  };
}

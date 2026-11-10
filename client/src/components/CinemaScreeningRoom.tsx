import React, { useEffect, useRef, useState } from 'react';
import {
  Clapperboard,
  Download,
  FileText,
  Film,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CinemaScene, MediaArtifact } from '@shared/types';

interface Props {
  artifact: MediaArtifact;
  compact?: boolean;
}

export const CinemaScreeningRoom: React.FC<Props> = ({ artifact, compact = false }) => {
  const episodes = artifact.spec.episodes || [];
  const [episodeIdx, setEpisodeIdx] = useState(0);

  const activeScenes: CinemaScene[] =
    artifact.media_type === 'show' && episodes[episodeIdx]
      ? episodes[episodeIdx].scenes
      : artifact.spec.scenes || [];

  const [sceneIdx, setSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showScript, setShowScript] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenKeyRef = useRef<string>('');

  const currentScene = activeScenes[sceneIdx] || activeScenes[0];
  const cast = artifact.spec.cast || [];

  // Reset scene index if episode changes
  useEffect(() => {
    setSceneIdx(0);
    setSceneProgress(0);
    setActiveLineIdx(0);
  }, [episodeIdx, artifact.id]);

  // Speak character lines using Canadian English voice when playing
  useEffect(() => {
    if (!isPlaying || !voiceEnabled || !currentScene) return;
    const line = currentScene.dialogue[activeLineIdx];
    if (!line) return;

    const spokenKey = `${artifact.id}-${episodeIdx}-${sceneIdx}-${activeLineIdx}`;
    if (lastSpokenKeyRef.current === spokenKey) return;
    lastSpokenKeyRef.current = spokenKey;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(line.text);
      const voices = window.speechSynthesis.getVoices();
      const caVoice =
        voices.find((v) => v.lang.toLowerCase() === 'en-ca') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (caVoice) utter.voice = caVoice;
      utter.lang = 'en-CA';

      const member = cast.find((c) => c.name === line.speaker);
      utter.pitch = member?.voicePitch || 1.0;
      utter.rate = member?.voiceRate || 1.0;
      utter.volume = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }, [isPlaying, voiceEnabled, episodeIdx, sceneIdx, activeLineIdx, artifact.id, currentScene, cast]);

  // Control background WAV score playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Scene progression timer
  useEffect(() => {
    if (!isPlaying || !currentScene) return;
    const durationMs = (currentScene.durationSec || 10) * 1000;
    const tickMs = 80;

    const timer = setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + tickMs / durationMs;
        if (next >= 1) {
          if (sceneIdx + 1 < activeScenes.length) {
            setSceneIdx((s) => s + 1);
            setActiveLineIdx(0);
            return 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        const lineCount = Math.max(1, currentScene.dialogue.length);
        const computedIdx = Math.min(lineCount - 1, Math.floor(next * lineCount));
        setActiveLineIdx(computedIdx);
        return next;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isPlaying, sceneIdx, activeScenes.length, currentScene]);

  // 60fps Animated Cinematography Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentScene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const startClock = performance.now();

    const renderFrame = (now: number) => {
      const elapsed = (now - startClock) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Subtle camera movement transform
      const camZoom =
        currentScene.cameraMotion === 'zoom-in'
          ? 1 + sceneProgress * 0.08
          : currentScene.cameraMotion === 'zoom-out'
            ? 1.08 - sceneProgress * 0.07
            : 1.03;
      const camPanX =
        currentScene.cameraMotion === 'pan-right' ? (sceneProgress - 0.5) * -28 : 0;
      const camPanY =
        currentScene.cameraMotion === 'dolly-up' ? (0.5 - sceneProgress) * 16 : 0;

      ctx.translate(w / 2 + camPanX, h / 2 + camPanY);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-w / 2, -h / 2);

      // 1. Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
      sky.addColorStop(0, currentScene.skyTop || '#060E1F');
      sky.addColorStop(1, currentScene.skyBottom || '#123556');
      ctx.fillStyle = sky;
      ctx.fillRect(-40, -40, w + 80, h + 80);

      // 2. Twinkling stars
      for (let s = 0; s < 48; s++) {
        const sx = ((s * 173 + sceneIdx * 59) % w);
        const sy = ((s * 97 + 23) % Math.floor(h * 0.55));
        const twinkle = 0.35 + 0.55 * Math.abs(Math.sin(elapsed * 1.8 + s));
        ctx.fillStyle = `rgba(255,255,255,${twinkle.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, (s % 2) + 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Flowing Aurora Borealis / Cosmic Light Ribbons
      for (let band = 0; band < 3; band++) {
        ctx.beginPath();
        ctx.moveTo(-40, h * (0.2 + band * 0.06));
        for (let x = 0; x <= w + 40; x += 40) {
          const wave = Math.sin(x * 0.008 + elapsed * (0.9 + band * 0.25) + band) * 26;
          ctx.lineTo(x, h * (0.18 + band * 0.07) + wave);
        }
        ctx.strokeStyle = band % 2 === 0 ? currentScene.accentColor : '#38BDF8';
        ctx.globalAlpha = 0.2 - band * 0.04;
        ctx.lineWidth = 34 - band * 8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const horizonY = h * 0.68;

      // 4. Setting Architecture / Mountains / Cityscape / Planet
      if (currentScene.setting === 'neon-metropolis') {
        for (let b = 0; b < 22; b++) {
          const bw = w / 20;
          const bh = 55 + ((b * 47 + sceneIdx * 31) % 135);
          const bx = b * bw - 10;
          ctx.fillStyle = '#070C18';
          ctx.fillRect(bx, horizonY - bh, bw - 3, bh);
          ctx.fillStyle = b % 2 === 0 ? currentScene.accentColor : '#38BDF8';
          ctx.globalAlpha = 0.35;
          for (let wy = horizonY - bh + 10; wy < horizonY - 10; wy += 14) {
            ctx.fillRect(bx + 6, wy, Math.max(6, bw - 16), 3);
          }
          ctx.globalAlpha = 1;
        }
      } else if (currentScene.setting === 'deep-cosmos') {
        const px = w * 0.72;
        const py = h * 0.32;
        const grad = ctx.createRadialGradient(px - 18, py - 18, 8, px, py, 68);
        grad.addColorStop(0, currentScene.accentColor);
        grad.addColorStop(1, '#050814');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 68, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(px, py, 122, 24, -0.28, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Canadian Alpine Peaks + Timber Geodesic Lodge
        ctx.fillStyle = '#0B192E';
        ctx.beginPath();
        ctx.moveTo(-30, horizonY);
        for (let m = 0; m <= 8; m++) {
          const mx = (w / 8) * m;
          const my = horizonY - (m % 2 === 0 ? 35 : 95 + ((m * 29 + sceneIdx * 17) % 45));
          ctx.lineTo(mx, my);
        }
        ctx.lineTo(w + 30, horizonY);
        ctx.closePath();
        ctx.fill();

        if (currentScene.setting === 'timber-lodge') {
          // Warm glowing geodesic lodge
          ctx.fillStyle = '#17253B';
          ctx.beginPath();
          ctx.arc(w * 0.24, horizonY, 54, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.78)';
          ctx.fillRect(w * 0.24 - 22, horizonY - 26, 44, 18);
        }
      }

      // 5. Reflective Foreground Ground / Lake
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h + 30);
      groundGrad.addColorStop(0, '#091426');
      groundGrad.addColorStop(1, '#04070F');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-40, horizonY, w + 80, h - horizonY + 40);

      // 6. Cast Blocking & Speaking Indicator
      const activeLine = currentScene.dialogue[activeLineIdx];
      const stageMembers = cast.slice(0, 3);
      stageMembers.forEach((member, idx) => {
        const cx = w * (0.32 + idx * 0.18);
        const isSpeaking = isPlaying && activeLine?.speaker === member.name;
        const bob = isSpeaking ? Math.sin(elapsed * 11) * 3 : Math.sin(elapsed * 2 + idx) * 1.2;
        const cy = horizonY + 26 + bob;

        if (isSpeaking) {
          ctx.fillStyle = member.color;
          ctx.globalAlpha = 0.24;
          ctx.beginPath();
          ctx.arc(cx, cy - 26, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Character silhouette & collar accent
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = isSpeaking ? member.color : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = isSpeaking ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 16, cy - 20, 32, 42, 10);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy - 33, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 7. Weather Particles (Snow / Rain / Embers)
      for (let p = 0; p < 34; p++) {
        const px = ((p * 89 + elapsed * (currentScene.weather === 'rain' ? 95 : 28)) % (w + 40)) - 20;
        const py = ((p * 67 + elapsed * (currentScene.weather === 'embers' ? -40 : currentScene.weather === 'rain' ? 240 : 48)) % h + h) % h;
        if (currentScene.weather === 'rain') {
          ctx.strokeStyle = 'rgba(186,230,253,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 4, py + 11);
          ctx.stroke();
        } else {
          ctx.fillStyle = currentScene.weather === 'embers' ? 'rgba(251,191,36,0.65)' : 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(px, py, currentScene.weather === 'embers' ? 2 : 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // 8. Anamorphic Letterbox Bars & Cinema Subtitle Overlay
      const barH = compact ? 18 : 26;
      ctx.fillStyle = '#02040A';
      ctx.fillRect(0, 0, w, barH);
      ctx.fillRect(0, h - barH, w, barH);

      if (activeLine) {
        const subText = `${activeLine.speaker}: "${activeLine.text}"`;
        ctx.font = compact ? '600 12px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
        const maxSubW = w - 64;
        const words = subText.split(' ');
        const lines: string[] = [];
        let cur = '';
        for (const wd of words) {
          const test = cur ? `${cur} ${wd}` : wd;
          if (ctx.measureText(test).width > maxSubW) {
            lines.push(cur);
            cur = wd;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);

        const boxH = lines.length * 20 + 16;
        const boxY = h - barH - boxH - 12;
        ctx.fillStyle = 'rgba(4, 8, 18, 0.78)';
        ctx.beginPath();
        ctx.roundRect(32, boxY, w - 64, boxH, 10);
        ctx.fill();

        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        lines.forEach((ln, i) => {
          ctx.fillText(ln, w / 2, boxY + 22 + i * 20);
        });
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [currentScene, sceneProgress, activeLineIdx, isPlaying, cast, sceneIdx, compact]);

  const handleRestart = () => {
    lastSpokenKeyRef.current = '';
    setSceneIdx(0);
    setSceneProgress(0);
    setActiveLineIdx(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(true);
  };

  const handleExportWebm = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') return;
    try {
      setIsRecording(true);
      handleRestart();
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 6000);
    } catch {
      setIsRecording(false);
    }
  };

  const TypeIcon = artifact.media_type === 'movie' ? Film : artifact.media_type === 'show' ? Tv : Clapperboard;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1221] overflow-hidden shadow-2xl">
      {/* Top Theater Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/8 bg-[#080E1B]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <TypeIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-white truncate">{artifact.title}</h4>
              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {artifact.media_type}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {artifact.spec.genre || artifact.style} · Directed by {artifact.created_by_agent}
            </p>
          </div>
        </div>

        {/* Episode Selector for Shows */}
        {artifact.media_type === 'show' && episodes.length > 0 && (
          <div className="flex items-center gap-1.5">
            {episodes.map((ep, idx) => (
              <button
                key={ep.episodeNumber}
                onClick={() => {
                  setEpisodeIdx(idx);
                  setIsPlaying(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  episodeIdx === idx
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Ep {ep.episodeNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Widescreen 16:9 Cinema Canvas */}
      <div className="relative bg-black aspect-video w-full">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full block object-cover"
        />

        {!isPlaying && (
          <button
            onClick={() => {
              if (sceneProgress >= 0.99) handleRestart();
              else setIsPlaying(true);
            }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/45 hover:bg-slate-950/30 transition group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition">
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </div>
            <span className="mt-2.5 px-3 py-1 rounded-full bg-slate-950/85 border border-white/15 text-xs font-medium text-slate-200">
              {sceneProgress > 0 && sceneProgress < 0.99
                ? 'Resume Screening'
                : `Play ${artifact.media_type === 'movie' ? '4-Act Movie' : artifact.media_type === 'show' ? `Episode ${episodeIdx + 1}` : 'Motion Video'}`}
            </span>
          </button>
        )}

        {/* Scene Badge */}
        {currentScene && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/75 border border-white/10 text-[11px] text-slate-200 flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>
              Scene {sceneIdx + 1}/{activeScenes.length}: {currentScene.title}
            </span>
          </div>
        )}
      </div>

      {artifact.spec.audioWavDataUrl && (
        <audio ref={audioRef} src={artifact.spec.audioWavDataUrl} loop preload="auto" />
      )}

      {/* Scene Timeline Progress & Controls */}
      <div className="px-4 py-3 bg-[#090F1D] space-y-2.5">
        <div className="flex gap-1.5">
          {activeScenes.map((sc, idx) => {
            const fill = idx < sceneIdx ? 100 : idx === sceneIdx ? Math.round(sceneProgress * 100) : 0;
            return (
              <button
                key={idx}
                onClick={() => {
                  lastSpokenKeyRef.current = '';
                  setSceneIdx(idx);
                  setSceneProgress(0);
                  setActiveLineIdx(0);
                }}
                title={sc.title}
                className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden cursor-pointer"
              >
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-100"
                  style={{ width: `${fill}%` }}
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition cursor-pointer"
              title="Restart from Scene 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay
            </button>

            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                voiceEnabled ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-slate-400'
              }`}
              title="Toggle Character Voice Acting (en-CA)"
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Voices {voiceEnabled ? 'On' : 'Muted'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScript((s) => !s)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              {showScript ? 'Hide Script' : 'Screenplay'}
            </button>

            <button
              onClick={handleExportWebm}
              disabled={isRecording}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs border border-white/10 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              {isRecording ? 'Recording 6s WebM...' : 'Export .webm'}
            </button>
          </div>
        </div>

        {/* Expandable Screenplay & Cast Bible */}
        {showScript && (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs space-y-3 max-h-60 overflow-y-auto">
            {artifact.spec.tagline && (
              <p className="italic text-amber-300/90">"{artifact.spec.tagline}"</p>
            )}
            <div className="flex flex-wrap gap-2">
              {cast.map((c) => (
                <span
                  key={c.name}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
                >
                  <strong style={{ color: c.color }}>{c.name}</strong> · {c.role}
                </span>
              ))}
            </div>
            {activeScenes.map((sc) => (
              <div key={sc.sceneNumber} className="space-y-1 border-t border-white/8 pt-2">
                <div className="font-semibold text-emerald-300">
                  SCENE {sc.sceneNumber}: {sc.title.toUpperCase()}
                </div>
                <div className="text-slate-400 italic">{sc.stageDirection}</div>
                {sc.dialogue.map((dl, i) => (
                  <div key={i} className="pl-3 text-slate-200">
                    <span className="font-semibold text-cyan-300">{dl.speaker}:</span> "{dl.text}"
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

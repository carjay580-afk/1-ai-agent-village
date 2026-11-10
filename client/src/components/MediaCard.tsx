import React from 'react';
import { Download, Image as ImageIcon, Music } from 'lucide-react';
import type { MediaArtifact } from '@shared/types';
import { CinemaScreeningRoom } from './CinemaScreeningRoom';

interface Props {
  artifact: MediaArtifact;
  compact?: boolean;
}

export const MediaCard: React.FC<Props> = ({ artifact, compact = false }) => {
  if (artifact.media_type === 'video' || artifact.media_type === 'movie' || artifact.media_type === 'show') {
    return <CinemaScreeningRoom artifact={artifact} compact={compact} />;
  }

  const handleDownloadPng = () => {
    const src = artifact.spec.svgDataUrl || artifact.thumbnail_url;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        a.click();
      }
    };
    img.src = src;
  };

  if (artifact.media_type === 'photo') {
    const imgSrc = artifact.spec.svgDataUrl || artifact.thumbnail_url || '';
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B1221] overflow-hidden shadow-xl">
        <div className="relative group">
          <img
            src={imgSrc}
            alt={artifact.title}
            className="w-full aspect-video object-cover block"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/75 border border-white/10 text-[11px] text-emerald-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo · {artifact.style}</span>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-white truncate">{artifact.title}</h4>
            <p className="text-xs text-slate-400 truncate">By {artifact.created_by_agent}</p>
          </div>
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export PNG
          </button>
        </div>
      </div>
    );
  }

  // Audio / Music Artifact Card
  const wavSrc = artifact.spec.audioWavDataUrl || artifact.asset_url || '';
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1221] p-4 shadow-xl space-y-3">
      <div className="flex items-center gap-3.5">
        {artifact.thumbnail_url ? (
          <img
            src={artifact.thumbnail_url}
            alt={artifact.title}
            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
            <Music className="w-7 h-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-white truncate">{artifact.title}</h4>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px]">
              WAV 16-bit
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {artifact.style} · {artifact.spec.bpm || 84} BPM · {artifact.spec.musicalKey || 'D Dorian'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Composed by {artifact.created_by_agent}</p>
        </div>
        {wavSrc && (
          <a
            href={wavSrc}
            download={`${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.wav`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs transition shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            .wav
          </a>
        )}
      </div>

      {wavSrc && (
        <audio controls src={wavSrc} className="w-full h-9 rounded-lg" />
      )}
    </div>
  );
};

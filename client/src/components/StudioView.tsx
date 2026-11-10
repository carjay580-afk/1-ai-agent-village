import React, { useState } from 'react';
import { Clapperboard, Film, Image as ImageIcon, Music, Sparkles, Tv } from 'lucide-react';
import type { MediaArtifact, MediaType } from '@shared/types';
import { MediaCard } from './MediaCard';

interface Props {
  artifacts: MediaArtifact[];
  onGenerateMedia: (mediaType: MediaType, prompt: string, style?: string) => Promise<MediaArtifact | null>;
}

const STYLE_PRESETS: Record<MediaType, string[]> = {
  photo: ['Northern Aurora Cinema', 'Algonquin Sunset Oil', 'Cyberpunk Toronto Neon', 'Maritime Misty Harbour'],
  audio: ['Aurora Ambient Score', 'Cinematic Orchestral', 'Cyber Synthwave', 'Cozy Acoustic Folk', 'Lo-Fi Study Chill'],
  video: ['Anamorphic Motion', 'Aerial Drone Sweep', 'Neo-Noir Rain Sequence', 'Cosmic Orbit Drift'],
  movie: ['2.39:1 Northern IMAX', 'Sci-Fi Featurette', 'Neo-Noir Mystery Film', 'Heartfelt Adventure Cinema'],
  show: ['Prestige Episodic Series', 'Cozy Canadian Comedy-Drama', 'Sci-Fi Anthology Series', 'Harbour Detective Show'],
};

const PLACEHOLDERS: Record<MediaType, string> = {
  photo: 'Describe the photo or artwork to compose (e.g., Golden sunset over Banff peaks reflecting on Moraine Lake)...',
  audio: 'Describe the music, beat, or soundscape to synthesize (e.g., Driving neon synthwave for a late-night code sprint)...',
  video: 'Describe the animated motion video scene (e.g., Sweeping glide over a snow-dusted futuristic Montreal skyline)...',
  movie: 'Describe the 4-act movie plot, characters & setting (e.g., A Canadian bush pilot and scientist discover a time rift in Yukon)...',
  show: 'Describe your 3-episode TV / web series premise (e.g., Three quirky inventors running a robot bakery in Halifax)...',
};

export const StudioView: React.FC<Props> = ({ artifacts, onGenerateMedia }) => {
  const [selectedType, setSelectedType] = useState<MediaType>('movie');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(STYLE_PRESETS.movie[0]);
  const [creating, setCreating] = useState(false);

  const handleSelectCreatorType = (t: MediaType) => {
    setSelectedType(t);
    setStyle(STYLE_PRESETS[t][0]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || creating) return;
    setCreating(true);
    try {
      const created = await onGenerateMedia(selectedType, prompt.trim(), style);
      if (created) {
        setPrompt('');
        setFilterType('all');
      }
    } finally {
      setCreating(false);
    }
  };

  const filtered = filterType === 'all' ? artifacts : artifacts.filter((a) => a.media_type === filterType);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Studio Creator Console */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1629] to-[#080E1C] p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Creative Multimedia & Cinema Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate downloadable PNG photos, 16-bit WAV music scores, WebM motion videos, 4-act movies, and 3-episode shows.
            </p>
          </div>
        </div>

        {/* 5 Media Engine Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              { id: 'photo', label: 'Photos & Art', icon: ImageIcon },
              { id: 'audio', label: 'Audio & Music', icon: Music },
              { id: 'video', label: 'Motion Video', icon: Clapperboard },
              { id: 'movie', label: '4-Act Movies', icon: Film },
              { id: 'show', label: 'TV / Web Shows', icon: Tv },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectCreatorType(tab.id)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Prompt & Style Form */}
        <form onSubmit={handleCreate} className="space-y-3">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PLACEHOLDERS[selectedType]}
            className="w-full rounded-xl bg-[#060A14] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Style Direction:</span>
              {STYLE_PRESETS[selectedType].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStyle(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    style === st
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={creating || !prompt.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg transition cursor-pointer disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              {creating ? 'Producing in Studio...' : `Generate ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
            </button>
          </div>
        </form>
      </div>

      {/* Gallery Filter Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'movie', 'show', 'video', 'photo', 'audio'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                filterType === f
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? `All Creations (${artifacts.length})` : `${f}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Creations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((art) => (
          <MediaCard key={art.id} artifact={art} />
        ))}
      </div>
    </div>
  );
};

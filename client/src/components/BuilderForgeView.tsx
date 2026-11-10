import React, { useEffect, useState } from 'react';
import { Code2, Download, Eye, Hammer, Sparkles } from 'lucide-react';
import type { BuilderCreation } from '@shared/types';

interface Props {
  creations: BuilderCreation[];
  selectedCreation: BuilderCreation | null;
  onSelectCreation: (c: BuilderCreation) => void;
  onForgeApp: (prompt: string) => Promise<BuilderCreation | null>;
}

const FORGE_IDEAS = [
  'Build an interactive Aurora Orb catching arcade game',
  'Build a CAD compound savings & mortgage planner calculator',
  'Build a product launch milestone & sprint tracker dashboard',
  'Build a daily habit & focus ritual board',
];

export const BuilderForgeView: React.FC<Props> = ({
  creations,
  selectedCreation,
  onSelectCreation,
  onForgeApp,
}) => {
  const [prompt, setPrompt] = useState('');
  const [forging, setForging] = useState(false);
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [fileIdx, setFileIdx] = useState(0);

  const active = selectedCreation || creations[0] || null;

  useEffect(() => {
    setFileIdx(0);
  }, [active?.id]);

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || forging) return;
    setForging(true);
    try {
      const built = await onForgeApp(prompt.trim());
      if (built) {
        onSelectCreation(built);
        setPrompt('');
        setTab('preview');
      }
    } finally {
      setForging(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!active) return;
    const blob = new Blob([active.preview_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Forge Input Console */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1629] to-[#080E1B] p-6 space-y-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Hammer className="w-5 h-5 text-emerald-400" />
            Builder Forge — Instant Apps, Games, Calculators & Schemas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Powered by Builder MacKenzie & Commander North. Every build is sandboxed live and verified via DBT-001 lifecycle checks.
          </p>
        </div>

        <form onSubmit={handleForge} className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe any web app, calculator, game, tracker, or tool to build..."
            className="flex-1 rounded-xl bg-[#060A14] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={forging || !prompt.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            {forging ? 'Forging App...' : 'Forge Application'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {FORGE_IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setPrompt(idea)}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition cursor-pointer"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left List of Forged Builds */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Forged Applications ({creations.length})
          </h3>
          <div className="space-y-2">
            {creations.map((c) => {
              const isSelected = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCreation(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                      : 'bg-[#0B1221] border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="font-semibold text-sm truncate">{c.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 capitalize">{c.blueprint_type}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Live Preview & Code Inspector */}
        {active && (
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#0B1221] overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10 bg-[#080E1B] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm text-white">{active.title}</h4>
                <p className="text-xs text-slate-400">{active.summary}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab('preview')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    tab === 'preview' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live App
                </button>
                <button
                  onClick={() => setTab('code')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    tab === 'code' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Source ({active.files.length})
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Download .html
                </button>
              </div>
            </div>

            {tab === 'preview' ? (
              <iframe
                title={active.title}
                srcDoc={active.preview_html}
                sandbox="allow-scripts"
                className="w-full h-[480px] border-0 bg-[#080D1A]"
              />
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  {active.files.map((f, idx) => (
                    <button
                      key={f.name}
                      onClick={() => setFileIdx(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                        fileIdx === idx ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <pre className="p-4 rounded-xl bg-[#050811] border border-white/10 text-xs font-mono text-slate-200 overflow-auto max-h-[420px]">
                  {active.files[fileIdx]?.content || ''}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

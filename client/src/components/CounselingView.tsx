import React, { useEffect, useState } from 'react';
import { HeartHandshake, PhoneCall, Sparkles, Wind } from 'lucide-react';
import type { CounselingReflection } from '@shared/types';

interface Props {
  reflections: CounselingReflection[];
  onSubmitReflection: (input: {
    moodLabel: string;
    moodScore: number;
    energyScore: number;
    userThought: string;
  }) => Promise<CounselingReflection | null>;
}

const MOOD_LABELS = [
  'Grounded & Calm',
  'Stressed / Stretched',
  'Anxious / Racing Mind',
  'Low / Heavy-Hearted',
  'Hopeful & Curious',
  'Reflective',
];

export const CounselingView: React.FC<Props> = ({ reflections, onSubmitReflection }) => {
  const [moodLabel, setMoodLabel] = useState(MOOD_LABELS[0]);
  const [moodScore, setMoodScore] = useState(7);
  const [energyScore, setEnergyScore] = useState(6);
  const [userThought, setUserThought] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Interactive Box Breathing Pacer State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale (4s)' | 'Hold (4s)' | 'Exhale (4s)' | 'Rest (4s)'>('Inhale (4s)');
  const [phaseSec, setPhaseSec] = useState(4);

  useEffect(() => {
    if (!breathingActive) return;
    const phases: Array<'Inhale (4s)' | 'Hold (4s)' | 'Exhale (4s)' | 'Rest (4s)'> = [
      'Inhale (4s)',
      'Hold (4s)',
      'Exhale (4s)',
      'Rest (4s)',
    ];
    let tick = 0;
    const id = setInterval(() => {
      tick = (tick + 1) % 16;
      const pIdx = Math.floor(tick / 4);
      setBreathPhase(phases[pIdx]);
      setPhaseSec(4 - (tick % 4));
    }, 1000);
    return () => clearInterval(id);
  }, [breathingActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userThought.trim() || submitting) return;
    setSubmitting(true);
    try {
      const saved = await onSubmitReflection({
        moodLabel,
        moodScore,
        energyScore,
        userThought: userThought.trim(),
      });
      if (saved) setUserThought('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Sanctuary Header + Crisis Care Banner */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-[#0B1C20] via-[#0D1A2B] to-[#0B1424] p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            Counseling & Wellness Sanctuary · Counselor Cedar & Commander North
          </div>
          <h2 className="text-xl font-bold text-white">
            A calm, confidential space to talk things through, reframe stress, and reset.
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Grounded in active listening, cognitive-behavioural reframing, and gentle daily pacing.
          </p>
        </div>

        <div className="rounded-xl bg-slate-950/70 border border-white/10 px-4 py-3 text-xs text-slate-300 max-w-xs">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-0.5">
            <PhoneCall className="w-3.5 h-3.5" />
            24/7 Care Note (Canada & US)
          </div>
          AI reflection complements—never replaces—licensed care. In crisis, call or text{' '}
          <strong className="text-white">988</strong> (bilingual EN/FR Suicide Crisis Helpline).
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in & Cognitive Reframing Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0C1425] p-6 space-y-4 shadow-xl"
        >
          <h3 className="font-semibold text-base text-white">
            Share What’s on Your Mind
          </h3>

          <div className="flex flex-wrap gap-2">
            {MOOD_LABELS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoodLabel(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  moodLabel === m
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/8">
              <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Mood Level</span>
                <strong className="text-emerald-300">{moodScore} / 10</strong>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/8">
              <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                <span>Energy Bandwidth</span>
                <strong className="text-cyan-300">{energyScore} / 10</strong>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={energyScore}
                onChange={(e) => setEnergyScore(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <textarea
            rows={4}
            value={userThought}
            onChange={(e) => setUserThought(e.target.value)}
            placeholder="Write freely about what you're navigating today—work pressure, a tough decision, relationship stress, or a goal you're working toward..."
            className="w-full rounded-xl bg-[#070B14] border border-white/15 p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
          />

          <button
            type="submit"
            disabled={submitting || !userThought.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Reflecting with Counselor Cedar...' : 'Receive Compassionate Reflection & Reframe'}
          </button>
        </form>

        {/* Interactive Guided Aurora Breathing Pacer */}
        <div className="rounded-2xl border border-white/10 bg-[#0C1425] p-6 flex flex-col items-center justify-between text-center shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
              <Wind className="w-4 h-4" />
              Northern Aurora Breath Pacer
            </div>
            <p className="text-xs text-slate-400">4-4-4-4 Nervous System Reset</p>
          </div>

          <div className="my-6 relative flex items-center justify-center w-44 h-44">
            <div
              className={`rounded-full bg-gradient-to-tr from-emerald-500/30 via-cyan-400/30 to-amber-300/25 border border-emerald-400/40 flex flex-col items-center justify-center transition-all duration-1000 ${
                !breathingActive
                  ? 'w-28 h-28'
                  : breathPhase.startsWith('Inhale') || breathPhase.startsWith('Hold')
                    ? 'w-40 h-40 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
                    : 'w-24 h-24'
              }`}
            >
              <span className="text-xs font-bold text-white">
                {breathingActive ? breathPhase.split(' ')[0] : 'Ready'}
              </span>
              {breathingActive && (
                <span className="text-lg font-mono text-emerald-300 mt-0.5">{phaseSec}s</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setBreathingActive((b) => !b)}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              breathingActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {breathingActive ? 'Pause Breathing Guide' : 'Start Guided Box Breathing'}
          </button>
        </div>
      </div>

      {/* Saved Counseling Reflections */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Recent Sanctuary Reflections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reflections.map((ref) => (
            <div
              key={ref.id}
              className="rounded-2xl border border-white/10 bg-[#0B1221] p-5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-medium">
                  {ref.mood_label} · Mood {ref.mood_score}/10 · Energy {ref.energy_score}/10
                </span>
                <span className="text-slate-500">
                  {new Date(ref.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-400 italic">"{ref.user_thought}"</p>
              <p className="text-sm text-slate-200 leading-relaxed">{ref.compassionate_response}</p>
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                <strong>Cognitive Reframe:</strong> {ref.reframed_perspective}
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <strong>Gentle Action Step:</strong> {ref.gentle_action_step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

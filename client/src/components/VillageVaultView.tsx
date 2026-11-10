import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, Play, ShieldCheck, Users } from 'lucide-react';
import type { Dbt001RunReport, VillageAgent } from '@shared/types';

interface Props {
  agents: VillageAgent[];
  onAskAgent: (agentPrompt: string) => void;
}

export const VillageVaultView: React.FC<Props> = ({ agents, onAskAgent }) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dbtReport, setDbtReport] = useState<Dbt001RunReport | null>(null);
  const [runningDbt, setRunningDbt] = useState(false);

  const fetchVaultSummary = async () => {
    const res = await fetch('/api/vault/summary');
    if (res.ok) {
      const data = await res.json();
      setCounts(data.counts || {});
    }
  };

  useEffect(() => {
    fetchVaultSummary();
  }, []);

  const handleRunDbt001 = async () => {
    setRunningDbt(true);
    try {
      const res = await fetch('/api/dbt001/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '1.1' }),
      });
      if (res.ok) {
        const report: Dbt001RunReport = await res.json();
        setDbtReport(report);
        fetchVaultSummary();
      }
    } finally {
      setRunningDbt(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Panoramic Village Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
        <img
          src="/assets/village-hero.png"
          alt="AI Agent Village"
          className="w-full h-60 sm:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/45 to-transparent flex flex-col justify-end p-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
            🍁 Canonical Agent Configuration v1.0 · Northern Observatory
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">
            The Canadian AI Agent Village
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-1">
            One unified Commander leading seven specialized guild masters—backed by an authoritative PostgreSQL 16 relational vault and DBT-001 v1.1 integrity guarantees.
          </p>
        </div>
      </div>

      {/* 8 Canonical Guild Agents Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Active Village Guild Roster ({agents.length} Canonical Agents)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((ag) => (
            <div
              key={ag.id}
              className="rounded-2xl border border-white/10 bg-[#0B1221] p-4 flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">
                    {ag.callsign}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    🍁 {ag.origin_country} · v{ag.canonical_version || '1.0.0'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{ag.name}</h4>
                <div className="text-[11px] text-amber-300/90 font-medium">{ag.guild}</div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {ag.persona_summary}
                </p>
              </div>

              <button
                onClick={() => onAskAgent(`Hey ${ag.callsign} (${ag.name}), show me what your ${ag.guild} guild can do!`)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Collaborate in Hub →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DBT-001 v1.1 Live Verification Harness & PostgreSQL Table Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0B1322] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                DBT-001 v1.1 Integrity Harness
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Authoritative Persisted-State & Rollback Suite
              </h3>
            </div>
            <button
              onClick={handleRunDbt001}
              disabled={runningDbt}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {runningDbt ? 'Verifying SQL...' : 'Run DBT-001 v1.1'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Spins up a fresh disposable PostgreSQL 16 engine and executes{' '}
            <code className="text-amber-300">0001_initial_village_schema.sql</code>,{' '}
            <code className="text-amber-300">DBT-001_fixture_v1.1.sql</code>,{' '}
            <code className="text-amber-300">DBT-001_assertions_v1.1.sql</code>, and{' '}
            <code className="text-amber-300">DBT-001_transaction_rollback_v1.1.sql</code>.
          </p>

          {dbtReport && (
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-300">
                  {dbtReport.banner}
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  {dbtReport.durationMs} ms
                </span>
              </div>

              <div className="space-y-1.5">
                {dbtReport.stages.map((st) => (
                  <div
                    key={st.name}
                    className="px-3 py-2 rounded-lg bg-slate-950/70 border border-white/8 text-xs flex items-center justify-between"
                  >
                    <span className="font-mono text-slate-200 truncate">{st.name}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>

              {dbtReport.notices.length > 0 && (
                <pre className="p-3 rounded-xl bg-[#050811] border border-white/10 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                  {dbtReport.notices.map((n) => `NOTICE: ${n}`).join('\n')}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Live PostgreSQL Relational Vault Counts */}
        <div className="rounded-2xl border border-white/10 bg-[#0B1322] p-6 space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
            <Database className="w-4 h-4" />
            Live PostgreSQL 16 Relational Vault
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(counts).map(([table, count]) => (
              <div
                key={table}
                className="p-3 rounded-xl bg-slate-950/70 border border-white/8"
              >
                <div className="text-[11px] font-mono text-slate-400 truncate">{table}</div>
                <div className="text-lg font-bold text-white mt-0.5">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

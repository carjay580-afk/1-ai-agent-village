import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Play,
  Plus,
  Power,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import type { AutomationRecord, TaskRecord } from '@shared/types';

interface Props {
  tasks: TaskRecord[];
  automations: AutomationRecord[];
  inspectedTask: TaskRecord | null;
  onInspectTaskId: (taskId: string) => Promise<void>;
  onCreateTask: (title: string, priority: TaskRecord['priority']) => Promise<void>;
  onCreateAutomation: (name: string, scheduleExpr: string, promptTemplate: string) => Promise<void>;
  onToggleAutomation: (id: string) => Promise<void>;
  onRunAutomationNow: (id: string) => Promise<void>;
}

const CANONICAL_STAGES = [
  'TASK_CREATED',
  'TASK_PLANNED',
  'AGENT_ASSIGNED',
  'TASK_EXECUTION_STARTED',
  'TASK_VERIFICATION_STARTED',
  'TASK_VERIFIED',
  'TASK_COMPLETED',
];

export const TasksAutomationsView: React.FC<Props> = ({
  tasks,
  automations,
  inspectedTask,
  onInspectTaskId,
  onCreateTask,
  onCreateAutomation,
  onToggleAutomation,
  onRunAutomationNow,
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [priority, setPriority] = useState<TaskRecord['priority']>('HIGH');
  const [busyTask, setBusyTask] = useState(false);

  const [autoName, setAutoName] = useState('');
  const [autoSchedule, setAutoSchedule] = useState('Every 6 hours');
  const [autoPrompt, setAutoPrompt] = useState('');
  const [runningAutoId, setRunningAutoId] = useState<string | null>(null);

  const handleDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || busyTask) return;
    setBusyTask(true);
    try {
      await onCreateTask(taskTitle.trim(), priority);
      setTaskTitle('');
    } finally {
      setBusyTask(false);
    }
  };

  const handleAddAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoName.trim()) return;
    await onCreateAutomation(
      autoName.trim(),
      autoSchedule,
      autoPrompt.trim() || autoName.trim()
    );
    setAutoName('');
    setAutoPrompt('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispatch Verified 7-Stage Task */}
        <form
          onSubmit={handleDispatchTask}
          className="rounded-2xl border border-white/10 bg-[#0C1425] p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            Dispatch 7-Stage Canonical Task
          </div>
          <p className="text-xs text-slate-400">
            Commander North decomposes your goal, executes specialist tools, and passes Sentinel Algonquin’s verification gate before marking COMPLETED.
          </p>
          <div className="flex gap-2">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter any objective to plan, execute & verify..."
              className="flex-1 rounded-xl bg-[#060A14] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskRecord['priority'])}
              className="rounded-xl bg-[#060A14] border border-white/15 px-3 py-2.5 text-xs text-slate-200"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busyTask || !taskTitle.trim()}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-40"
          >
            {busyTask ? 'Executing & Verifying...' : 'Run & Verify Task Now'}
          </button>
        </form>

        {/* Create Scheduled Automation */}
        <form
          onSubmit={handleAddAutomation}
          className="rounded-2xl border border-white/10 bg-[#0C1425] p-6 space-y-3 shadow-xl"
        >
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
            <Workflow className="w-4 h-4" />
            Create Autonomous Workflow Schedule
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              value={autoName}
              onChange={(e) => setAutoName(e.target.value)}
              placeholder="Automation name (e.g. Weekly Executive Audit)"
              className="rounded-xl bg-[#060A14] border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <select
              value={autoSchedule}
              onChange={(e) => setAutoSchedule(e.target.value)}
              className="rounded-xl bg-[#060A14] border border-white/15 px-3.5 py-2 text-xs text-slate-200"
            >
              <option value="Every 1 hour">Every 1 hour</option>
              <option value="Every 6 hours">Every 6 hours</option>
              <option value="Every 12 hours">Every 12 hours</option>
              <option value="Daily · 07:30 EST">Daily · 07:30 EST</option>
            </select>
          </div>
          <input
            value={autoPrompt}
            onChange={(e) => setAutoPrompt(e.target.value)}
            placeholder="Instructions for Commander North to execute on each cycle..."
            className="w-full rounded-xl bg-[#060A14] border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!autoName.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Automation Pipeline
          </button>
        </form>
      </div>

      {/* Active Automations List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Automated Village Pipelines ({automations.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="rounded-2xl border border-white/10 bg-[#0B1221] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                    {auto.schedule_expr}
                  </span>
                  <span className="text-[11px] text-slate-400">Runs: {auto.run_count}</span>
                </div>
                <h4 className="font-semibold text-sm text-white">{auto.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{auto.description}</p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/8">
                <button
                  onClick={() => onToggleAutomation(auto.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                    auto.enabled
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {auto.enabled ? 'Active' : 'Paused'}
                </button>

                <button
                  onClick={async () => {
                    setRunningAutoId(auto.id);
                    try {
                      await onRunAutomationNow(auto.id);
                    } finally {
                      setRunningAutoId(null);
                    }
                  }}
                  disabled={runningAutoId === auto.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {runningAutoId === auto.id ? 'Running...' : 'Trigger Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persisted Tasks & 7-Stage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-sm font-semibold text-white">Recent Verified Tasks ({tasks.length})</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {tasks.map((t) => {
              const selected = inspectedTask?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onInspectTaskId(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    selected
                      ? 'bg-emerald-500/15 border-emerald-400/50'
                      : 'bg-[#0B1221] border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">{t.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono shrink-0">
                      {t.verification_status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>{t.category}</span>
                    <span>{t.execution_status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-Stage Lifecycle Audit Inspector */}
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#0B1221] p-5 space-y-4">
          {inspectedTask ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h4 className="font-semibold text-sm text-white">{inspectedTask.title}</h4>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">Task UUID: {inspectedTask.id}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
                    {inspectedTask.execution_status}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
                    {inspectedTask.verification_status}
                  </span>
                </div>
              </div>

              {/* 7 Canonical Audit Stages */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Canonical 7-Stage DBT-001 Audit Trail
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CANONICAL_STAGES.map((stageName) => {
                    const hit = inspectedTask.audit_events?.some((ev) => ev.event_type === stageName);
                    return (
                      <div
                        key={stageName}
                        className={`p-2 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                          hit
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{stageName.replace('TASK_', '')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Steps & Tool Executions */}
              {inspectedTask.steps && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">Persisted Task Steps</div>
                  {inspectedTask.steps.map((st) => (
                    <div
                      key={st.id}
                      className="px-3 py-2 rounded-lg bg-slate-950/70 border border-white/8 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="text-slate-200">
                        <strong className="text-amber-300 mr-1.5">#{st.step_order} {st.step_type}</strong>
                        {st.title}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">{st.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Select any task on the left (or dispatch a new one) to inspect its 7-stage PostgreSQL lifecycle, steps, and tool executions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

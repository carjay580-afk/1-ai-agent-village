import React, { useCallback, useEffect, useState } from 'react';
import {
  Clapperboard,
  Hammer,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import type {
  AutomationRecord,
  BuilderCreation,
  ConversationMessage,
  CounselingReflection,
  MediaArtifact,
  MediaType,
  TaskRecord,
  VillageAgent,
} from '@shared/types';
import { BuilderForgeView } from './components/BuilderForgeView';
import { CommandHubView } from './components/CommandHubView';
import { CounselingView } from './components/CounselingView';
import { StudioView } from './components/StudioView';
import { TasksAutomationsView } from './components/TasksAutomationsView';
import { VillageVaultView } from './components/VillageVaultView';

type ActiveTab = 'hub' | 'studio' | 'counseling' | 'builder' | 'tasks' | 'village';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hub');
  const [loading, setLoading] = useState(true);

  const [agents, setAgents] = useState<VillageAgent[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [mediaArtifacts, setMediaArtifacts] = useState<MediaArtifact[]>([]);
  const [builderCreations, setBuilderCreations] = useState<BuilderCreation[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<BuilderCreation | null>(null);
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [inspectedTask, setInspectedTask] = useState<TaskRecord | null>(null);
  const [reflections, setReflections] = useState<CounselingReflection[]>([]);

  const loadBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return;
      const data = await res.json();
      setAgents(data.agents || []);
      setConversationId(data.activeConversationId || '');
      setMessages(data.messages || []);
      setMediaArtifacts(data.mediaArtifacts || []);
      setBuilderCreations(data.builderCreations || []);
      setAutomations(data.automations || []);
      setTasks(data.tasks || []);
      setReflections(data.counselingReflections || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const handleSendMessage = async (
    content: string,
    mode: string
  ): Promise<ConversationMessage | null> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content, mode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const { userMessage, assistantMessage } = data as {
      userMessage: ConversationMessage;
      assistantMessage: ConversationMessage;
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    if (assistantMessage.attachedMedia) {
      setMediaArtifacts((prev) => [assistantMessage.attachedMedia!, ...prev]);
    }
    if (assistantMessage.attachedBuild) {
      setBuilderCreations((prev) => [assistantMessage.attachedBuild!, ...prev]);
    }
    if (assistantMessage.attachedTask) {
      setTasks((prev) => [assistantMessage.attachedTask!, ...prev]);
      setInspectedTask(assistantMessage.attachedTask);
    }
    return assistantMessage;
  };

  const handleGenerateMedia = async (
    mediaType: MediaType,
    prompt: string,
    style?: string
  ): Promise<MediaArtifact | null> => {
    const res = await fetch('/api/media/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType, prompt, style }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setMediaArtifacts((prev) => [data.artifact, ...prev]);
    if (data.task) setTasks((prev) => [data.task, ...prev]);
    return data.artifact;
  };

  const handleForgeApp = async (prompt: string): Promise<BuilderCreation | null> => {
    const res = await fetch('/api/builder/forge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setBuilderCreations((prev) => [data.creation, ...prev]);
    if (data.task) setTasks((prev) => [data.task, ...prev]);
    return data.creation;
  };

  const handleSubmitReflection = async (input: {
    moodLabel: string;
    moodScore: number;
    energyScore: number;
    userThought: string;
  }): Promise<CounselingReflection | null> => {
    const res = await fetch('/api/counseling/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setReflections((prev) => [data.reflection, ...prev]);
    return data.reflection;
  };

  const handleCreateTask = async (title: string, priority: TaskRecord['priority']) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: title, priority }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setTasks((prev) => [data.task, ...prev]);
    setInspectedTask(data.task);
  };

  const handleInspectTaskId = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`);
    if (!res.ok) return;
    const data = await res.json();
    setInspectedTask(data.task);
  };

  const handleCreateAutomation = async (
    name: string,
    scheduleExpr: string,
    promptTemplate: string
  ) => {
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: promptTemplate,
        scheduleExpr,
        promptTemplate,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setAutomations((prev) => [data.automation, ...prev]);
  };

  const handleToggleAutomation = async (id: string) => {
    const res = await fetch(`/api/automations/${id}/toggle`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    setAutomations((prev) => prev.map((a) => (a.id === id ? data.automation : a)));
  };

  const handleRunAutomationNow = async (id: string) => {
    const res = await fetch(`/api/automations/${id}/run`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    setAutomations((prev) => prev.map((a) => (a.id === id ? data.automation : a)));
    if (data.task) {
      setTasks((prev) => [data.task, ...prev]);
      setInspectedTask(data.task);
    }
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'hub', label: 'Command Hub', badge: 'All-in-One', icon: MessageSquare },
    { id: 'studio', label: 'Cinema & Media', badge: `${mediaArtifacts.length}`, icon: Clapperboard },
    { id: 'counseling', label: 'Counseling', icon: HeartHandshake },
    { id: 'builder', label: 'Builder Forge', badge: `${builderCreations.length}`, icon: Hammer },
    { id: 'tasks', label: 'Tasks & Auto', badge: `${automations.length}`, icon: Workflow },
    { id: 'village', label: 'Village & DBT-001', badge: 'PASS', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center gap-3 text-slate-200">
        <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="text-sm font-semibold">Awakening AI Agent Village & PostgreSQL Vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col md:flex-row">
      {/* Left Navigation Rail */}
      <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#080E1B]/95 p-4 flex flex-col justify-between gap-4">
        <div className="space-y-5">
          {/* Brand Crest */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 to-emerald-500/25 border border-amber-400/40 flex items-center justify-center text-lg shadow">
              🍁
            </div>
            <div>
              <h1 className="font-bold text-sm text-white leading-tight">AI Agent Village</h1>
              <p className="text-[11px] text-emerald-400 font-medium">
                Commander North · v1.1
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                        active ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status Card */}
        <div className="hidden md:block rounded-xl bg-[#0D1628] border border-white/10 p-3 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">PostgreSQL Vault</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Active Guilds</span>
            <span className="text-white font-mono">{agents.length} / 8</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Locale & Voice</span>
            <span className="text-amber-300 font-mono">en-CA / fr-CA</span>
          </div>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'hub' && (
          <CommandHubView
            conversationId={conversationId}
            messages={messages}
            onSendMessage={handleSendMessage}
            onOpenBuilder={(creation) => {
              setSelectedBuild(creation);
              setActiveTab('builder');
            }}
            onOpenMedia={() => setActiveTab('studio')}
            onInspectTask={(task) => {
              setInspectedTask(task);
              setActiveTab('tasks');
            }}
          />
        )}

        {activeTab === 'studio' && (
          <StudioView
            artifacts={mediaArtifacts}
            onGenerateMedia={handleGenerateMedia}
          />
        )}

        {activeTab === 'counseling' && (
          <CounselingView
            reflections={reflections}
            onSubmitReflection={handleSubmitReflection}
          />
        )}

        {activeTab === 'builder' && (
          <BuilderForgeView
            creations={builderCreations}
            selectedCreation={selectedBuild}
            onSelectCreation={setSelectedBuild}
            onForgeApp={handleForgeApp}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksAutomationsView
            tasks={tasks}
            automations={automations}
            inspectedTask={inspectedTask}
            onInspectTaskId={handleInspectTaskId}
            onCreateTask={handleCreateTask}
            onCreateAutomation={handleCreateAutomation}
            onToggleAutomation={handleToggleAutomation}
            onRunAutomationNow={handleRunAutomationNow}
          />
        )}

        {activeTab === 'village' && (
          <VillageVaultView
            agents={agents}
            onAskAgent={(promptText) => {
              setActiveTab('hub');
              handleSendMessage(promptText, 'omni');
            }}
          />
        )}
      </main>
    </div>
  );
};

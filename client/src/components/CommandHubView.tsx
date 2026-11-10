import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { BuilderCreation, ConversationMessage, MediaArtifact, TaskRecord } from '@shared/types';
import { MediaCard } from './MediaCard';

interface Props {
  conversationId: string;
  messages: ConversationMessage[];
  onSendMessage: (content: string, mode: string) => Promise<ConversationMessage | null>;
  onOpenBuilder: (creation: BuilderCreation) => void;
  onOpenMedia: (artifact: MediaArtifact) => void;
  onInspectTask: (task: TaskRecord) => void;
}

const QUICK_PROMPTS = [
  { label: '🎬 Direct a Sci-Fi Movie', prompt: 'Make a sci-fi movie about Canadian astronauts discovering a glowing forest beneath the northern lights' },
  { label: '📺 Create a 3-Episode Show', prompt: 'Make a funny warm TV show about inventors running a mountain lodge in Banff' },
  { label: '🎵 Compose Aurora Music', prompt: 'Compose an uplifting synthwave music track inspired by midnight in Montreal' },
  { label: '📸 Generate Northern Photo', prompt: 'Generate a cinematic photo of emerald aurora borealis over an alpine lake observatory' },
  { label: '🛠️ Build an Arcade Game', prompt: 'Build an interactive Aurora Orb arcade game app' },
  { label: '💚 Counseling Decompression', prompt: 'I have been feeling overwhelmed with too many responsibilities lately—can you help me reframe and pace myself?' },
];

function formatRichText(text: string): React.ReactNode {
  return text.split('\n').map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-emerald-300 font-semibold text-sm mt-2 mb-1">
          {line.slice(4)}
        </h4>
      );
    }
    if (line.trim() === '---') {
      return <hr key={idx} className="border-white/10 my-2" />;
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-1.5" />;
    }
    // Render **bold** and `code` inline cleanly
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={idx} className="leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="text-white font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={pIdx}
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-amber-300 text-xs font-mono"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>;
        })}
      </p>
    );
  });
}

export const CommandHubView: React.FC<Props> = ({
  messages,
  onSendMessage,
  onOpenBuilder,
  onInspectTask,
}) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'omni' | 'counseling' | 'builder' | 'studio' | 'automation'>('omni');
  const [sending, setSending] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  const speakCommanderReply = (rawText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = rawText
      .replace(/\*\*|`|###|---/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .slice(0, 550);
    const utter = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const caVoice =
      voices.find((v) => v.lang.toLowerCase() === 'en-ca') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (caVoice) utter.voice = caVoice;
    utter.lang = 'en-CA';
    utter.rate = 1.01;
    utter.pitch = 0.98;
    window.speechSynthesis.speak(utter);
  };

  const submitPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || sending) return;
    setInput('');
    setSending(true);
    try {
      const reply = await onSendMessage(trimmed, mode);
      if (reply && autoSpeakReplies) {
        speakCommanderReply(reply.content);
      }
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceMic = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser—type any message and toggle Voice Readout to hear Commander North speak!');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'en-CA';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setListening(true);
      setAutoSpeakReplies(true);
    };
    rec.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        submitPrompt(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-5xl mx-auto">
      {/* Commander North Hero Banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0C1629] via-[#0F1E36] to-[#0B172A] p-4 mb-3 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <img
              src="/assets/commander-north.png"
              alt="Commander North"
              className="w-14 h-14 rounded-2xl object-cover border border-amber-400/40 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0C1629]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">Commander North</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                🍁 Canadian All-in-One Lead Agent
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Talk, counsel, automate tasks, build live software, or produce photos, music, videos, movies & shows in one place.
            </p>
          </div>
        </div>

        {/* Live Voice Controls & Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleVoiceMic}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              listening
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {listening ? 'Listening (en-CA)...' : 'Talk by Voice'}
          </button>

          <button
            onClick={() => {
              const next = !autoSpeakReplies;
              setAutoSpeakReplies(next);
              if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              autoSpeakReplies
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            {autoSpeakReplies ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            Voice Replies {autoSpeakReplies ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Mode Stance Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1">
        {(
          [
            { id: 'omni', label: 'All-in-One Auto' },
            { id: 'counseling', label: 'Counseling Stance' },
            { id: 'builder', label: 'Builder Stance' },
            { id: 'studio', label: 'Cinema & Media' },
            { id: 'automation', label: 'Task & Automation' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              mode === m.id
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
        {messages.map((msg) => {
          const isUser = msg.sender_role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl w-full sm:w-auto rounded-2xl p-4 space-y-3 ${
                  isUser
                    ? 'bg-emerald-600/25 border border-emerald-500/35 text-slate-100'
                    : 'bg-[#0D1526] border border-white/10 text-slate-200 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className={`font-semibold ${isUser ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {isUser ? 'You' : `🍁 ${msg.agent_name}`}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => speakCommanderReply(msg.content)}
                      className="text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
                      title="Read aloud in Canadian English"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Speak
                    </button>
                  )}
                </div>

                <div className="text-sm space-y-1">{formatRichText(msg.content)}</div>

                {/* Inline Attached Media (Photo / Audio / Video / Movie / Show) */}
                {msg.attachedMedia && (
                  <div className="pt-2">
                    <MediaCard artifact={msg.attachedMedia} compact />
                  </div>
                )}

                {/* Inline Attached Builder App Preview */}
                {msg.attachedBuild && (
                  <div className="pt-2 rounded-xl border border-white/10 bg-[#080D19] overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        {msg.attachedBuild.title}
                      </span>
                      <button
                        onClick={() => onOpenBuilder(msg.attachedBuild!)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 cursor-pointer"
                      >
                        Open Full Forge →
                      </button>
                    </div>
                    <iframe
                      title={msg.attachedBuild.title}
                      srcDoc={msg.attachedBuild.preview_html}
                      sandbox="allow-scripts"
                      className="w-full h-72 border-0 bg-[#080D1A]"
                    />
                  </div>
                )}

                {/* Verified 7-Stage DBT-001 Lifecycle Pill */}
                {msg.attachedTask && (
                  <div className="pt-1 flex items-center justify-between gap-2 text-xs bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Task ({msg.attachedTask.execution_status} · {msg.attachedTask.verification_status})
                    </span>
                    <button
                      onClick={() => onInspectTask(msg.attachedTask!)}
                      className="text-cyan-300 hover:underline cursor-pointer"
                    >
                      Inspect 7-Stage Audit →
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-[#0D1526] border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              Commander North & Village Specialists are orchestrating and verifying your request...
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Quick Prompt Starters */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => submitPrompt(qp.prompt)}
            disabled={sending}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Unified Command Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitPrompt(input);
        }}
        className="mt-1 flex items-center gap-2 rounded-2xl bg-[#0D1628] border border-white/15 p-2 focus-within:border-emerald-400/60 shadow-xl"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Commander North anything — talk, counsel, automate, build an app, or make a photo, song, video, movie, or show..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition cursor-pointer disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
};

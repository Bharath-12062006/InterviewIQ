import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Play, Mic, Video, Volume2, ShieldCheck, Sparkles, 
  Clock, CheckCircle, HelpCircle, Layers, UserCheck 
} from 'lucide-react';
import { CATEGORY_PHASES, DIFFICULTIES, MODES } from '../config/constants';
import Panel from '../components/ui/Panel';

export default function MockInterview() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [category, setCategory] = useState(params.get('category') || 'DSA');
  const [difficulty, setDifficulty] = useState(params.get('difficulty') || 'Intermediate');
  const [mode, setMode] = useState(params.get('mode') || 'Strict Technical');
  const [duration, setDuration] = useState('15');
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    if (params.get('category')) setCategory(params.get('category'));
    if (params.get('difficulty')) setDifficulty(params.get('difficulty'));
    if (params.get('mode')) setMode(params.get('mode'));
  }, [params]);

  const handleTestMic = () => {
    setMicTesting(true);
    let interval = setInterval(() => {
      setMicLevel(Math.floor(Math.random() * 85) + 15);
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      setMicTesting(false);
      setMicLevel(100);
    }, 2000);
  };

  const handleStart = (e) => {
    e.preventDefault();
    const query = new URLSearchParams({
      category,
      difficulty,
      mode,
      duration,
    });
    navigate(`/interview/room?${query.toString()}`);
  };

  const modeDescriptions = {
    'Friendly': 'Supportive interviewer who offers hints and constructive encouragement.',
    'Strict Technical': 'Rigorous questioning focused on deep correctness, edge cases, and algorithmic complexity.',
    'HR': 'Assesses communication, teamwork, STAR behavioral answers, and cultural values.',
    'Senior Engineer': 'Explores high-level trade-offs, architecture decisions, and real-world system pitfalls.',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          AI Mock Interview Setup
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Configure your category, persona, and difficulty to launch a full interactive mock interview session.
        </p>
      </div>

      <form onSubmit={handleStart} className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Topic & Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Category Selection across Phases */}
          <Panel title="1. Select Interview Category">
            <div className="space-y-4">
              {CATEGORY_PHASES.map((group) => (
                <div key={group.phase} className="rounded-xl border border-line bg-paper/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-signal">
                      {group.phase} · {group.label}
                    </span>
                    <span className="text-xs text-ink-faint">{group.items.length} topics</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setCategory(item)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          category === item
                            ? 'bg-signal text-white shadow-sm ring-2 ring-signal ring-offset-2 ring-offset-surface'
                            : 'bg-surface text-ink hover:bg-signal-soft/50 hover:text-signal-deep border border-line/60'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* 2. Interviewer Persona */}
          <Panel title="2. Choose Interviewer Style">
            <div className="grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <div
                  key={m}
                  onClick={() => setMode(m)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    mode === m
                      ? 'border-signal bg-signal-soft/30 ring-2 ring-signal'
                      : 'border-line bg-surface hover:border-signal/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-ink">{m}</span>
                    {mode === m && <CheckCircle size={16} className="text-signal" />}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    {modeDescriptions[m]}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* 3. Difficulty & Duration */}
          <Panel title="3. Target Difficulty & Duration">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Difficulty Level</label>
                <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-paper p-1">
                  {DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`rounded-md py-2 text-center text-xs font-semibold transition-colors ${
                        difficulty === d
                          ? 'bg-surface text-ink shadow-sm'
                          : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft">Session Length</label>
                <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-paper p-1">
                  {[
                    { label: '3 Qs (10m)', val: '10' },
                    { label: '5 Qs (20m)', val: '15' },
                    { label: '8 Qs (35m)', val: '30' },
                  ].map((dur) => (
                    <button
                      type="button"
                      key={dur.val}
                      onClick={() => setDuration(dur.val)}
                      className={`rounded-md py-2 text-center text-xs font-semibold transition-colors ${
                        duration === dur.val
                          ? 'bg-surface text-ink shadow-sm'
                          : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Pre-interview Check & Start */}
        <div className="space-y-6">
          <div className="rounded-xl bg-navy-900 p-6 text-white shadow-panel">
            <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">Summary</span>
            <h3 className="mt-1 font-display text-xl font-bold">{category} Interview</h3>
            <p className="mt-0.5 text-xs text-white/70">
              {mode} · {difficulty} level · ~{duration} minutes
            </p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-jade" /> Adaptive LLM Follow-ups
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-jade" /> Voice & Text Input Supported
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-jade" /> Instant Scored Performance Report
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary mt-6 w-full py-3 text-base shadow-lg"
            >
              <Play size={18} /> Launch Interview Room
            </button>
          </div>

          {/* Hardware Readiness Check */}
          <Panel title="Device Readiness Check">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-ink">
                  <Mic size={16} className="text-signal" /> Microphone
                </div>
                <button
                  type="button"
                  onClick={handleTestMic}
                  disabled={micTesting}
                  className="rounded border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:bg-paper"
                >
                  {micTesting ? 'Testing...' : 'Test Mic'}
                </button>
              </div>

              {/* Volume Meter */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full bg-jade transition-all duration-100"
                  style={{ width: `${micLevel}%` }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Video size={14} className="text-signal" /> Camera Ready
                </span>
                <span className="font-semibold text-jade">Connected</span>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-signal" /> Quiet Environment
                </span>
                <span className="font-semibold text-jade">Optimal</span>
              </div>
            </div>
          </Panel>

          {/* Tips Card */}
          <div className="rounded-xl border border-signal/20 bg-signal-soft/30 p-4 text-xs text-signal-deep">
            <p className="font-bold">Interviewer Tip:</p>
            <p className="mt-1 leading-relaxed text-ink-soft">
              Speak clearly and state your initial thought process before jumping into edge cases. If you get stuck, explain your trade-offs!
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

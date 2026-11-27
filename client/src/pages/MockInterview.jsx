import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play, Mic, Video, ShieldCheck, CheckCircle, FileText,
  Briefcase, RefreshCw, AlertCircle, Clock,
} from 'lucide-react';
import {
  CATEGORY_PHASES, DIFFICULTIES, INTERVIEW_DURATIONS, JOB_ROLES, MODES,
} from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import Panel from '../components/ui/Panel';

const LEGACY_CATEGORY_MAP = {
  DSA: 'Data Structures and Algorithms',
  C: 'C Programming',
  OOPs: 'OOP',
  HR: 'HR Interview',
};

const LEGACY_MODE_MAP = {
  Friendly: 'Friendly Interviewer',
  'Strict Technical': 'Strict Technical Interviewer',
  'Senior Engineer': 'Senior Software Engineer',
  HR: 'HR Interviewer',
};

export default function MockInterview() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const initialCat = params.get('category');
  const mappedCat = LEGACY_CATEGORY_MAP[initialCat] || initialCat || 'Technical Interview';
  const initialMode = params.get('mode');
  const mappedMode = LEGACY_MODE_MAP[initialMode] || initialMode || 'Strict Technical Interviewer';

  const [jobRole, setJobRole] = useState(() => {
    const userRole = user?.targetRole || 'Software Engineer';
    return JOB_ROLES.includes(userRole) ? userRole : 'Software Engineer';
  });
  const [category, setCategory] = useState(mappedCat);
  const [difficulty, setDifficulty] = useState(params.get('difficulty') || 'Intermediate');
  const [mode, setMode] = useState(mappedMode);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [micTesting, setMicTesting] = useState(false);
  const [micStatus, setMicStatus] = useState('');

  useEffect(() => {
    if (params.get('category')) {
      const cat = params.get('category');
      setCategory(LEGACY_CATEGORY_MAP[cat] || cat);
    }
    if (params.get('difficulty')) setDifficulty(params.get('difficulty'));
    if (params.get('mode')) {
      const m = params.get('mode');
      setMode(LEGACY_MODE_MAP[m] || m);
    }
  }, [params]);

  useEffect(() => {
    let active = true;
    async function loadSetupData() {
      try {
        const [list, activeRes] = await Promise.all([
          api.get('/resume/history').catch(() => null),
          api.get('/interview/active').catch(() => null),
        ]);
        if (active && Array.isArray(list)) {
          setResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0]._id);
          }
        }
        if (active && activeRes?.session?.id) {
          setActiveSession(activeRes.session);
        }
      } catch {
        // Optional setup hydration
      }
    }
    loadSetupData();
    return () => {
      active = false;
    };
  }, []);

  const handleTestMic = async () => {
    setMicTesting(true);
    setMicStatus('');
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicStatus('Microphone permission granted and ready.');
      } else {
        setMicStatus('Browser microphone API unavailable; text mode is always ready.');
      }
    } catch {
      setMicStatus('Microphone access blocked or unavailable. You can still use text mode.');
    } finally {
      setMicTesting(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setStartError('');
    setStarting(true);

    try {
      const res = await api.post('/interview/start', {
        jobRole,
        category,
        difficulty,
        mode,
        durationMinutes,
        resumeId: selectedResumeId || '',
      });

      if (!res?.session?.id) {
        throw new Error('Server did not return a valid interview session.');
      }

      navigate(`/interview/room/${encodeURIComponent(res.session.id)}`, {
        state: { initialSession: res.session },
      });
    } catch (err) {
      setStartError(
        err.message ||
          'Failed to start AI interview session. Ensure the backend and Gemini API key are configured.',
      );
    } finally {
      setStarting(false);
    }
  };

  const modeDescriptions = {
    'Friendly Interviewer': 'Supportive interviewer who gives constructive prompts and asks clear follow-ups.',
    'Strict Technical Interviewer': 'Rigorous questioning focused on accuracy, edge cases, complexity, and internals.',
    'Senior Software Engineer': 'Explores architecture trade-offs, debugging, scalability, and real-world systems.',
    'HR Interviewer': 'Assesses communication, STAR behavioral answers, ownership, and teamwork.',
  };

  const selectedResume = resumes.find((r) => r._id === selectedResumeId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          AI Conversational Mock Interview Setup
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Configure your target role, category, style, and optional analyzed resume to launch an adaptive AI interview.
        </p>
      </div>

      {activeSession && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-signal/30 bg-signal/10 px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-ink">
              Active Interview Ready to Resume ({activeSession.category} · {activeSession.questions?.length || 0}/
              {activeSession.maxQuestions || 8} answered)
            </p>
            <p className="text-xs text-ink-soft">
              Continue your existing question without using extra AI quota.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(`/interview/room/${encodeURIComponent(activeSession.id)}`, {
                state: { initialSession: activeSession },
              })
            }
            className="rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            Resume Session
          </button>
        </div>
      )}

      {startError && (() => {
        const isQuota = /quota|rate limit|billing|429/i.test(startError);
        return (
          <div className="rounded-xl border border-rose/30 bg-rose-soft px-4 py-3 text-sm text-rose">
            <div className="flex items-start gap-2.5 font-semibold">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p>{isQuota ? 'Gemini API Quota or Rate Limit Reached' : 'Unable to Start Interview'}</p>
                <p className="mt-0.5 text-xs font-normal text-ink-soft">{startError}</p>
              </div>
            </div>
          </div>
        );
      })()}

      <form onSubmit={handleStart} className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Target Job Role & Optional Resume */}
          <Panel title="1. Target Job Role & Analyzed Resume">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Briefcase size={14} className="text-signal" /> Target Job Role
                </label>
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm font-semibold text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
                >
                  {JOB_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <FileText size={14} className="text-signal" /> Attach Analyzed Resume (Optional)
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm font-semibold text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
                >
                  <option value="">None — General Role Interview</option>
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fileName} ({r.targetRole} · {r.atsScore}%)
                    </option>
                  ))}
                </select>
                {resumes.length === 0 && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Analyze a PDF/DOCX in Resume Analyzer to enable resume-aware questioning.
                  </p>
                )}
              </div>
            </div>
          </Panel>

          {/* 2. Interview Category */}
          <Panel title="2. Select Interview Category">
            <div className="space-y-4">
              {CATEGORY_PHASES.map((group) => (
                <div key={group.phase} className="rounded-xl border border-line bg-paper/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-signal">
                      {group.phase} · {group.label}
                    </span>
                    <span className="text-xs text-ink-faint">{group.items.length} categories</span>
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

          {/* 3. Interviewer Style */}
          <Panel title="3. Choose Interviewer Style">
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
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {modeDescriptions[m]}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* 4. Difficulty & Duration */}
          <Panel title="4. Difficulty & Duration">
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
                <label className="block text-xs font-semibold text-ink-soft">Interview Duration</label>
                <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-paper p-1">
                  {INTERVIEW_DURATIONS.map((dur) => (
                    <button
                      type="button"
                      key={dur.value}
                      onClick={() => setDurationMinutes(dur.value)}
                      className={`rounded-md py-2 text-center text-xs font-semibold transition-colors ${
                        durationMinutes === dur.value
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

        {/* Right Column: Launch Summary */}
        <div className="space-y-6">
          <div className="rounded-xl bg-navy-900 p-6 text-white shadow-panel dark:border dark:border-line">
            <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">
              Session Configuration
            </span>
            <h3 className="mt-1 font-display text-xl font-bold">{jobRole}</h3>
            <p className="mt-0.5 text-xs text-white/75">
              {category} · {difficulty} · {durationMinutes} mins
            </p>
            <p className="mt-1 text-xs text-white/60">Style: {mode}</p>
            {selectedResume && (
              <p className="mt-1 truncate text-xs text-jade">
                Resume attached: {selectedResume.fileName}
              </p>
            )}

            <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-jade" /> Real conversational LLM follow-ups
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-jade" /> Adaptive difficulty & conversation memory
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-jade" /> Evidence-based final evaluation report
              </div>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="btn-primary mt-6 w-full py-3 text-sm shadow-lg"
            >
              {starting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Starting AI Interview (may take a few seconds)...
                </>
              ) : (
                <>
                  <Play size={16} /> Start Conversational Interview
                </>
              )}
            </button>
          </div>

          {/* Device Readiness Check */}
          <Panel title="Voice & Browser Readiness">
            <div className="space-y-3.5 text-xs">
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
                  {micTesting ? 'Checking...' : 'Check Mic'}
                </button>
              </div>
              {micStatus && <p className="text-ink-soft">{micStatus}</p>}

              <div className="flex items-center justify-between border-t border-line pt-3 text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-signal" /> Session Timer
                </span>
                <span className="font-semibold text-jade">Server-Enforced</span>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3 text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-signal" /> Turn-Based Voice
                </span>
                <span className="font-semibold text-jade">
                  {'SpeechRecognition' in window || 'webkitSpeechRecognition' in window ? 'Supported' : 'Text Mode'}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </form>
    </div>
  );
}

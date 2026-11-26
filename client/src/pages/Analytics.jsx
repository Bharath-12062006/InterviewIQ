import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { mockDashboard, getInterviews, saveInterviews } from '../data/mock';
import { api } from '../lib/api';
import Panel from '../components/ui/Panel';
import ScorePill from '../components/ui/ScorePill';

export default function Analytics() {
  const [interviews, setInterviews] = useState(getInterviews());
  const history = mockDashboard.scoreHistory;
  const skills = mockDashboard.skills;

  useEffect(() => {
    let active = true;
    async function loadAnalytics() {
      try {
        const remote = await api.get('/interviews');
        if (active && Array.isArray(remote) && remote.length > 0) {
          setInterviews(remote);
          saveInterviews(remote);
        }
      } catch (err) {
        console.info('Analytics DB sync notice:', err.message);
      }
    }
    loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  // Comparison selector state
  const [compareIdA, setCompareIdA] = useState(interviews[0]?.id || 'iv-112');
  const [compareIdB, setCompareIdB] = useState(interviews[1]?.id || 'iv-111');

  const ivA = interviews.find((i) => i.id === compareIdA) || interviews[0];
  const ivB = interviews.find((i) => i.id === compareIdB) || interviews[1];

  const weakSkills = skills.filter((s) => s.score < 65);
  const strongSkills = skills.filter((s) => s.score >= 75);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Performance Analytics
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Track historical progress, identify subject-matter deficits, and benchmark interview trends.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-surface p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Overall Average</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">71%</span>
            <span className="flex items-center text-xs font-semibold text-jade">
              <ArrowUpRight size={14} /> +6%
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">vs 65% baseline</p>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Placement Readiness</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-signal">64%</span>
            <span className="text-xs font-semibold text-signal-deep">Target: 80%</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Tier-1 company benchmark</p>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Practice Consistency</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-ink">6 Days</span>
            <span className="text-xs font-semibold text-saffron">Streak active</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Best: 11 consecutive days</p>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Technical Depth</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-jade">76%</span>
            <span className="text-xs font-semibold text-jade">Top 15%</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Across algorithms & systems</p>
        </div>
      </div>

      {/* Chart: Score Trajectory Over Time */}
      <Panel
        title="Score Trajectory Over Time"
        description="Weekly interview averages reflecting adaptation and conceptual mastery"
      >
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--color-signal))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(var(--color-signal))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--color-line))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-soft))' }} />
              <YAxis domain={[40, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(var(--color-ink-soft))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E1A3A',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="score" stroke="rgb(var(--color-signal))" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* 2-Columns: Weak Subject Detection & Subject Competency */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weak Subject Diagnosis */}
        <Panel title="Weak Subject Detection & Diagnostics">
          <p className="text-xs text-ink-soft mb-4">
            AI has flagged these areas as dragging down your placement readiness probability:
          </p>
          <div className="space-y-3">
            {weakSkills.map((s) => (
              <div key={s.name} className="rounded-xl border border-rose/20 bg-rose-soft/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose" />
                    <span className="font-display text-sm font-bold text-ink">{s.name}</span>
                  </div>
                  <ScorePill score={s.score} />
                </div>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                  {s.name === 'DBMS'
                    ? 'Averaged 52% across transactions and normal forms. Multiple hesitations on isolation levels and ACID recovery.'
                    : s.name === 'DSA'
                    ? 'Averaged 61% in graph dynamic programming. Missed 4 of 6 hidden test cases during coding simulations.'
                    : 'Performance is below the placement threshold of 70%. Recommendation: run 2 dedicated drill sessions.'}
                </p>
                <div className="mt-3">
                  <a
                    href={`/interview?category=${encodeURIComponent(s.name)}&difficulty=Intermediate`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose hover:underline"
                  >
                    Start Focused {s.name} Drill <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Competency by Domain */}
        <Panel title="Domain Competency Breakdown">
          <p className="text-xs text-ink-soft mb-4">
            Ranked proficiency across language, systems, and interview rounds:
          </p>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{skill.name}</span>
                  <span className="font-bold text-ink">{skill.score}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-paper">
                  <div
                    className={`h-full rounded-full transition-all ${
                      skill.score >= 75 ? 'bg-jade' : skill.score >= 65 ? 'bg-signal' : 'bg-saffron'
                    }`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Compare Previous and Current Interviews */}
      {ivA && ivB && (
        <Panel
          title="Compare Previous & Recent Interviews"
          description="Evaluate delta progress and rubric shifts between two sessions"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-soft">Session A (Baseline)</label>
              <select
                value={compareIdA}
                onChange={(e) => setCompareIdA(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink"
              >
                {interviews.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.category} ({i.mode}) · {i.date} (Score: {i.score}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft">Session B (Comparison)</label>
              <select
                value={compareIdB}
                onChange={(e) => setCompareIdB(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink"
              >
                {interviews.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.category} ({i.mode}) · {i.date} (Score: {i.score}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-3 bg-paper p-3 text-xs font-bold text-ink-faint">
              <span>Metric</span>
              <span className="text-center">Session A ({ivA.category})</span>
              <span className="text-right">Session B ({ivB.category})</span>
            </div>

            <div className="divide-y divide-line text-xs">
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="font-semibold text-ink">Overall Score</span>
                <span className="text-center font-bold">{ivA.score}%</span>
                <span className="text-right font-bold text-signal">{ivB.score}%</span>
              </div>
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="font-semibold text-ink">Technical Accuracy</span>
                <span className="text-center">{ivA.rubric?.technical || ivA.score}%</span>
                <span className="text-right font-bold">{ivB.rubric?.technical || ivB.score}%</span>
              </div>
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="font-semibold text-ink">Communication & STAR</span>
                <span className="text-center">{ivA.rubric?.communication || ivA.score}%</span>
                <span className="text-right font-bold">{ivB.rubric?.communication || ivB.score}%</span>
              </div>
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="font-semibold text-ink">Duration</span>
                <span className="text-center">{ivA.minutes} mins</span>
                <span className="text-right">{ivB.minutes} mins</span>
              </div>
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="font-semibold text-ink">Difficulty / Persona</span>
                <span className="text-center">{ivA.difficulty} ({ivA.mode})</span>
                <span className="text-right">{ivB.difficulty} ({ivB.mode})</span>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

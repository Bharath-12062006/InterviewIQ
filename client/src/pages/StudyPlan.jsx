import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, CheckSquare, Square, Clock,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { getStudyPlan, saveStudyPlan } from '../data/mock';
import { api } from '../lib/api';
import Panel from '../components/ui/Panel';

export default function StudyPlan() {
  const [plan, setPlan] = useState(getStudyPlan());

  useEffect(() => {
    let active = true;
    async function loadPlan() {
      try {
        const remote = await api.get('/study-plan');
        if (active && remote?.weeklySchedule?.length) {
          setPlan(remote);
          saveStudyPlan(remote);
        }
      } catch (err) {
        console.info('StudyPlan DB sync notice:', err.message);
      }
    }
    loadPlan();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleDay = async (dayIndex) => {
    const updatedSchedule = plan.weeklySchedule.map((item, idx) => {
      if (idx === dayIndex) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    const updatedPlan = { ...plan, weeklySchedule: updatedSchedule };
    setPlan(updatedPlan);
    saveStudyPlan(updatedPlan);

    try {
      await api.put('/study-plan', { weeklySchedule: updatedSchedule });
    } catch (err) {
      console.info('StudyPlan update DB notice:', err.message);
    }
  };

  const completedCount = plan.weeklySchedule.filter((d) => d.completed).length;
  const progressPct = Math.round((completedCount / plan.weeklySchedule.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Personalized Study Plan
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Adaptive daily practice tasks generated from your mock interview deficits and target company benchmarks.
          </p>
        </div>

        <Link to="/interview" className="btn-primary inline-flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <Sparkles size={14} /> Start Today's Session
        </Link>
      </div>

      {/* Top Banner: Placement Readiness & Countdown */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Readiness Meter */}
        <div className="flex flex-col justify-between rounded-xl bg-navy-900 p-6 text-white shadow-panel">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">
                Placement Readiness
              </span>
              <Target size={18} className="text-signal-soft" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-white">{plan.readinessScore}%</span>
              <span className="text-xs text-white/60">/ 100% Target</span>
            </div>
            <p className="mt-1 text-xs text-white/70">
              Estimated threshold for Tier-1 Product Companies
            </p>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-navy-800">
              <div
                className="h-full bg-signal transition-all duration-300"
                style={{ width: `${plan.readinessScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Season Countdown */}
        <div className="rounded-xl bg-surface p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Placement Drive In</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-ink">{plan.placementCountdownDays}</span>
            <span className="text-sm font-semibold text-ink-soft">Days</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Recommended pace: <strong>45 mins daily</strong>
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-paper p-2.5 text-xs text-ink">
            <Clock size={15} className="text-signal" />
            <span>Today's progress: 25 / 45 mins</span>
          </div>
        </div>

        {/* Weekly Completion */}
        <div className="flex flex-col justify-between rounded-xl bg-surface p-6 shadow-panel">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Weekly Roadmap Goal</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-jade">{completedCount}</span>
              <span className="text-sm font-semibold text-ink-soft">/ {plan.weeklySchedule.length} Days Done</span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {progressPct}% of scheduled review milestones finished
            </p>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
              <div
                className="h-full bg-jade transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column: 7-Day Plan vs Priority Deficits */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7-Day Interactive Checklist */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">
              7-Day Structured Practice Schedule
            </h2>
            <span className="text-xs text-ink-soft">Check off tasks as completed</span>
          </div>

          <div className="space-y-3">
            {plan.weeklySchedule.map((item, idx) => (
              <div
                key={item.day}
                onClick={() => handleToggleDay(idx)}
                className={`cursor-pointer flex items-center justify-between gap-4 rounded-xl border p-4.5 transition-all ${
                  item.completed
                    ? 'border-line bg-surface/70 opacity-80'
                    : 'border-line bg-surface shadow-panel hover:border-signal/50'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    className="mt-0.5 text-signal hover:text-signal-deep shrink-0"
                    aria-label={`Toggle ${item.day}`}
                  >
                    {item.completed ? (
                      <CheckSquare size={20} className="text-jade" />
                    ) : (
                      <Square size={20} className="text-ink-faint" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-signal">{item.day}</span>
                      <span className="rounded bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                        {item.category}
                      </span>
                    </div>
                    <p className={`mt-1 font-display text-sm font-semibold truncate ${
                      item.completed ? 'line-through text-ink-faint' : 'text-ink'
                    }`}>
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
                      <span className="flex items-center gap-1"><Clock size={12} /> {item.duration} mins</span>
                      <span>{item.questions} Practice Items</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/interview?category=${encodeURIComponent(item.category)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn-outline shrink-0 text-xs px-3 py-1.5"
                >
                  Start <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Priority Gaps & Action Items */}
        <div className="space-y-6">
          <Panel title="Priority Deficit Domains">
            <p className="text-xs text-ink-soft mb-3">
              Ranked by point deficit relative to your target role:
            </p>
            <div className="space-y-3.5">
              {plan.priorityDomains.map((dom) => (
                <div key={dom.name} className="rounded-xl border border-line bg-paper/40 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-ink">{dom.name}</span>
                    <span className="rounded-md bg-rose-soft px-2 py-0.5 text-xs font-bold text-rose">
                      Gap: {dom.gap}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                    <span>Current: {dom.currentScore}%</span>
                    <span>Target: {dom.targetScore}%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-soft leading-relaxed">
                    <strong>Action:</strong> {dom.recommendedActions}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Quick Practice Shortcuts */}
          <Panel title="Recommended Practice Drills">
            <div className="space-y-2.5">
              <Link
                to="/coding"
                className="flex items-center justify-between rounded-lg border border-line bg-paper p-3 text-xs font-semibold text-ink hover:bg-surface"
              >
                <span>Practice Two Sum & LRU Cache</span>
                <ArrowRight size={14} className="text-signal" />
              </Link>
              <Link
                to="/resume"
                className="flex items-center justify-between rounded-lg border border-line bg-paper p-3 text-xs font-semibold text-ink hover:bg-surface"
              >
                <span>Analyze Resume Question Traps</span>
                <ArrowRight size={14} className="text-signal" />
              </Link>
              <Link
                to="/interview?category=DBMS&difficulty=Intermediate"
                className="flex items-center justify-between rounded-lg border border-line bg-paper p-3 text-xs font-semibold text-ink hover:bg-surface"
              >
                <span>Drill DBMS Isolation Levels</span>
                <ArrowRight size={14} className="text-signal" />
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

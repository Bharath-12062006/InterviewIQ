import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { CATEGORIES, CATEGORY_PHASES, DIFFICULTIES, MODES } from '../../config/constants';
import { greeting } from '../../lib/score';

const selectClass =
  'mt-1.5 w-full rounded-lg border border-white/15 bg-navy-900 px-3 py-2.5 text-sm text-white focus-visible:ring-offset-navy-800';

export default function WelcomeBand({ user, skills }) {
  const navigate = useNavigate();
  const [weakest, second] = [...skills].sort((a, b) => a.score - b.score);
  const [category, setCategory] = useState(
    CATEGORIES.includes(weakest?.name) ? weakest.name : CATEGORIES[0],
  );
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [mode, setMode] = useState(MODES[0]);

  const firstName = (user.name || 'Candidate').trim().split(' ')[0];

  const start = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ category, difficulty, mode });
    navigate(`/interview?${params.toString()}`);
  };

  return (
    <section className="grid gap-6 rounded-xl bg-navy-900 p-6 text-white dark:border dark:border-line lg:grid-cols-5 lg:gap-10 lg:p-8">
      <div className="lg:col-span-3 lg:self-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting()}, {firstName}
        </h1>
        {weakest && second ? (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">
            Your two weakest areas right now are{' '}
            <strong className="font-semibold text-white">{weakest.name}</strong> ({weakest.score}%) and{' '}
            <strong className="font-semibold text-white">{second.name}</strong> ({second.score}%). A
            single focused session on either will move your average the most.
          </p>
        ) : (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">
            Take your first mock interview to see where you stand.
          </p>
        )}
      </div>

      <form onSubmit={start} className="rounded-lg bg-navy-800 p-4 lg:col-span-2" aria-label="Start a mock interview">
        <p className="font-display text-sm font-semibold">Start a mock interview</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-white/60">
            Topic
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
              {CATEGORY_PHASES.map((group) => (
                <optgroup key={group.phase} label={`${group.phase} · ${group.label}`}>
                  {group.items.map((c) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-white/60">
            Interviewer
            <select value={mode} onChange={(e) => setMode(e.target.value)} className={selectClass}>
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="mt-3">
          <legend className="text-xs font-medium text-white/60">Difficulty</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-navy-900 p-1">
            {DIFFICULTIES.map((d) => (
              <label
                key={d}
                className={`cursor-pointer rounded-md py-2 text-center text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-signal ${
                  difficulty === d ? 'bg-white text-navy-900' : 'text-white/70 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={d}
                  checked={difficulty === d}
                  onChange={() => setDifficulty(d)}
                  className="sr-only"
                />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn-primary mt-4 w-full">
          <Play size={16} aria-hidden="true" /> Start interview
        </button>
      </form>
    </section>
  );
}

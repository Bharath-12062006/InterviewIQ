import Panel from '../ui/Panel';
import { scoreTone } from '../../lib/score';

export default function SkillPerformance({ skills, className = '' }) {
  const sorted = [...skills].sort((a, b) => a.score - b.score);

  return (
    <Panel
      title="Technical skills"
      description="Average score by topic, weakest first"
      className={className}
    >
      <ul className="space-y-3.5">
        {sorted.map((s) => {
          const tone = scoreTone(s.score);
          return (
            <li key={s.name} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate font-medium">{s.name}</span>
              <div
                role="progressbar"
                aria-label={`${s.name} score`}
                aria-valuenow={s.score}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-line"
              >
                <div className={`h-full rounded-full ${tone.bg}`} style={{ width: `${s.score}%` }} />
              </div>
              <span className={`text-right font-semibold ${tone.text}`}>{s.score}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-ink-faint">75 and above is strong. Below 60 needs focused practice.</p>
    </Panel>
  );
}

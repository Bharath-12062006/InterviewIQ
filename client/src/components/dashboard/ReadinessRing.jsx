import { Info } from 'lucide-react';
import Panel from '../ui/Panel';
import { readinessBand } from '../../lib/score';

const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

export default function ReadinessRing({ score, basedOn, className = '' }) {
  const offset = CIRC * (1 - Math.min(Math.max(score, 0), 100) / 100);
  const band = readinessBand(score);

  return (
    <Panel title="Placement readiness" className={className}>
      <div className="flex flex-col items-center">
        <div className="relative h-40 w-40" role="img" aria-label={`Estimated placement readiness ${score} percent, ${band}`}>
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="rgb(var(--color-line))" strokeWidth="10" />
            <circle
              cx="64" cy="64" r={RADIUS} fill="none" stroke="rgb(var(--color-saffron))" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <span className="font-display text-4xl font-semibold tracking-tight">{score}%</span>
            <span className="text-sm font-semibold text-saffron">{band}</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-soft">Based on your last {basedOn} interviews</p>
      </div>

      <p className="mt-4 flex gap-2 rounded-lg bg-saffron-soft p-3 text-xs leading-relaxed text-ink-soft">
        <Info size={14} className="mt-0.5 shrink-0 text-saffron" aria-hidden="true" />
        This is an estimate from your practice results. It is not a prediction or guarantee of being hired.
      </p>
    </Panel>
  );
}

import { Link } from 'react-router-dom';
import { CATEGORY_PHASES } from '../../config/constants';

// Phase 1 topics already appear in skills and the quick-start picker.
// These are the later-round categories a student can start directly.
const LATER_PHASES = CATEGORY_PHASES.filter((group) => group.phase !== 'Phase 1');

export default function CategoryPhases() {
  return (
    <section aria-label="Later interview categories" className="grid gap-6 lg:grid-cols-2">
      {LATER_PHASES.map((group) => (
        <div key={group.phase} className="rounded-xl bg-surface p-5 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">{group.phase}</p>
          <h2 className="mt-1 font-display text-base font-semibold text-ink">{group.label}</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{group.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {group.items.map((name) => (
              <li key={name}>
                <Link
                  to={`/interview?category=${encodeURIComponent(name)}&difficulty=Intermediate&mode=Friendly`}
                  className="inline-flex rounded-lg bg-paper px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-signal-soft hover:text-signal-deep"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

import { useSearchParams } from 'react-router-dom';
import { Hammer } from 'lucide-react';

// Shown for routes whose feature arrives in a later phase, so every sidebar
// link works from day one. Query params are echoed to prove the dashboard
// quick-start passes its selection through correctly.
export default function PlaceholderPage({ title, phase, summary, includes }) {
  const [params] = useSearchParams();
  const selected = [...params.entries()];

  return (
    <div className="mx-auto max-w-2xl pt-6">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-signal-soft text-signal">
        <Hammer size={20} aria-hidden="true" />
      </span>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-ink-soft">{summary}</p>

      {selected.length > 0 && (
        <div className="mt-6 rounded-xl bg-surface p-4 shadow-panel">
          <p className="text-sm font-semibold">Your selection was received</p>
          <dl className="mt-2 flex flex-wrap gap-2">
            {selected.map(([k, v]) => (
              <div key={k} className="rounded-md bg-signal-soft px-2.5 py-1 text-xs">
                <dt className="inline text-ink-soft">{k}: </dt>
                <dd className="inline font-semibold text-signal-deep">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-surface p-5 shadow-panel">
        <p className="text-sm font-semibold">Planned for {phase}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
          {includes.map((i) => <li key={i}>{i}</li>)}
        </ul>
      </div>
    </div>
  );
}

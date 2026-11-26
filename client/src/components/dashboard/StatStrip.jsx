const ITEMS = [
  { key: 'interviews', label: 'Interviews completed', suffix: '' },
  { key: 'averageScore', label: 'Average score', suffix: '%' },
  { key: 'codingSolved', label: 'Coding problems solved', suffix: '' },
  { key: 'streakDays', label: 'Practice streak', suffix: ' days' },
];

// gap-px on a line-coloured background draws the dividers at any column count.
export default function StatStrip({ stats }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line shadow-panel lg:grid-cols-4">
      {ITEMS.map(({ key, label, suffix }) => (
        <div key={key} className="bg-surface p-5">
          <dt className="text-sm text-ink-soft">{label}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {stats[key].value}
            <span className="text-lg text-ink-soft">{suffix}</span>
          </dd>
          <dd className="mt-0.5 text-xs text-ink-faint">{stats[key].delta}</dd>
        </div>
      ))}
    </dl>
  );
}

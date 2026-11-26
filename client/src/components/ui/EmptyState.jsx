import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, body, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-signal-soft text-signal">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {actionLabel && (
        <Link to={actionTo} className="btn-primary mt-4">{actionLabel}</Link>
      )}
    </div>
  );
}

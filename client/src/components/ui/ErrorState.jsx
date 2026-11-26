import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl bg-surface p-8 text-center shadow-panel">
      <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-rose-soft text-rose">
        <AlertTriangle size={20} aria-hidden="true" />
      </span>
      <h2 className="font-display text-lg font-semibold">{message}</h2>
      <p className="mt-1 text-sm text-ink-soft">Check your connection and try again.</p>
      {onRetry && <button onClick={onRetry} className="btn-primary mt-5">Try again</button>}
    </div>
  );
}

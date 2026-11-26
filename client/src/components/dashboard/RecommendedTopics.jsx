import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import Panel from '../ui/Panel';
import EmptyState from '../ui/EmptyState';

export default function RecommendedTopics({ topics, className = '' }) {
  return (
    <Panel
      title="Practice next"
      description="Chosen from where you lost the most marks"
      className={className}
      bodyClassName="p-2"
      action={<Link to="/recommendations" className="text-sm font-semibold text-signal hover:text-signal-deep">Full study plan</Link>}
    >
      {topics.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No recommendations yet"
          body="Finish an interview and we will suggest what to practise."
        />
      ) : (
        <ul className="mt-2">
          {topics.map((t) => (
            <li key={t.id}>
              <Link
                to={`/interview?category=${encodeURIComponent(t.category)}`}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-paper"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{t.reason}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-md bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal-deep">{t.category}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    <Clock size={12} aria-hidden="true" /> {t.minutes} min
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

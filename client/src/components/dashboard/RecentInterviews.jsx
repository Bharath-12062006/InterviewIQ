import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import Panel from '../ui/Panel';
import ScorePill from '../ui/ScorePill';
import EmptyState from '../ui/EmptyState';
import { formatDate } from '../../lib/score';

const ROW = 'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 md:grid-cols-[2fr_1fr_1fr_5rem_6rem]';

export default function RecentInterviews({ interviews }) {
  return (
    <Panel
      title="Recent interviews"
      bodyClassName="pb-2 pt-3"
      action={<Link to="/history" className="text-sm font-semibold text-signal hover:text-signal-deep">View all</Link>}
    >
      {interviews.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No interviews yet"
          body="Your completed interviews and their scores will be listed here."
          actionLabel="Start your first interview"
          actionTo="/interview"
        />
      ) : (
        <div>
          <div className={`${ROW} hidden border-b border-line pb-2 text-xs font-medium text-ink-faint md:grid`}>
            <span>Interview</span><span>Date</span><span>Duration</span><span>Score</span><span />
          </div>
          <ul className="divide-y divide-line">
            {interviews.map((iv) => (
              <li key={iv.id} className={`${ROW} py-3.5`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{iv.category}</p>
                  <p className="truncate text-xs text-ink-soft">{iv.mode} · {iv.difficulty}</p>
                </div>
                <span className="hidden text-sm text-ink-soft md:block">{formatDate(iv.date)}</span>
                <span className="hidden text-sm text-ink-soft md:block">{iv.minutes} min</span>
                <span className="justify-self-end md:justify-self-start"><ScorePill score={iv.score} /></span>
                <Link
                  to={`/report/${iv.id}`}
                  className="col-span-2 text-sm font-semibold text-signal hover:text-signal-deep md:col-span-1 md:justify-self-end"
                >
                  View report
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

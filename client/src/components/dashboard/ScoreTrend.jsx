import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Panel from '../ui/Panel';
import EmptyState from '../ui/EmptyState';
import { LineChart as LineIcon } from 'lucide-react';

const TARGET = 75;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-pop">
      <p className="text-white/60">{label}</p>
      <p className="font-semibold">{payload[0].value}% overall</p>
    </div>
  );
}

export default function ScoreTrend({ history, className = '' }) {
  return (
    <Panel
      title="Score trend"
      description="Overall score for each completed interview"
      className={className}
    >
      {history.length < 2 ? (
        <EmptyState
          icon={LineIcon}
          title="Not enough data yet"
          body="Complete two interviews and your progress line will appear here."
          actionLabel="Start an interview"
          actionTo="/interview"
        />
      ) : (
        <div className="h-64" role="img" aria-label={`Score trend over ${history.length} interviews, latest ${history.at(-1).score} percent`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="rgb(var(--color-line))" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--color-ink-faint))', fontSize: 12 }} />
              <YAxis domain={[40, 100]} tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--color-ink-faint))', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--color-line))' }} />
              <ReferenceLine
                y={TARGET}
                stroke="rgb(var(--color-saffron))"
                strokeDasharray="4 4"
                label={{ value: `Target ${TARGET}`, position: 'insideTopRight', fill: 'rgb(var(--color-saffron))', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="rgb(var(--color-signal))"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: 'rgb(var(--color-surface))', stroke: 'rgb(var(--color-signal))', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

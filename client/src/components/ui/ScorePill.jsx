import { scoreTone } from '../../lib/score';

export default function ScorePill({ score }) {
  const tone = scoreTone(score);
  return (
    <span
      className={`inline-flex min-w-[3.25rem] items-center justify-center rounded-full px-2.5 py-1 text-sm font-semibold ${tone.soft} ${tone.text}`}
      title={tone.name}
    >
      {score}%
    </span>
  );
}

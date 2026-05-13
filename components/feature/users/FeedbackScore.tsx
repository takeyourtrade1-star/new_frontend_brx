import { Star } from 'lucide-react';

interface FeedbackScoreProps {
  score_pct: number | null | undefined;
  count: number | undefined;
}

function getScoreColor(score: number): { text: string; bg: string } {
  if (score >= 95) return { text: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (score >= 85) return { text: 'text-amber-700', bg: 'bg-amber-50' };
  return { text: 'text-red-700', bg: 'bg-red-50' };
}

export function FeedbackScore({ score_pct, count }: FeedbackScoreProps) {
  const hasEnoughData = typeof count === 'number' && count >= 3 && score_pct != null;

  if (!hasEnoughData) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        <Star className="h-3 w-3" />
        Nessuna recensione
      </span>
    );
  }

  const { text, bg } = getScoreColor(score_pct as number);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${text} ${bg}`}
      title={`${count} recensioni`}
    >
      <Star className="h-3 w-3 fill-current" />
      {(score_pct as number).toFixed(1)}%
      <span className="font-normal opacity-75">({count})</span>
    </span>
  );
}

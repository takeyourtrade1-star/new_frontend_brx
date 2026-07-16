'use client';

import Link from 'next/link';
import { Radio, Swords, UsersRound } from 'lucide-react';
import { useLiveTournaments } from '@/lib/hooks/use-live-tournaments';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

function formatLabel(format: string) {
  return format.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function TorneiLiveCarousel({ useLightText = false }: { useLightText?: boolean }) {
  const { t } = useTranslation();
  const { data: tournaments = [], isLoading } = useLiveTournaments();

  return (
    <div className="relative z-10 flex min-h-[142px] flex-col gap-2.5 px-5 pb-3">
      {isLoading && (
        <div className="space-y-2.5">
          <Skeleton className="h-[52px] w-full bg-white/15" />
          <Skeleton className="h-[52px] w-full bg-white/15" />
        </div>
      )}

      {!isLoading && tournaments.map((tournament) => (
        <Link
          key={tournament.id}
          href={getTournamentsPortalUrl(`/tornei/${tournament.id}/live`)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
            useLightText
              ? 'border-violet-300/20 bg-slate-950/35 hover:border-violet-300/45 hover:bg-violet-500/15'
              : 'border-violet-200 bg-violet-50/75 hover:border-violet-300 hover:bg-violet-100/70',
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
            <Radio className="h-4 w-4 animate-pulse" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn('block truncate text-sm font-bold', useLightText ? 'text-white' : 'text-slate-900')}>
              {formatLabel(tournament.format)}
            </span>
            <span className={cn('mt-0.5 flex items-center gap-1 text-[11px] font-medium', useLightText ? 'text-slate-300' : 'text-slate-600')}>
              <Swords className="h-3 w-3" aria-hidden />
              {tournament.mode === 'heads-up' ? t('home.tornei.modeHeadsUp') : formatLabel(tournament.mode)}
            </span>
          </span>
          <span className={cn('flex shrink-0 items-center gap-1 text-[11px] font-bold', useLightText ? 'text-violet-200' : 'text-violet-700')}>
            <UsersRound className="h-3.5 w-3.5" aria-hidden />
            {tournament.participantsCount}/{tournament.maxPlayers}
          </span>
        </Link>
      ))}

      {!isLoading && tournaments.length === 0 && (
        <p className={cn('flex min-h-[80px] items-center justify-center rounded-xl border px-4 text-center text-xs font-medium', useLightText ? 'border-white/15 bg-slate-950/35 text-slate-200' : 'border-violet-100 bg-violet-50 text-slate-600')}>
          {t('home.tornei.empty')}
        </p>
      )}
    </div>
  );
}

'use client';

import { SetIconBadge } from '@/components/ui/SetIconBadge';
import type { SetResult } from '@/lib/search/global-search-types';

export function SetSearchResultRow({
  result,
  onNavigate,
}: {
  result: SetResult;
  onNavigate: () => void;
}) {
  const year = result.release_date ? result.release_date.slice(0, 4) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[#EEEEEE] bg-white"
    >
      <div className="flex-shrink-0 flex items-center justify-center">
        <SetIconBadge
          setIconUri={result.set_icon_uri}
          setCode={result.set_code}
          setName={result.set_name}
          gameSlug={result.game_slug}
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-[#333333] truncate block" title={result.set_name}>
          {result.set_name}
        </span>
        {year && <span className="text-xs text-[#777777]">{year}</span>}
      </div>
      <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
        {result.game_slug}
      </span>
    </div>
  );
}

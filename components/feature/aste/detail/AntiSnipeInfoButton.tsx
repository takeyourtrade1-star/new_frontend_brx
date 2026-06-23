import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AntiSnipeInfoButton({
  hint,
  ariaLabel,
  buttonClassName,
}: {
  hint: string;
  ariaLabel: string;
  buttonClassName?: string;
}) {
  return (
    <span className="group/anti-snipe-info relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/40',
          buttonClassName ?? 'text-gray-400 hover:bg-gray-100 hover:text-[#1D3160]',
        )}
        aria-label={ariaLabel}
        title={hint}
      >
        <Info className="h-3 w-3" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-52 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-[10px] font-medium leading-snug text-gray-700 shadow-lg group-hover/anti-snipe-info:block group-focus-within/anti-snipe-info:block"
      >
        {hint}
      </span>
    </span>
  );
}

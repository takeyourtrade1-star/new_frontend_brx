import { cn } from '@/lib/utils';

type BetaBadgeVariant = 'nav' | 'dark';

const variantStyles: Record<BetaBadgeVariant, string> = {
  nav:
    'rounded-md border border-[#1D3160]/12 bg-[#1D3160]/[0.05] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#1D3160]/75 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  dark:
    'rounded-md border border-white/18 bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/75 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
};

export function BetaBadge({
  variant = 'nav',
  className,
}: {
  variant?: BetaBadgeVariant;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center', variantStyles[variant], className)}>
      Beta
    </span>
  );
}

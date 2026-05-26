'use client';

import { cn } from '@/lib/utils';
import { getCardLanguageFlagCode, getCardLanguageLabel } from '@/lib/card-languages';
import { getIsoFlagComponent } from '@/lib/card-language-flag-icons';

type CardLanguageFlagProps = {
  code: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Se omesso, usa getCardLanguageLabel(code). */
  title?: string;
};

const sizeMap = {
  xs: 'h-3 w-[1.125rem]',
  sm: 'h-4 w-6',
  md: 'h-5 w-[1.875rem]',
};

const monogramSize = {
  xs: 'h-3 min-w-[1.125rem] px-0.5 text-[8px]',
  sm: 'h-4 min-w-6 px-1 text-[9px]',
  md: 'h-5 min-w-[1.875rem] px-1 text-[10px]',
};

export function CardLanguageFlag({ code, size = 'sm', className, title }: CardLanguageFlagProps) {
  const flagCode = getCardLanguageFlagCode(code);
  const label = title ?? getCardLanguageLabel(code);
  const FlagSvg = getIsoFlagComponent(flagCode);

  if (FlagSvg) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-black/10',
          sizeMap[size],
          className
        )}
        title={label}
        aria-label={label}
        role="img"
      >
        <FlagSvg className="h-full w-full" aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm bg-zinc-200 font-bold uppercase text-zinc-600 ring-1 ring-black/10',
        monogramSize[size],
        className
      )}
      title={label}
      aria-label={label}
    >
      {flagCode.slice(0, 2)}
    </span>
  );
}

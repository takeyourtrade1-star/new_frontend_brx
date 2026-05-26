'use client';

import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn } from '@/lib/utils';
import {
  getCardLanguageEmoji,
  getCardLanguageFlagCode,
  getCardLanguageLabel,
  hasCardLanguageSvgFlag,
} from '@/lib/card-languages';

type CardLanguageFlagProps = {
  code: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Se omesso, usa getCardLanguageLabel(code). */
  title?: string;
};

const sizeMap = {
  xs: 'text-sm leading-none',
  sm: 'text-base leading-none',
  md: 'text-lg leading-none',
};

export function CardLanguageFlag({ code, size = 'sm', className, title }: CardLanguageFlagProps) {
  const flagCode = getCardLanguageFlagCode(code);
  const label = title ?? getCardLanguageLabel(code);
  const emoji = getCardLanguageEmoji(flagCode);

  if (hasCardLanguageSvgFlag(flagCode)) {
    return <FlagIcon country={flagCode} size={size} title={label} className={className} />;
  }

  if (emoji) {
    return (
      <span
        className={cn('inline-flex shrink-0 select-none', sizeMap[size], className)}
        title={label}
        aria-label={label}
        role="img"
      >
        {emoji}
      </span>
    );
  }

  return <FlagIcon country={flagCode} size={size} title={label} className={className} />;
}

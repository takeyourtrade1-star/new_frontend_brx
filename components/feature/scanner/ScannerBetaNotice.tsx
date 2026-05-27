'use client';

import { BetaBadge } from '@/components/ui/BetaBadge';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export function ScannerBetaNotice({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0 right-0 z-30 flex justify-center px-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex max-w-md items-center gap-2 rounded-full border border-white/12 bg-[#0a0f1a]/45 px-3 py-1.5 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
        <BetaBadge variant="dark" />
        <p className="text-[10px] font-medium leading-snug text-white/65 sm:text-[11px]">
          {t('scanner.betaNotice')}
        </p>
      </div>
    </div>
  );
}

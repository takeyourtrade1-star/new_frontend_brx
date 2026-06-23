'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

type AuctionCreateStepperProps = {
  isEmbedded: boolean;
  stepperLabels: string[];
  activeStepIndex: number;
  currentStepNumber: number;
  totalSteps: number;
};

export function AuctionCreateStepper({
  isEmbedded,
  stepperLabels,
  activeStepIndex,
  currentStepNumber,
  totalSteps,
}: AuctionCreateStepperProps) {
  const { t } = useTranslation();

  if (isEmbedded) {
    return (
      <div className="mb-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t('auctions.createProgress', { current: currentStepNumber, total: totalSteps })}
          </span>
        </div>
        <div className="mt-1.5 flex gap-[3px]">
          {stepperLabels.map((label, i) => {
            const active = i === activeStepIndex;
            const complete = i < activeStepIndex;
            return (
              <div
                key={`${label}-${i}`}
                className={cn(
                  'h-[3px] flex-1 rounded-full transition-all duration-300',
                  complete ? 'bg-primary' : active ? 'bg-[#1D3160]' : 'bg-zinc-200'
                )}
                aria-current={active ? 'step' : undefined}
                title={label}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-left">
          {stepperLabels[activeStepIndex] ?? ''}
        </p>
        <span className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 sm:text-right">
          {t('auctions.createProgress', { current: currentStepNumber, total: totalSteps })}
        </span>
      </div>
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#FF7300] transition-[width] duration-700 ease-out"
          style={{
            width: `${totalSteps > 1 ? (activeStepIndex / (totalSteps - 1)) * 100 : 100}%`,
          }}
        />
      </div>
    </div>
  );
}

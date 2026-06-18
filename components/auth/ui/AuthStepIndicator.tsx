'use client';

import { cn } from '@/lib/utils';

interface AuthStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  align?: 'left' | 'center';
}

export function AuthStepIndicator({
  currentStep,
  totalSteps,
  align = 'left',
}: AuthStepIndicatorProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-center gap-2',
        align === 'left' ? 'justify-start' : 'justify-center'
      )}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <div
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              isActive ? 'w-8 bg-global-bg-start' : 'w-4',
              isDone ? 'bg-global-bg-start/60' : !isActive ? 'bg-black/10' : undefined
            )}
          />
        );
      })}
    </div>
  );
}

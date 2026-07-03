'use client';

import { cn } from '@/lib/utils';
import { Rows3, Grid2x2 } from 'lucide-react';

export interface ViewToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ViewToggleProps<T extends string> {
  current: T;
  onChange: (value: T) => void;
  options?: ViewToggleOption<T>[];
  className?: string;
  listValue?: T;
  gridValue?: T;
  listLabel?: string;
  gridLabel?: string;
}

export function ViewToggle<T extends string>({
  current,
  onChange,
  options,
  className,
  listValue = 'list' as T,
  gridValue = 'grid' as T,
  listLabel = 'Lista',
  gridLabel = 'Griglia',
}: ViewToggleProps<T>) {
  const defaultOptions: ViewToggleOption<T>[] = [
    {
      value: listValue,
      label: listLabel,
      icon: Rows3,
    },
    {
      value: gridValue,
      label: gridLabel,
      icon: Grid2x2,
    },
  ];

  const actualOptions = options || defaultOptions;

  return (
    <div className={cn('flex items-center gap-1.5', className)} role="group">
      {actualOptions.map((opt) => {
        const isActive = current === opt.value;
        const Icon = opt.icon || (opt.value === listValue ? Rows3 : Grid2x2);
        
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-label={opt.label}
            title={opt.label}
            aria-pressed={isActive}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 border outline-none active:scale-95 shadow-sm',
              isActive
                ? 'bg-[#FF7300] border-[#FF7300] text-white shadow-[0_2px_8px_rgba(255,115,0,0.25)] hover:bg-[#e66700]'
                : 'bg-white border-slate-200 text-[#334155] hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardLanguageOption } from '@/lib/card-languages';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';

type CardLanguageSelectProps = {
  options: CardLanguageOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function CardLanguageSelect({
  options,
  value,
  onChange,
  className,
  disabled = false,
}: CardLanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.code === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-left text-[13px] font-medium text-zinc-900 transition-colors',
          'focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selected ? (
            <>
              <CardLanguageFlag code={selected.code} size="xs" />
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-zinc-500">—</span>
          )}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-[130] mt-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => {
            const isSelected = opt.code === value;
            return (
              <li key={opt.canonical} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:bg-zinc-50',
                    isSelected && 'bg-primary/5 font-semibold text-primary'
                  )}
                  onClick={() => {
                    onChange(opt.code);
                    setOpen(false);
                  }}
                >
                  <CardLanguageFlag code={opt.code} size="xs" />
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

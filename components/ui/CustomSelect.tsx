'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CustomSelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

export type CustomSelectProps = {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = Math.min(options.length * 36, 288); // ~36px per item, max 72*4 = 288
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }
    setMenuPos({
      top,
      left: rect.left,
      width: rect.width,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    calcPos();
    function onResize() {
      calcPos();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, calcPos]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
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
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-left text-[13px] font-medium text-zinc-900 transition-colors',
          'focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selected ? (
            <>
              {selected.icon}
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-zinc-500">{placeholder ?? '—'}</span>
          )}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open &&
        menuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="z-[200] max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:bg-zinc-50',
                    isSelected && 'bg-primary/5 font-semibold text-primary',
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.icon}
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

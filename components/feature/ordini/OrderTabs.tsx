'use client';

import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrderTab<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface OrderTabsProps<T extends string> {
  leftTabs: OrderTab<T>[];
  rightTabs: OrderTab<T>[];
  activeTab: T;
  onChange: (id: T) => void;
}

export function OrderTabs<T extends string>({
  leftTabs,
  rightTabs,
  activeTab,
  onChange,
}: OrderTabsProps<T>) {
  const [stickyTop, setStickyTop] = useState(64);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const measure = () => {
      setStickyTop(header.getBoundingClientRect().height);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(header);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Chiusura dropdown mobile: click fuori + Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (mobileRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const allTabs = [...leftTabs, ...rightTabs];
  const active = allTabs.find((tab) => tab.id === activeTab) ?? allTabs[0];

  const renderTab = (tab: OrderTab<T>, position: 'left' | 'right') => {
    const isActive = activeTab === tab.id;
    const isLeft = position === 'left';
    const hasCount = typeof tab.count === 'number';
    const Icon = tab.icon;

    return (
      <button
        key={tab.id}
        type="button"
        title={tab.label}
        onClick={() => onChange(tab.id)}
        className={cn(
          'group inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
          isLeft
            ? isActive
              ? 'bg-[#FF7300] text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
            : isActive
              ? 'bg-gray-700 text-white shadow-sm'
              : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-800',
        )}
      >
        <Icon
          className={cn('h-3.5 w-3.5 shrink-0 order-tab-icon', isActive && 'order-tab-icon-active')}
          aria-hidden
        />
        <span className="ml-1.5 whitespace-nowrap">{tab.label}</span>
        {hasCount && (
          <span
            className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600',
            )}
          >
            {tab.count}
          </span>
        )}
      </button>
    );
  };

  const ActiveIcon = active?.icon;

  return (
    <div
      className={cn(
        'sticky z-40 -mx-4 px-4 md:mx-0 md:px-0',
        'md:border-b md:border-gray-200',
        'bg-[#F5F4F0]/95 py-2 backdrop-blur-md md:py-2 md:pb-3 md:mb-6',
      )}
      style={{ top: stickyTop }}
    >
      {/* MOBILE: dropdown stilizzato per scegliere l'argomento */}
      <div ref={mobileRef} className="relative md:hidden">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            'group flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left shadow-sm transition-colors',
            'focus:border-[#FF7300]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7300]/15',
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {ActiveIcon && (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/10 text-[#FF7300]">
                <ActiveIcon className="h-4 w-4 order-tab-icon order-tab-icon-active" aria-hidden />
              </span>
            )}
            <span className="truncate text-sm font-bold uppercase tracking-wide text-gray-900">
              {active?.label}
            </span>
            {typeof active?.count === 'number' && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-gray-600">
                {active.count}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', menuOpen && 'rotate-180')}
            aria-hidden
          />
        </button>

        {menuOpen && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
          >
            {allTabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isFirstRight = index === leftTabs.length && rightTabs.length > 0;
              return (
                <div key={tab.id}>
                  {isFirstRight && <div className="my-1 h-px bg-gray-100" />}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(tab.id);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      isActive ? 'bg-[#FF7300]/10' : 'hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        isActive ? 'bg-[#FF7300] text-white' : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      <Icon
                        className={cn('h-4 w-4 order-tab-icon', isActive && 'order-tab-icon-active')}
                        aria-hidden
                      />
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-wide',
                        isActive ? 'text-[#FF7300]' : 'text-gray-700',
                      )}
                    >
                      {tab.label}
                    </span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                          isActive ? 'bg-[#FF7300]/15 text-[#FF7300]' : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                    {isActive && <Check className="h-4 w-4 shrink-0 text-[#FF7300]" aria-hidden />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DESKTOP: pillole nei due gruppi */}
      <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-x-2 md:gap-y-2">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
          {leftTabs.map((tab) => renderTab(tab, 'left'))}
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1.5">
          {rightTabs.map((tab) => renderTab(tab, 'right'))}
        </div>
      </div>
    </div>
  );
}

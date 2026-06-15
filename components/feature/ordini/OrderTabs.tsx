'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
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
          'inline-flex items-center justify-center rounded-full text-xs font-semibold uppercase tracking-wide transition-colors',
          isActive ? 'px-3.5 py-1.5' : 'px-2.5 py-1.5 md:px-3.5',
          isLeft
            ? isActive
              ? 'bg-[#FF7300] text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
            : isActive
              ? 'bg-gray-700 text-white shadow-sm'
              : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-700',
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span
          className={cn(
            'ml-1.5 whitespace-nowrap',
            isActive ? 'inline' : 'hidden md:inline',
          )}
        >
          {tab.label}
        </span>
        {hasCount && (
          <span
            className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600',
            )}
          >
            {tab.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className={cn(
        'sticky z-40 md:static -mx-4 px-4 md:mx-0 md:px-0',
        'border-b border-white/60 md:border-gray-200',
        'bg-[#F5F4F0]/95 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none',
        'py-2 md:mb-6 md:pb-3',
      )}
      style={{ top: stickyTop }}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
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

'use client';

import { useState } from 'react';
import Link from 'next/link';

export type ConditionCode = 'NM' | 'SP' | 'MP' | 'PL' | 'PO';

interface ConditionMeta {
  label: string;
  color: string;
  description: string;
}

const CONDITION_MAP: Record<ConditionCode, ConditionMeta> = {
  NM: {
    label: 'Near Mint',
    color: '#10B981',
    description: 'Carta praticamente nuova. Nessun segno di usura visibile.',
  },
  SP: {
    label: 'Slightly Played',
    color: '#84CC16',
    description: 'Usura minima. Possibili micro-graffi o leggera opacità.',
  },
  MP: {
    label: 'Moderately Played',
    color: '#F59E0B',
    description: 'Usura moderata e visibile. Graffi, opacità diffusa.',
  },
  PL: {
    label: 'Played',
    color: '#F97316',
    description: 'Usura significativa. Graffi profondi, bordi consumati.',
  },
  PO: {
    label: 'Poor',
    color: '#EF4444',
    description: 'Condizione scadente. Danni severi: pieghe, strappi.',
  },
};

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', { box: string; text: string }> = {
  sm: { box: 'w-5 h-5', text: 'text-[10px]' },
  md: { box: 'w-[26px] h-[26px]', text: 'text-[11px]' },
  lg: { box: 'w-8 h-8', text: 'text-[13px]' },
};

interface ConditionBadgeProps {
  condition: ConditionCode;
  size?: 'sm' | 'md' | 'lg';
}

export function ConditionBadge({ condition, size = 'md' }: ConditionBadgeProps) {
  const [visible, setVisible] = useState(false);
  const meta = CONDITION_MAP[condition];
  const { box, text } = SIZE_CLASS[size];

  const bgColor = meta?.color ?? '#9CA3AF';
  const href = `/leggenda/condizioni#${condition}`;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Link
        href={href}
        className={`inline-flex items-center justify-center rounded font-mono font-bold text-white cursor-pointer transition-opacity duration-150 ease-out ${box} ${text}`}
        style={{ backgroundColor: bgColor }}
        aria-label={meta?.label ?? condition}
      >
        {condition}
      </Link>

      {visible && meta && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2">
          <span className="block rounded-xl border border-white/10 bg-white/80 p-3 shadow-lg backdrop-blur-md">
            <span className="block text-sm font-bold text-gray-900">{meta.label}</span>
            <span className="mt-0.5 block text-xs leading-snug text-gray-500">{meta.description}</span>
            <Link
              href={href}
              className="pointer-events-auto mt-2 inline-block text-[10px] font-semibold text-blue-600 hover:underline"
            >
              Vedi leggenda →
            </Link>
          </span>
        </span>
      )}
    </span>
  );
}

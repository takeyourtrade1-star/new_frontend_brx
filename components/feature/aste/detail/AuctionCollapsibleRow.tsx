import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function AuctionCollapsibleRow({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2 text-left transition hover:border-gray-300 hover:bg-gray-50"
        aria-expanded={expanded}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-1 pt-2">{children}</div>
      </div>
    </div>
  );
}

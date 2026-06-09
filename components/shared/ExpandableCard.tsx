'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableCardProps {
  summary: React.ReactNode;
  details: React.ReactNode;
  className?: string;
}

export function ExpandableCard({ summary, details, className }: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between p-3 sm:p-4 gap-2">
        <div className="flex-1 min-w-0">{summary}</div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="ml-2 mt-0.5 shrink-0 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label={expanded ? 'Comprimi' : 'Espandi'}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-3 sm:p-4">
          {details}
        </div>
      )}
    </article>
  );
}

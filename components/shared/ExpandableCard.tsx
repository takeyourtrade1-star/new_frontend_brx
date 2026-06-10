'use client';

import { useRef, useState, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableCardProps {
  summary: React.ReactNode;
  details: React.ReactNode;
  className?: string;
}

export function ExpandableCard({ summary, details, className }: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState('0px');
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (expanded) {
      const height = el.scrollHeight;
      setMaxHeight(`${height}px`);
      const timer = setTimeout(() => {
        setMaxHeight('none');
      }, 400);
      return () => clearTimeout(timer);
    } else {
      const height = el.scrollHeight;
      setMaxHeight(`${height}px`);
      requestAnimationFrame(() => {
        setMaxHeight('0px');
      });
    }
  }, [expanded]);

  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between p-3 sm:p-4 gap-2 text-left"
      >
        <div className="flex-1 min-w-0">{summary}</div>
        <span
          className={cn(
            'ml-2 mt-0.5 shrink-0 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-all duration-300 ease-out hover:bg-gray-100 hover:text-gray-600',
            expanded && 'rotate-180 bg-gray-100 text-gray-600'
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div
        style={{
          maxHeight,
          opacity: expanded ? 1 : 0,
          transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-out',
        }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="border-t border-gray-100 bg-gray-50/60 p-3 sm:p-4">
          {details}
        </div>
      </div>
    </article>
  );
}

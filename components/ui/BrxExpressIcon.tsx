'use client';

import { cn } from '@/lib/utils';

interface BrxExpressIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrxExpressIcon({ className, size = 'md' }: BrxExpressIconProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 2L3.5 14h6.75L8.5 22l10-12h-6.75L13.5 2z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Component per il badge BRX Express completo
export function BrxExpressBadge({ className }: { className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg",
      className
    )}>
      <BrxExpressIcon size="sm" />
      <span>BRX</span>
    </div>
  );
}
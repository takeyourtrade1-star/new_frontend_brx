'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MOBILE_HEADER_ICON_CLASS = 'h-6 w-6 shrink-0 text-[#FF7300]';

const triggerClass =
  'flex items-center justify-center rounded-lg p-2 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]';

type MobileHeaderNavIconButtonProps = {
  as: 'button';
  onClick: () => void;
  'aria-label': string;
  'aria-expanded': boolean;
  menuOpen?: boolean;
  showChevron?: boolean;
  className?: string;
  children: React.ReactNode;
};

type MobileHeaderNavIconLinkProps = {
  as: 'link';
  href: string;
  'aria-label': string;
  className?: string;
  children: React.ReactNode;
};

export function MobileHeaderNavIcon(
  props: MobileHeaderNavIconButtonProps | MobileHeaderNavIconLinkProps,
) {
  const { className, children } = props;

  if (props.as === 'link') {
    return (
      <Link
        href={props.href}
        className={cn(triggerClass, className)}
        aria-label={props['aria-label']}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(triggerClass, className)}
      aria-label={props['aria-label']}
      aria-expanded={props['aria-expanded']}
      aria-haspopup="true"
    >
      {children}
      {props.showChevron ? (
        <ChevronDown
          className={cn(
            'ml-0.5 h-4 w-4 shrink-0 text-[#FF7300] transition-transform',
            props.menuOpen && 'rotate-180',
          )}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

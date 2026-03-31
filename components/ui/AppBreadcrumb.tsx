'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type AppBreadcrumbItem = {
  key?: string;
  label: ReactNode;
  href?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  isCurrent?: boolean;
};

type AppBreadcrumbVariant = 'default' | 'accountLight' | 'accountDark' | 'topbarBlue';

type VariantStyles = {
  nav: string;
  list: string;
  item: string;
  separator: string;
  link: string;
  muted: string;
  current: string;
  icon: string;
  prefix?: string;
};

const VARIANT_STYLES: Record<AppBreadcrumbVariant, VariantStyles> = {
  default: {
    nav: '',
    list: 'gap-0',
    item: 'gap-0',
    separator: 'mx-1 text-gray-400 select-none',
    link: 'text-gray-500 transition-colors hover:text-gray-900 hover:underline',
    muted: 'text-gray-500',
    current: 'font-medium text-gray-900',
    icon: 'shrink-0',
  },
  accountLight: {
    nav: '',
    list: 'gap-0',
    item: 'gap-0',
    separator: 'mx-1 text-gray-400 select-none',
    link: 'text-gray-700 transition-colors hover:text-gray-900',
    muted: 'text-gray-700',
    current: 'font-medium text-gray-900',
    icon: 'shrink-0',
  },
  accountDark: {
    nav: '',
    list: 'gap-0',
    item: 'gap-0',
    separator: 'mx-1 text-white/60 select-none',
    link: 'text-white/90 transition-colors hover:text-white',
    muted: 'text-white/90',
    current: 'text-white',
    icon: 'shrink-0',
  },
  topbarBlue: {
    nav: 'border-t border-white/15 bg-global-bg-end px-2 py-2 text-sm text-white/95 sm:px-3',
    list: 'gap-1.5',
    item: 'gap-1.5',
    separator: 'text-white/50 select-none',
    link: 'truncate text-white/90 transition-colors hover:text-white hover:underline',
    muted: 'truncate text-white/90',
    current: 'truncate font-medium text-white',
    icon: 'shrink-0',
    prefix: 'mr-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/20',
  },
};

type AppBreadcrumbProps = {
  items: AppBreadcrumbItem[];
  ariaLabel?: string;
  className?: string;
  variant?: AppBreadcrumbVariant;
  hideOnMobile?: boolean;
  prefix?: ReactNode;
};

export function AppBreadcrumb({
  items,
  ariaLabel = 'Breadcrumb',
  className,
  variant = 'default',
  hideOnMobile = true,
  prefix,
}: AppBreadcrumbProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'w-full items-center',
        hideOnMobile ? 'hidden sm:flex' : 'flex',
        styles.nav,
        className
      )}
    >
      {prefix ? (
        <span className={cn(styles.prefix)} aria-hidden>
          {prefix}
        </span>
      ) : null}

      <ol className={cn('flex min-w-0 flex-wrap items-center', styles.list)}>
        {items.map((item, index) => {
          const isCurrent = typeof item.isCurrent === 'boolean' ? item.isCurrent : index === items.length - 1;
          const key = item.key ?? `${index}-${typeof item.label === 'string' ? item.label : 'crumb'}`;

          return (
            <li key={key} className={cn('flex min-w-0 items-center', styles.item)}>
              {index > 0 && (
                <span className={styles.separator} aria-hidden>
                  /
                </span>
              )}

              {isCurrent ? (
                <span className={cn('inline-flex min-w-0 items-center gap-1', styles.current)} aria-current="page">
                  {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                  {item.iconOnly ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  aria-label={item.ariaLabel}
                  className={cn('inline-flex min-w-0 items-center gap-1', styles.link)}
                >
                  {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                  {item.iconOnly ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </Link>
              ) : (
                <span className={cn('inline-flex min-w-0 items-center gap-1', styles.muted)}>
                  {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                  {item.iconOnly ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

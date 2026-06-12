'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Shield, Cookie, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

const LEGAL_LINKS = [
  { href: '/legal/condizioni', labelKey: 'legal.nav.terms' as const, icon: FileText },
  { href: '/legal/privacy', labelKey: 'legal.nav.privacy' as const, icon: Shield },
  { href: '/legal/cookie', labelKey: 'legal.nav.cookies' as const, icon: Cookie },
  { href: '/legal/norme', labelKey: 'legal.nav.rules' as const, icon: Scale },
] as const;

export function LegalNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md',
        className
      )}
      aria-label={t('legal.nav.title')}
    >
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
        {t('legal.nav.title')}
      </p>
      <ul className="space-y-1">
        {LEGAL_LINKS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-white text-[#1D3160] shadow-md shadow-black/10'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#FF7300]' : 'text-white/60')} aria-hidden />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

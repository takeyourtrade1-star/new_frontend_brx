'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';

type CartEmptyStateProps = {
  continueShoppingHref: string;
};

export function CartEmptyState({ continueShoppingHref }: CartEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl border border-white/50 bg-white/50 px-8 py-16 text-center shadow-[0_12px_48px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-black/5">
        <ShoppingBag className="h-9 w-9 text-neutral-400" strokeWidth={1.25} />
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight text-neutral-900">
        {t('cart.emptyTitle')}
      </h2>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-neutral-500">
        {t('cart.empty')}
      </p>
      <Button
        asChild
        className="h-11 rounded-2xl bg-primary px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,115,0,0.3)] hover:opacity-95"
      >
        <Link href={continueShoppingHref}>{t('cart.browse')}</Link>
      </Button>
    </div>
  );
}

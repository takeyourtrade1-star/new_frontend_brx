'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, RotateCcw, Search, Trash2, X } from 'lucide-react';

import { useLocalScanSession } from '@/hooks/scanner/useLocalScanSession';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export default function ScannerReviewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    session,
    hydrated,
    totals,
    removeItem,
    setItemStatus,
    resetSession,
  } = useLocalScanSession();

  const clearBatch = async () => {
    if (!window.confirm(t('scanner.review.clearConfirm'))) return;
    await resetSession();
  };

  return (
    <main className="min-h-screen bg-[#07101d] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07101d]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/scanner')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
            aria-label={t('scanner.review.backToScanner')}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">{t('scanner.review.title')}</h1>
            <p className="text-xs text-white/55">
              {t('scanner.review.summary', {
                count: totals.captured,
                review: totals.needsReview,
              })}
            </p>
          </div>
          {session.items.length > 0 && (
            <button
              type="button"
              onClick={() => void clearBatch()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300"
              aria-label={t('scanner.review.clear')}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 pb-36">
        {!hydrated ? (
          <div className="flex justify-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#FF7300]" />
          </div>
        ) : session.items.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-14 text-center">
            <RotateCcw className="mx-auto h-10 w-10 text-[#FF7300]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">{t('scanner.review.emptyTitle')}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
              {t('scanner.review.emptyBody')}
            </p>
            <Link
              href="/scanner"
              className="mt-6 inline-flex rounded-2xl bg-[#FF7300] px-5 py-3 text-sm font-bold text-[#1a0f08]"
            >
              {t('scanner.review.backToScanner')}
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {session.items.map((item, index) => {
              const confidence = Math.round(item.result.confidence * 100);
              const needsReview = item.status === 'needs_review';
              const confirmed = item.status === 'confirmed';
              return (
                <article
                  key={item.id}
                  className={cn(
                    'rounded-2xl border bg-white/[0.06] p-3 shadow-lg',
                    needsReview ? 'border-amber-400/35' : 'border-white/10',
                  )}
                >
                  <div className="flex gap-3">
                    <div className="relative h-[98px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-white/10">
                      {item.result.image_uri ? (
                        <Image
                          src={item.result.image_uri}
                          alt={item.result.card_name}
                          fill
                          sizes="70px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
                            #{index + 1}
                          </p>
                          <h2 className="truncate font-semibold text-white">{item.result.card_name}</h2>
                          <p className="truncate text-xs text-white/50">{item.result.set_name}</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-bold',
                            needsReview
                              ? 'bg-amber-400 text-black'
                              : confirmed
                              ? 'bg-emerald-400 text-emerald-950'
                              : 'bg-white/10 text-white/70',
                          )}
                        >
                          {confirmed
                            ? t('scanner.review.confirmed')
                            : needsReview
                            ? t('scanner.review.needsReview')
                            : t('scanner.review.recognized')}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/45">
                        {t('scanner.review.confidence', { pct: confidence })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => setItemStatus(item.id, 'confirmed')}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-bold text-emerald-950"
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      {t('scanner.review.confirm')}
                    </button>
                    <Link
                      href={item.result.search_url}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white"
                    >
                      <Search className="h-4 w-4 text-[#FF7300]" aria-hidden />
                      {t('scanner.review.openSearch')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setItemStatus(item.id, 'rejected')}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55"
                      aria-label={t('scanner.review.reject')}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/15 bg-red-500/10 text-red-300"
                      aria-label={t('scanner.review.remove')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {session.items.length > 0 && (
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#07101d]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3">
            <Link
              href="/scanner"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              {t('scanner.review.continueScanning')}
            </Link>
            <button
              type="button"
              disabled
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/35"
              title={t('scanner.review.inventoryBlockedBody')}
            >
              {t('scanner.review.inventoryBlocked')}
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-white/35">
            {t('scanner.review.inventoryBlockedBody')}
          </p>
        </footer>
      )}
    </main>
  );
}

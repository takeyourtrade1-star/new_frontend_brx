'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  MARKETPLACE_REPORT_REASONS,
  type MarketplaceReportContext,
  type MarketplaceReportReason,
} from '@/lib/marketplace/report-reasons';
import {
  MarketplaceReportError,
  submitMarketplaceReport,
} from '@/lib/marketplace/submit-marketplace-report';

type MarketplaceReportModalProps = {
  open: boolean;
  context: MarketplaceReportContext | null;
  onClose: () => void;
};

export function MarketplaceReportModal({ open, context, onClose }: MarketplaceReportModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<MarketplaceReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(null);
    setDetails('');
    setSubmitting(false);
    setError(null);
    setSuccess(false);
  }, [open, context?.referenceId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, submitting]);

  if (!open || !context) return null;

  const contextLabel =
    context.kind === 'auction'
      ? t('marketplace.report.contextAuction')
      : t('marketplace.report.contextListing');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError(t('marketplace.report.reasonRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitMarketplaceReport({
        ...context,
        reason,
        details: details.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof MarketplaceReportError ? err.message : t('marketplace.report.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-report-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={t('common.close')}
        onClick={() => !submitting && onClose()}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200/90 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0">
            <h2 id="marketplace-report-title" className="text-sm font-bold uppercase tracking-wide text-gray-900">
              {t('marketplace.report.title', { seller: context.sellerUsername })}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{t('marketplace.report.subtitle')}</p>
            <p className="mt-1 truncate text-[11px] text-gray-400">
              {contextLabel}
              {context.referenceLabel ? ` · ${context.referenceLabel}` : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {success ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-semibold text-gray-900">{t('marketplace.report.successTitle')}</p>
            <p className="mt-1 text-xs text-gray-500">{t('marketplace.report.successBody')}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-[#1D3160] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#16264D]"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 py-3">
            <fieldset>
              <legend className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-gray-600">
                {t('marketplace.report.reasonLabel')}
              </legend>
              <div className="space-y-1.5">
                {MARKETPLACE_REPORT_REASONS.map((key) => (
                  <label
                    key={key}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
                      reason === key
                        ? 'border-[#FF8800]/60 bg-orange-50/50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80'
                    )}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={key}
                      checked={reason === key}
                      onChange={() => setReason(key)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-[#FF8800] focus:ring-[#FF8800]/30"
                    />
                    <span className="text-sm text-gray-800">{t(`marketplace.report.reason.${key}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4">
              <label
                htmlFor="marketplace-report-details"
                className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-600"
              >
                {t('marketplace.report.detailsLabel')}
              </label>
              <textarea
                id="marketplace-report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t('marketplace.report.detailsPlaceholder')}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF8800]/50 focus:outline-none focus:ring-2 focus:ring-[#FF8800]/20"
              />
            </div>

            {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}

            <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                {t('marketplace.report.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1D3160] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#16264D] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                {t('marketplace.report.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

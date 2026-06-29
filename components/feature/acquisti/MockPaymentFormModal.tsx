'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, X } from 'lucide-react';
import { cn, formatEur } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import {
  getMockOrderTotalCents,
  type MockPurchaseOrder,
} from '@/lib/stores/mock-purchase-store';

interface MockPaymentFormModalProps {
  order: MockPurchaseOrder | null;
  isPaying: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MockPaymentFormModal({
  order,
  isPaying,
  onClose,
  onConfirm,
}: MockPaymentFormModalProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [acceptedDemo, setAcceptedDemo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!order) {
      setCardholder('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setAcceptedDemo(false);
      setShowSuccess(false);
      return;
    }
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPaying) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, isPaying, onClose]);

  if (!order) return null;

  const total = getMockOrderTotalCents(order) / 100;
  const canSubmit = acceptedDemo && !isPaying && !showSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setShowSuccess(true);
    setTimeout(() => {
      onConfirm();
    }, 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mock-payment-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#FF7300]" aria-hidden />
            <h2 id="mock-payment-title" className="text-lg font-bold text-gray-900">
              {t('mockCheckout.paymentFormTitle')}
            </h2>
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span className="mr-2 inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              DEMO
            </span>
            {t('mockCheckout.demoDisclaimer')}
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-semibold text-gray-900">{order.title}</p>
            <p className="mt-1 text-gray-600">
              Qtà {order.quantity} · {formatEur(total, intlLocale)}
            </p>
          </div>

          <div>
            <label htmlFor="mock-cardholder" className="mb-1 block text-sm font-medium text-gray-700">
              {t('mockCheckout.cardholder')}
            </label>
            <input
              id="mock-cardholder"
              type="text"
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              placeholder={t('mockCheckout.cardholderPlaceholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="mock-card-number" className="mb-1 block text-sm font-medium text-gray-700">
              {t('mockCheckout.cardNumber')}
            </label>
            <input
              id="mock-card-number"
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mock-expiry" className="mb-1 block text-sm font-medium text-gray-700">
                {t('mockCheckout.expiry')}
              </label>
              <input
                id="mock-expiry"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/AA"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="mock-cvv" className="mb-1 block text-sm font-medium text-gray-700">
                CVV
              </label>
              <input
                id="mock-cvv"
                type="text"
                inputMode="numeric"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
                autoComplete="off"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={acceptedDemo}
              onChange={(e) => setAcceptedDemo(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#FF7300] focus:ring-[#FF7300]"
            />
            <span>{t('mockCheckout.checkboxLabel')}</span>
          </label>

          {showSuccess && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {t('mockCheckout.successMessage')}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPaying}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              {t('mockCheckout.cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md bg-[#FF7300] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:opacity-60',
              )}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {isPaying || showSuccess ? t('mockCheckout.paying') : t('mockCheckout.simulatePayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

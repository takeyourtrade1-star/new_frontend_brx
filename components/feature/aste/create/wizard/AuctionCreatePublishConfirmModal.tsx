'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

type AuctionCreatePublishConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPublish: () => void;
};

export function AuctionCreatePublishConfirmModal({
  open,
  onClose,
  onEdit,
  onPublish,
}: AuctionCreatePublishConfirmModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1D3160]/45 px-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-confirm-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
      >
        <h2 id="publish-confirm-title" className="text-lg font-bold uppercase tracking-wide text-[#1D3160]">
          {t('auctions.createPublishConfirmTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          {t('auctions.createPublishConfirmBody')}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
          >
            {t('auctions.createPublishConfirmCheck')}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
          >
            {t('auctions.createPublishConfirmEdit')}
          </button>
        </div>

        <button
          type="button"
          onClick={onPublish}
          className="mt-3 w-full rounded-xl bg-[#FF7300] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800]"
        >
          {t('auctions.createPublishConfirmContinue')}
        </button>
      </div>
    </div>
  );
}

'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '@/lib/i18n/useTranslation';

type AuctionCreatePhoneQrModalProps = {
  open: boolean;
  qrUrl: string;
  onClose: () => void;
};

export function AuctionCreatePhoneQrModal({ open, qrUrl, onClose }: AuctionCreatePhoneQrModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#1D3160]/45 px-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-upload-qr-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
      >
        <h2 id="phone-upload-qr-title" className="text-lg font-bold uppercase tracking-wide text-[#1D3160]">
          {t('auctions.createPhotoFromPhoneModalTitle')}
        </h2>
        <p className="mt-3 text-sm md:text-base font-bold leading-relaxed text-gray-900 text-center">
          {t('auctions.createPhotoFromPhoneModalBody')}
        </p>
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 text-center">
          {t('auctions.createPhotoFromPhoneModalCloseHint')}
        </p>
        <div className="mt-4 flex justify-center rounded-xl border border-gray-100 bg-white p-4">
          <QRCodeSVG value={qrUrl} size={200} level="M" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          {t('auctions.createPhotoFromPhoneModalClose')}
        </button>
      </div>
    </div>
  );
}

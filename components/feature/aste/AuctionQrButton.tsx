'use client';

/**
 * QR Code button per asta: apre un modal con il QR code da scannerizzare
 * per aprire rapidamente l'asta su mobile (es. da PC a telefono).
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const ORANGE = '#FF7300';

type Props = {
  auctionTitle: string;
  compact?: boolean;
  className?: string;
};

export function AuctionQrButton({ auctionTitle, compact = false, className }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [url, setUrl] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setUrl(`${window.location.origin}${pathname}`);
  }, [pathname]);

  // Close modal on outside click
  useEffect(() => {
    if (!modalOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setModalOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [modalOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`${
          compact
            ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm shadow-sm transition hover:brightness-105'
            : 'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm transition hover:brightness-105'
        }${className ? ` ${className}` : ''}`}
        style={{ borderColor: ORANGE, color: ORANGE, backgroundColor: 'white' }}
        aria-label={t('auctions.qrCode')}
      >
        <QrCode className="h-4 w-4" aria-hidden />
        {!compact ? t('auctions.qrCode') : null}
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalOpen && url && (
            <motion.div
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setModalOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <QrCode className="h-6 w-6 text-[#FF7300]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('auctions.qrCodeTitle')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('auctions.qrCodeSubtitle')}
              </p>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4">
              <div className="rounded-xl border-2 border-gray-100 bg-white p-4 shadow-sm">
                <QRCodeSVG
                  value={url}
                  size={200}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1f2937"
                />
              </div>
              <p className="text-xs text-gray-400">
                {auctionTitle}
              </p>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-500">
                {t('auctions.qrCodeHint')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

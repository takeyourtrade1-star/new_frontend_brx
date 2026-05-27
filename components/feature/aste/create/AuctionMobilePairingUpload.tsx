'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CropperRef } from 'react-advanced-cropper';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadPhoto } from '@/lib/api/auction-photo-client';
import {
  pollPairingSessionAsGuest,
  uploadPhotoAsPairingGuest,
  type PairingSessionStatus,
} from '@/lib/auction-pairing-guest-upload';
import { cn } from '@/lib/utils';
import {
  exportMobileCropFile,
  MobileCardCropper,
  type CropMode,
} from '@/components/feature/aste/create/MobileCardCropper';

type ViewState = 'pick' | 'crop' | 'uploaded' | 'thanks';

/** Maximum number of retries allowed after the initial upload failure. */
const MAX_RETRIES = 3;

/** Polling interval (ms) to detect when the desktop flow has been completed. */
const POLL_INTERVAL_MS = 2500;

/** Bump when mobile QR UX changes — helps verify Amplify deploy / cache on phone. */
const MOBILE_PHOTO_UX_BUILD = '20260528';

const UPLOAD_TIMEOUT_MS = 30_000;

function vibrateSuccess(): void {
  try {
    navigator.vibrate?.(50);
  } catch {
    /* optional */
  }
}

async function acquireWakeLock(): Promise<(() => void) | null> {
  try {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };
    const lock = await nav.wakeLock?.request('screen');
    if (!lock) return null;
    return () => {
      void lock.release();
    };
  } catch {
    return null;
  }
}

export function AuctionMobilePairingUpload({
  sessionId,
  uploadToken,
  context = 'auction',
}: {
  sessionId: string;
  /** QR guest secret: when set, uploads work without login on this device. */
  uploadToken?: string;
  /** auction = asta, listing = vendita marketplace */
  context?: 'auction' | 'listing';
}) {
  const { t } = useTranslation();
  const guest = Boolean(uploadToken);
  const isListing = context === 'listing';

  const [viewState, setViewState] = useState<ViewState>('pick');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<CropMode>('card');
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [photosSent, setPhotosSent] = useState(0);
  const [sessionClosedByPc, setSessionClosedByPc] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<PairingSessionStatus | null>(null);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<CropperRef>(null);
  const wakeReleaseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const applyGuestStatus = useCallback((s: PairingSessionStatus) => {
    setSessionStatus(s);
    if (s.status === 'closed') {
      setSessionClosedByPc(true);
      setViewState('thanks');
    }
  }, []);

  const pollGuestStatus = useCallback(async () => {
    if (!guest || !uploadToken) return;
    try {
      const s = await pollPairingSessionAsGuest(sessionId, uploadToken);
      applyGuestStatus(s);
    } catch {
      /* non-fatal */
    }
  }, [applyGuestStatus, guest, sessionId, uploadToken]);

  useEffect(() => {
    if (guest && uploadToken) {
      void pollGuestStatus();
    }
  }, [guest, uploadToken, pollGuestStatus]);

  useEffect(() => {
    if (
      !guest ||
      !uploadToken ||
      viewState === 'thanks' ||
      viewState === 'crop' ||
      uploading
    ) {
      return;
    }
    const id = setInterval(() => {
      void pollGuestStatus();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [guest, uploadToken, viewState, uploading, pollGuestStatus]);

  const expiresInMinutes = sessionStatus?.expires_at
    ? Math.max(0, Math.ceil((new Date(sessionStatus.expires_at).getTime() - Date.now()) / 60_000))
    : null;

  const pcPhotoCount = sessionStatus?.photos_count ?? photosSent;
  const maxPhotos = sessionStatus?.max_photos ?? 4;
  const atPhotoLimit = pcPhotoCount >= maxPhotos;

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f || !f.type.startsWith('image/')) {
        setUploadError(t('auctions.mobilePairingPickImageError'));
        return;
      }
      if (atPhotoLimit) {
        setUploadError(t('auctions.mobilePairingPhotoLimitReached'));
        setViewState('uploaded');
        return;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const url = URL.createObjectURL(f);
      objectUrlRef.current = url;
      setImageSrc(url);
      setUploadError(null);
      setFailCount(0);
      setCropMode('card');
      setViewState('crop');
    },
    [atPhotoLimit, t],
  );

  const resetToPick = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageSrc(null);
    setUploadPercent(null);
    setUploadError(null);
    setFailCount(0);
    setViewState('pick');
  }, []);

  const openFilePicker = useCallback(() => {
    if (atPhotoLimit) {
      setUploadError(t('auctions.mobilePairingPhotoLimitReached'));
      setViewState('uploaded');
      return;
    }
    fileInputRef.current?.click();
  }, [atPhotoLimit, t]);

  const startAnotherPhoto = useCallback(() => {
    if (atPhotoLimit) {
      setViewState('thanks');
      return;
    }
    resetToPick();
    requestAnimationFrame(() => fileInputRef.current?.click());
  }, [atPhotoLimit, resetToPick]);

  const sendCropped = useCallback(async () => {
    if (!imageSrc) return;
    if (isOffline) {
      setUploadError(t('auctions.mobilePairingOfflineError'));
      return;
    }
    setUploading(true);
    setUploadPercent(0);
    setUploadError(null);
    wakeReleaseRef.current = (await acquireWakeLock()) ?? null;
    try {
      setUploadPercent(2);
      const file = await exportMobileCropFile(cropperRef);
      setUploadPercent(6);
      const uploadPromise =
        guest && uploadToken
          ? uploadPhotoAsPairingGuest(file, {
              pairingSessionId: sessionId,
              pairingUploadToken: uploadToken,
              onProgress: (p) => setUploadPercent(p),
            })
          : uploadPhoto(file, {
              pairingSessionId: sessionId,
              onProgress: (p) => setUploadPercent(p),
            });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(t('auctions.mobilePairingUploadTimeout'))), UPLOAD_TIMEOUT_MS);
      });
      await Promise.race([uploadPromise, timeoutPromise]);
      setFailCount(0);
      setPhotosSent((n) => n + 1);
      vibrateSuccess();
      void pollGuestStatus();
      setViewState('uploaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auctions.mobilePairingUploadError');
      setUploadError(message);
      setFailCount((prev) => prev + 1);
    } finally {
      wakeReleaseRef.current?.();
      wakeReleaseRef.current = null;
      setUploading(false);
      setUploadPercent(null);
    }
  }, [cropperRef, guest, imageSrc, isOffline, pollGuestStatus, sessionId, t, uploadToken]);

  const isExhausted = failCount > MAX_RETRIES;
  const canRetry = failCount > 0 && !isExhausted && !uploading;

  const guestHeadline = isListing
    ? t('auctions.mobilePairingGuestHeadlineListing')
    : t('auctions.mobilePairingGuestHeadline');
  const guestSub = isListing
    ? t('auctions.mobilePairingGuestSubListing')
    : t('auctions.mobilePairingGuestSub');
  const guestBadge = isListing
    ? t('auctions.mobilePairingGuestBadgeListing')
    : t('auctions.mobilePairingGuestBadge');

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      onChange={onPickFile}
    />
  );

  const sessionStatsLine =
    guest && sessionStatus?.status === 'active'
      ? t('auctions.mobilePairingSessionStats', {
          count: String(pcPhotoCount),
          max: String(maxPhotos),
          minutes: String(expiresInMinutes ?? '—'),
        })
      : null;

  // ─── Thank-you screen (user finished) ───────────────────────────────────────
  if (viewState === 'thanks') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-6 py-10"
      >
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1D3160] shadow-lg shadow-black/40 ring-2 ring-[#FF7300]/30">
          <span className="text-3xl font-black text-[#FF7300]">E</span>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/35"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-400" strokeWidth={1.75} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="mb-3 text-center text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl"
        >
          {t('auctions.mobilePairingThanksHeadline')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mb-10 max-w-sm text-center text-sm leading-relaxed text-white/60"
        >
          {sessionClosedByPc
            ? t('auctions.mobilePairingThanksSubSessionClosed')
            : photosSent > 0
              ? t('auctions.mobilePairingThanksSubCount', { count: String(photosSent) })
              : t('auctions.mobilePairingThanksSub')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="w-full max-w-xs"
        >
          <Link
            href="/"
            className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#FF7300] to-[#e86800] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:brightness-[1.06] active:scale-[0.98]"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            {t('auctions.mobilePairingGoHome')}
          </Link>
        </motion.div>

        <div className="mt-12 flex flex-col items-center gap-1">
          <span className="text-[11px] font-black tracking-widest text-[#FF7300]">EBARTEX</span>
          <span className="text-[10px] text-white/30">Powered by Ebartex</span>
        </div>
      </motion.div>
    );
  }

  // ─── Post-upload: another photo? ───────────────────────────────────────────
  if (viewState === 'uploaded') {
    return (
      <div
        className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-6 py-10"
        data-mobile-photo-build={MOBILE_PHOTO_UX_BUILD}
      >
        {hiddenFileInput}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/35"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-400" strokeWidth={1.75} />
        </motion.div>

        <h1 className="mb-2 text-center text-2xl font-black text-white">
          {t('auctions.mobilePairingAnotherPhotoHeadline')}
        </h1>
        <p className="mb-1 text-center text-sm text-white/55">
          {t('auctions.mobilePairingAnotherPhotoCount', { count: String(photosSent) })}
        </p>
        <p className="mb-8 max-w-xs text-center text-base font-semibold text-white/80">
          {t('auctions.mobilePairingAnotherPhotoQuestion', { count: String(photosSent) })}
        </p>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={startAnotherPhoto}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#FF7300] to-[#e86800] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {t('auctions.mobilePairingAnotherPhotoYes')}
          </button>
          <button
            type="button"
            onClick={() => setViewState('thanks')}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            {t('auctions.mobilePairingAnotherPhotoNo')}
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-1">
          <span className="text-[11px] font-black tracking-widest text-[#FF7300]">EBARTEX</span>
        </div>
      </div>
    );
  }

  // ─── Main shell ──────────────────────────────────────────────────────────────
  return (
    <div
      className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-4 pb-10 pt-8"
      data-mobile-photo-build={MOBILE_PHOTO_UX_BUILD}
    >
      {hiddenFileInput}

      {guest ? (
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7300]/30 bg-[#FF7300]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF7300]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {guestBadge}
          </div>
          <h1 className="text-[1.35rem] font-black leading-tight tracking-tight text-white sm:text-2xl">
            {guestHeadline}
          </h1>
          <p className="text-sm leading-relaxed text-white/60">{guestSub}</p>
          {sessionStatsLine ? (
            <p className="text-xs font-medium text-emerald-400/90">{sessionStatsLine}</p>
          ) : null}
          {isOffline ? (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
              {t('auctions.mobilePairingOfflineError')}
            </p>
          ) : null}
          {photosSent > 0 ? (
            <p className="text-xs font-medium text-emerald-400/90">
              {t('auctions.mobilePairingAnotherPhotoCount', { count: String(photosSent) })}
            </p>
          ) : null}
          <ol className="mx-auto flex max-w-md flex-col gap-2.5 text-left text-xs text-white/70 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <li className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-[11px] font-bold text-white">
                1
              </span>
              <span className="pt-0.5 leading-snug">{t('auctions.mobilePairingGuestStep1')}</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-[11px] font-bold text-white">
                2
              </span>
              <span className="pt-0.5 leading-snug">{t('auctions.mobilePairingGuestStep2')}</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-[11px] font-bold text-white">
                3
              </span>
              <span className="pt-0.5 leading-snug">{t('auctions.mobilePairingGuestStep3')}</span>
            </li>
          </ol>
        </motion.header>
      ) : (
        <div>
          <h1 className="text-lg font-bold text-white">{t('auctions.mobilePairingTitle')}</h1>
          <p className="mt-1 text-sm text-white/60">{t('auctions.mobilePairingIntro')}</p>
        </div>
      )}

      {!guest && uploading && uploadPercent !== null ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-white/60">
            <span>{t('auctions.mobilePairingUploadProgressLabel')}</span>
            <span>{uploadPercent}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[#FF7300]"
              initial={false}
              animate={{ width: `${uploadPercent}%` }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            />
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {viewState === 'pick' && (
          <motion.button
            key="pick"
            type="button"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onClick={openFilePicker}
            className={cn(
              'group relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-16 transition-colors',
              'border-white/20 bg-white/5 hover:border-[#FF7300]/50 hover:bg-white/8',
            )}
          >
            <ImagePlus
              className="h-12 w-12 text-white/30 transition-colors group-hover:text-[#FF7300]"
              strokeWidth={1.25}
              aria-hidden
            />
            <span className="relative text-center text-sm font-bold text-white">
              {guest ? t('auctions.mobilePairingPickCtaGuest') : t('auctions.mobilePairingPickCta')}
            </span>
            <span className="relative text-center text-xs text-white/40">{t('auctions.mobilePairingOneAtATime')}</span>
          </motion.button>
        )}

        {viewState === 'crop' && imageSrc ? (
          <motion.div
            key="crop"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="relative flex flex-1 flex-col gap-4"
          >
            <MobileCardCropper
              imageSrc={imageSrc}
              mode={cropMode}
              onModeChange={setCropMode}
              cropperRef={cropperRef}
              modeCardLabel={t('auctions.mobilePairingCropModeCard')}
              modeFreeLabel={t('auctions.mobilePairingCropModeFree')}
              zoomLabel={t('auctions.mobilePairingZoom')}
              rotateLeftLabel={t('auctions.mobilePairingRotateLeft')}
              rotateRightLabel={t('auctions.mobilePairingRotateRight')}
            />

            <AnimatePresence>
              {uploading && uploadPercent !== null ? (
                <motion.div
                  key="upload-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-[#0b1220]/85 backdrop-blur-md"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-[#FF7300]" aria-hidden />
                  <p className="mt-4 text-sm font-semibold text-white">
                    {t('auctions.mobilePairingSendingPercent', { percent: String(uploadPercent) })}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {uploadError && !uploading ? (
                <motion.div
                  key="error-card"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                    <p className="text-sm leading-snug text-red-300">{uploadError}</p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {canRetry && (
                      <button
                        type="button"
                        onClick={() => void sendCropped()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        {t('auctions.mobilePairingRetry')}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={resetToPick}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                {t('auctions.mobilePairingChangePhoto')}
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={() => void sendCropped()}
                className="relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#FF7300] to-[#e86800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                {uploading
                  ? uploadPercent !== null
                    ? t('auctions.mobilePairingSendingPercent', { percent: String(uploadPercent) })
                    : t('auctions.mobilePairingSending')
                  : t('auctions.mobilePairingSend')}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!guest ? (
        <>
          <p className="text-center text-xs text-white/40">{t('auctions.mobilePairingFooter')}</p>
          <Link href="/aste/nuova" className="text-center text-sm font-semibold text-[#FF7300] underline">
            {t('auctions.mobilePairingBackToWizard')}
          </Link>
        </>
      ) : null}

      <div className="mt-auto flex flex-col items-center gap-1 pt-6">
        <span className="text-[11px] font-black tracking-widest text-[#FF7300]">EBARTEX</span>
        <span className="text-[10px] text-white/25">Powered by Ebartex</span>
      </div>
    </div>
  );
}

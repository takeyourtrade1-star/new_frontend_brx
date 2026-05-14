'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Cropper, { type Area } from 'react-easy-crop';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  ImagePlus,
  Loader2,
  Move,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadPhoto } from '@/lib/api/auction-photo-client';
import { pollPairingSessionAsGuest, uploadPhotoAsPairingGuest } from '@/lib/auction-pairing-guest-upload';
import { cn } from '@/lib/utils';

/**
 * iOS Safari often throws `TypeError: Load failed` on `fetch()` of large `data:` URLs.
 * Use `Image()` for data/blob URLs; keep fetch only for other schemes.
 */
async function loadImageForCrop(imageSrc: string): Promise<{ source: CanvasImageSource; dispose?: () => void }> {
  if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Impossibile caricare l\u2019immagine'));
      img.src = imageSrc;
    });
    if ('decode' in img && typeof img.decode === 'function') {
      try {
        await img.decode();
      } catch {
        // decode() optional; onload is enough for draw
      }
    }
    return { source: img };
  }
  const res = await fetch(imageSrc);
  if (!res.ok) {
    throw new Error(`Impossibile caricare l\u2019immagine (${res.status})`);
  }
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  return { source: bmp, dispose: () => bmp.close?.() };
}

/** Max longest edge of the cropped export — keeps upload small and skips heavy re-compression. */
const MAX_CROP_EXPORT_EDGE = 1600;

async function getCroppedImageFile(imageSrc: string, pixelCrop: Area): Promise<File> {
  const { source, dispose } = await loadImageForCrop(imageSrc);
  try {
    let dw = Math.max(1, Math.round(pixelCrop.width));
    let dh = Math.max(1, Math.round(pixelCrop.height));
    const maxEdge = Math.max(dw, dh);
    if (maxEdge > MAX_CROP_EXPORT_EDGE) {
      const s = MAX_CROP_EXPORT_EDGE / maxEdge;
      dw = Math.max(1, Math.round(dw * s));
      dh = Math.max(1, Math.round(dh * s));
    }
    const canvas = document.createElement('canvas');
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(
      source,
      Math.round(pixelCrop.x),
      Math.round(pixelCrop.y),
      Math.round(pixelCrop.width),
      Math.round(pixelCrop.height),
      0,
      0,
      dw,
      dh,
    );
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
            return;
          }
          canvas.toBlob(
            (b2) => {
              if (b2) resolve(b2);
              else reject(new Error('toBlob failed'));
            },
            'image/jpeg',
            0.9,
          );
        },
        'image/webp',
        0.86,
      );
    });
    const mime = blob.type || 'image/webp';
    const ext = mime.includes('jpeg') ? 'jpg' : 'webp';
    return new File([blob], `photo.${ext}`, { type: mime });
  } finally {
    dispose?.();
  }
}

type ViewState = 'pick' | 'crop' | 'thanks';

/** Maximum number of retries allowed after the initial upload failure. */
const MAX_RETRIES = 3;

/** Polling interval (ms) to detect when the desktop auction has been created. */
const POLL_INTERVAL_MS = 4000;

export function AuctionMobilePairingUpload({
  sessionId,
  uploadToken,
}: {
  sessionId: string;
  /** QR guest secret: when set, uploads work without login on this device. */
  uploadToken?: string;
}) {
  const { t } = useTranslation();
  const guest = Boolean(uploadToken);

  const [viewState, setViewState] = useState<ViewState>('pick');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** Total number of upload failures (initial attempt + retries). */
  const [failCount, setFailCount] = useState(0);

  const objectUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Poll for session completion so the mobile screen auto-transitions when the
  // desktop user finishes creating the auction.
  useEffect(() => {
    if (!guest || !uploadToken || viewState === 'thanks') return;
    const id = setInterval(() => {
      void (async () => {
        try {
          const s = await pollPairingSessionAsGuest(sessionId, uploadToken);
          if (s.status === 'COMPLETED' || (s.auction_id !== undefined && s.auction_id !== null)) {
            setViewState('thanks');
          }
        } catch {
          // Non-fatal: silently ignore poll errors to avoid spamming the user
        }
      })();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [guest, uploadToken, sessionId, viewState]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f || !f.type.startsWith('image/')) {
        setUploadError(t('auctions.mobilePairingPickImageError'));
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
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setViewState('crop');
    },
    [t],
  );

  const resetToPick = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setUploadPercent(null);
    setUploadError(null);
    setFailCount(0);
    setViewState('pick');
  }, []);

  const sendCropped = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setUploadPercent(0);
    setUploadError(null);
    try {
      setUploadPercent(2);
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels);
      setUploadPercent(6);
      if (guest && uploadToken) {
        await uploadPhotoAsPairingGuest(file, {
          pairingSessionId: sessionId,
          pairingUploadToken: uploadToken,
          onProgress: (p) => setUploadPercent(p),
        });
      } else {
        await uploadPhoto(file, {
          pairingSessionId: sessionId,
          onProgress: (p) => setUploadPercent(p),
        });
      }
      setFailCount(0);
      setViewState('thanks');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auctions.mobilePairingUploadError');
      setUploadError(message);
      setFailCount((prev) => prev + 1);
    } finally {
      setUploading(false);
      setUploadPercent(null);
    }
  }, [croppedAreaPixels, guest, imageSrc, sessionId, t, uploadToken]);

  const isExhausted = failCount > MAX_RETRIES;
  const canRetry = failCount > 0 && !isExhausted && !uploading;

  // ─── Thank-you screen ────────────────────────────────────────────────────────
  if (viewState === 'thanks') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-6 py-10"
      >
        {/* Ebartex "E" lettermark */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1D3160] shadow-lg shadow-black/40 ring-2 ring-[#FF7300]/30">
          <span className="text-3xl font-black text-[#FF7300]">E</span>
        </div>

        {/* Animated checkmark */}
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
          {t('auctions.mobilePairingThanksSub')}
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
            <motion.span
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'linear', repeatDelay: 1.2 }}
            />
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

  // ─── Main shell ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-4 pb-10 pt-8">
      {/* Header — guest mode */}
      {guest ? (
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7300]/30 bg-[#FF7300]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF7300]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('auctions.mobilePairingGuestBadge')}
          </div>
          <h1 className="text-[1.35rem] font-black leading-tight tracking-tight text-white sm:text-2xl">
            {t('auctions.mobilePairingGuestHeadline')}
          </h1>
          <p className="text-sm leading-relaxed text-white/60">{t('auctions.mobilePairingGuestSub')}</p>
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

      {/* Upload progress bar — non-guest only (guest uses overlay) */}
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
        {/* ── Pick screen ── */}
        {viewState === 'pick' && (
          <motion.label
            key="pick"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-16 transition-colors',
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
            <input type="file" accept="image/*" className="sr-only" onChange={onPickFile} />
          </motion.label>
        )}

        {/* ── Crop screen ── */}
        {viewState === 'crop' && (
          <motion.div
            key="crop"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 flex-col gap-4"
          >
            {/* Cropper */}
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl bg-[#0a0f1a] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-2 ring-[#FF7300]/25',
                'h-[min(52vh,400px)] w-full sm:h-[min(55vh,440px)]',
              )}
            >
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={0}
                  cropShape="rect"
                  showGrid
                  objectFit="cover"
                  restrictPosition={false}
                  minZoom={0.5}
                  maxZoom={5}
                  zoomSpeed={0.45}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  classes={{
                    containerClassName: 'rounded-2xl',
                    cropAreaClassName: 'border-[3px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]',
                  }}
                />
              ) : null}

              {/* Upload overlay */}
              <AnimatePresence>
                {uploading && uploadPercent !== null ? (
                  <motion.div
                    key="upload-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#0b1220]/80 backdrop-blur-md"
                  >
                    <motion.div
                      className="relative h-14 w-14"
                      initial={{ scale: 0.85 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      <motion.span
                        className="absolute inset-0 rounded-full border-2 border-white/20"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                      />
                      <motion.span
                        className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#FF7300] border-r-[#FF7300]"
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {uploadPercent}
                      </span>
                    </motion.div>
                    <p className="mt-4 max-w-[14rem] text-center text-sm font-semibold text-white">
                      {t('auctions.mobilePairingUploadOverlayTitle')}
                    </p>
                    <p className="mt-1 max-w-[16rem] text-center text-[11px] leading-snug text-white/75">
                      {t('auctions.mobilePairingUploadOverlayHint')}
                    </p>
                    <div className="relative mx-8 mt-5 h-2 w-[min(280px,85%)] overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadPercent}%` }}
                        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                      />
                      <motion.div
                        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '400%' }}
                        transition={{ repeat: Infinity, duration: 1.25, ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Hint pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-white/50">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Move className="h-3.5 w-3.5 text-[#FF7300]/70" aria-hidden />
                {t('auctions.mobilePairingCropPanHint')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {t('auctions.mobilePairingCropZoomPinchHint')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {t('auctions.mobilePairingCropFreeHint')}
              </span>
            </div>

            {/* Error card with retry */}
            <AnimatePresence>
              {uploadError && !uploading ? (
                <motion.div
                  key="error-card"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm leading-snug text-red-300">{uploadError}</p>
                      {failCount > 0 && !isExhausted && (
                        <p className="text-[11px] text-red-400/70">
                          {t('auctions.mobilePairingRetryAttempt', {
                            attempt: String(failCount),
                            max: String(MAX_RETRIES),
                          })}
                        </p>
                      )}
                      {isExhausted && (
                        <p className="text-[11px] font-semibold text-red-300">
                          {t('auctions.mobilePairingRetryExhausted')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {canRetry && (
                      <button
                        type="button"
                        onClick={() => void sendCropped()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        {t('auctions.mobilePairingRetry')}
                      </button>
                    )}
                    {isExhausted && (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        {t('auctions.mobilePairingReloadPage')}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Action buttons */}
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
                disabled={uploading || !croppedAreaPixels}
                onClick={() => void sendCropped()}
                className="relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#FF7300] to-[#e86800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-[1.03] active:scale-[0.99] disabled:opacity-50"
              >
                {/* Shimmer effect */}
                {!uploading ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', repeatDelay: 0.8 }}
                  />
                ) : null}
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                {uploading
                  ? uploadPercent !== null
                    ? t('auctions.mobilePairingSendingPercent', { percent: String(uploadPercent) })
                    : t('auctions.mobilePairingSending')
                  : t('auctions.mobilePairingSend')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-guest footer links */}
      {!guest ? (
        <>
          <p className="text-center text-xs text-white/40">{t('auctions.mobilePairingFooter')}</p>
          <Link href="/aste/nuova" className="text-center text-sm font-semibold text-[#FF7300] underline">
            {t('auctions.mobilePairingBackToWizard')}
          </Link>
        </>
      ) : null}

      {/* Persistent brand footer */}
      <div className="mt-auto flex flex-col items-center gap-1 pt-6">
        <span className="text-[11px] font-black tracking-widest text-[#FF7300]">EBARTEX</span>
        <span className="text-[10px] text-white/25">Powered by Ebartex</span>
      </div>
    </div>
  );
}

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
  RotateCw,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadPhoto } from '@/lib/api/auction-photo-client';
import { pollPairingSessionAsGuest, uploadPhotoAsPairingGuest } from '@/lib/auction-pairing-guest-upload';
import { cn } from '@/lib/utils';

/** Standard MTG card aspect (portrait). */
const CARD_ASPECT = 63 / 88;

/**
 * iOS Safari often throws `TypeError: Load failed` on `fetch()` of large `data:` URLs.
 * Use `Image()` for data/blob URLs; keep fetch only for other schemes.
 */
async function loadImageForCrop(imageSrc: string): Promise<{ source: HTMLImageElement; dispose?: () => void }> {
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
        /* optional */
      }
    }
    return { source: img };
  }
  const res = await fetch(imageSrc);
  if (!res.ok) {
    throw new Error(`Impossibile caricare l\u2019immagine (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Impossibile caricare l\u2019immagine'));
    img.src = url;
  });
  return {
    source: img,
    dispose: () => URL.revokeObjectURL(url),
  };
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/** Max longest edge of the cropped export — keeps upload small and skips heavy re-compression. */
const MAX_CROP_EXPORT_EDGE = 1600;

async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<File> {
  const { source, dispose } = await loadImageForCrop(imageSrc);
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(source.width, source.height, rotation);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-source.width / 2, -source.height / 2);
    ctx.drawImage(source, 0, 0);

    let dw = Math.max(1, Math.round(pixelCrop.width));
    let dh = Math.max(1, Math.round(pixelCrop.height));
    const maxEdge = Math.max(dw, dh);
    if (maxEdge > MAX_CROP_EXPORT_EDGE) {
      const s = MAX_CROP_EXPORT_EDGE / maxEdge;
      dw = Math.max(1, Math.round(dw * s));
      dh = Math.max(1, Math.round(dh * s));
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = dw;
    croppedCanvas.height = dh;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) throw new Error('Canvas not supported');

    croppedCtx.drawImage(
      canvas,
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
      croppedCanvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
            return;
          }
          croppedCanvas.toBlob(
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

type ViewState = 'pick' | 'crop' | 'uploaded' | 'thanks';

/** Maximum number of retries allowed after the initial upload failure. */
const MAX_RETRIES = 3;

/** Polling interval (ms) to detect when the desktop flow has been completed. */
const POLL_INTERVAL_MS = 4000;

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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [photosSent, setPhotosSent] = useState(0);

  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!guest || !uploadToken || viewState === 'thanks' || viewState === 'crop' || viewState === 'uploaded') {
      return;
    }
    const id = setInterval(() => {
      void (async () => {
        try {
          const s = await pollPairingSessionAsGuest(sessionId, uploadToken);
          if (s.status === 'COMPLETED' || (s.auction_id !== undefined && s.auction_id !== null)) {
            setViewState('thanks');
          }
        } catch {
          /* non-fatal */
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
      setRotation(0);
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
    setRotation(0);
    setUploadPercent(null);
    setUploadError(null);
    setFailCount(0);
    setViewState('pick');
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const startAnotherPhoto = useCallback(() => {
    resetToPick();
    requestAnimationFrame(() => fileInputRef.current?.click());
  }, [resetToPick]);

  const sendCropped = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setUploadPercent(0);
    setUploadError(null);
    try {
      setUploadPercent(2);
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, rotation);
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
      setPhotosSent((n) => n + 1);
      setViewState('uploaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auctions.mobilePairingUploadError');
      setUploadError(message);
      setFailCount((prev) => prev + 1);
    } finally {
      setUploading(false);
      setUploadPercent(null);
    }
  }, [croppedAreaPixels, guest, imageSrc, rotation, sessionId, t, uploadToken]);

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
    <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onPickFile} />
  );

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
          {photosSent > 0
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
      <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-6 py-10">
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
          {t('auctions.mobilePairingAnotherPhotoQuestion')}
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
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#1D3160] px-4 pb-10 pt-8">
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
            {/* Portrait card crop frame */}
            <div
              className={cn(
                'relative mx-auto w-full max-w-[min(92vw,320px)] overflow-hidden rounded-2xl bg-[#0a0f1a]',
                'aspect-[63/88] min-h-[min(58vh,520px)] max-h-[72vh]',
                'shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-2 ring-[#FF7300]/25',
              )}
            >
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={CARD_ASPECT}
                  cropShape="rect"
                  showGrid
                  objectFit="contain"
                  restrictPosition={false}
                  minZoom={0.35}
                  maxZoom={6}
                  zoomSpeed={0.45}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  classes={{
                    containerClassName: 'rounded-2xl',
                    cropAreaClassName:
                      'border-[3px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-sm',
                  }}
                />
              ) : null}

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
                    <motion.div className="relative h-14 w-14" initial={{ scale: 0.85 }} animate={{ scale: 1 }}>
                      <motion.span
                        className="absolute inset-0 rounded-full border-2 border-white/20"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {uploadPercent}
                      </span>
                    </motion.div>
                    <p className="mt-4 max-w-[14rem] text-center text-sm font-semibold text-white">
                      {t('auctions.mobilePairingUploadOverlayTitle')}
                    </p>
                    <div className="relative mx-8 mt-5 h-2 w-[min(280px,85%)] overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-amber-400"
                        animate={{ width: `${uploadPercent}%` }}
                        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Zoom + rotation controls */}
            <div className="mx-auto w-full max-w-[min(92vw,320px)] space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 shrink-0 text-[#FF7300]/80" aria-hidden />
                <input
                  type="range"
                  min={0.35}
                  max={6}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-2 flex-1 accent-[#FF7300]"
                  aria-label={t('auctions.mobilePairingZoom')}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t('auctions.mobilePairingRotateLeft')}
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  {t('auctions.mobilePairingRotateRight')}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-white/50">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Move className="h-3.5 w-3.5 text-[#FF7300]/70" aria-hidden />
                {t('auctions.mobilePairingCropPanHint')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {t('auctions.mobilePairingCropZoomPinchHint')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {t('auctions.mobilePairingCropCardHint')}
              </span>
            </div>

            <AnimatePresence>
              {uploadError && !uploading ? (
                <motion.div
                  key="error-card"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
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
                    {isExhausted && (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70"
                      >
                        {t('auctions.mobilePairingReloadPage')}
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
                disabled={uploading || !croppedAreaPixels}
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
        )}
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

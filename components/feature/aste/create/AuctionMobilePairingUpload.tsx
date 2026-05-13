'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Cropper, { type Area } from 'react-easy-crop';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ImagePlus, Loader2, Move, Sparkles, Upload, ZoomIn } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadPhoto } from '@/lib/api/auction-photo-client';
import { uploadPhotoAsPairingGuest } from '@/lib/auction-pairing-guest-upload';
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
      img.onerror = () => reject(new Error('Impossibile caricare l’immagine'));
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
    throw new Error(`Impossibile caricare l’immagine (${res.status})`);
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
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f || !f.type.startsWith('image/')) {
        setFeedback({ tone: 'err', text: t('auctions.mobilePairingPickImageError') });
        return;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const url = URL.createObjectURL(f);
      objectUrlRef.current = url;
      setImageSrc(url);
      setFeedback(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    },
    [t],
  );

  const resetCrop = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setUploadPercent(null);
  }, []);

  const sendCropped = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setUploadPercent(0);
    setFeedback(null);
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
      setFeedback({ tone: 'ok', text: t('auctions.mobilePairingUploadSuccess') });
      resetCrop();
    } catch (err) {
      const text = err instanceof Error ? err.message : t('auctions.mobilePairingUploadError');
      setFeedback({ tone: 'err', text });
    } finally {
      setUploading(false);
      setUploadPercent(null);
    }
  }, [croppedAreaPixels, guest, imageSrc, resetCrop, sessionId, t, uploadToken]);

  const shellClass = cn(
    'mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 pb-10 pt-6',
    guest && 'bg-gradient-to-b from-slate-50 via-white to-orange-50/30 pt-8',
    !guest && 'bg-white py-6',
  );

  return (
    <div className={shellClass}>
      {guest ? (
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF7300] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('auctions.mobilePairingGuestBadge')}
          </div>
          <h1 className="text-[1.35rem] font-black leading-tight tracking-tight text-[#1D3160] sm:text-2xl">
            {t('auctions.mobilePairingGuestHeadline')}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">{t('auctions.mobilePairingGuestSub')}</p>
          <ol className="mx-auto flex max-w-md flex-col gap-2.5 text-left text-xs text-slate-700 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <li className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-[11px] font-bold text-white">
                1
              </span>
              <span className="pt-0.5 leading-snug">{t('auctions.mobilePairingGuestStep1')}</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-[11px] font-bold text-white">
                2
              </span>
              <span className="pt-0.5 leading-snug">{t('auctions.mobilePairingGuestStep2')}</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-[11px] font-bold text-white">
                3
              </span>
              <span className="pt-0.5 leading-snug">{t('auctions.mobilePairingGuestStep3')}</span>
            </li>
          </ol>
        </motion.header>
      ) : (
        <div>
          <h1 className="text-lg font-bold text-[#1D3160]">{t('auctions.mobilePairingTitle')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('auctions.mobilePairingIntro')}</p>
        </div>
      )}

      {!guest && uploading && uploadPercent !== null ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span>{t('auctions.mobilePairingUploadProgressLabel')}</span>
            <span>{uploadPercent}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full bg-[#FF7300]"
              initial={false}
              animate={{ width: `${uploadPercent}%` }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            />
          </div>
        </div>
      ) : null}

      {feedback ? (
        <motion.p
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm shadow-sm',
            feedback.tone === 'ok'
              ? 'border border-emerald-200/80 bg-emerald-50/95 text-emerald-950'
              : 'border border-red-200/80 bg-red-50/95 text-red-950',
          )}
        >
          {feedback.tone === 'ok' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          ) : null}
          <span>{feedback.text}</span>
        </motion.p>
      ) : null}

      {!imageSrc ? (
        <motion.label
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-16 transition-colors',
            guest
              ? 'border-slate-300/90 bg-white/70 shadow-[0_12px_40px_-12px_rgba(29,49,96,0.15)] hover:border-[#FF7300]/50 hover:bg-white'
              : 'border-gray-300 bg-gray-50/80 hover:border-[#FF7300]/60 hover:bg-orange-50/30',
          )}
        >
          {guest ? (
            <ImagePlus className="h-12 w-12 text-[#1D3160]/35 transition-colors group-hover:text-[#FF7300]" strokeWidth={1.25} aria-hidden />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" strokeWidth={1.5} aria-hidden />
          )}
          <span className="relative text-center text-sm font-bold text-[#1D3160]">
            {guest ? t('auctions.mobilePairingPickCtaGuest') : t('auctions.mobilePairingPickCta')}
          </span>
          <span className="relative text-center text-xs text-slate-500">{t('auctions.mobilePairingOneAtATime')}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={onPickFile} />
        </motion.label>
      ) : (
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col gap-4"
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl bg-[#0a0f1a] shadow-[0_20px_50px_-20px_rgba(29,49,96,0.45)] ring-2 ring-[#FF7300]/25',
              'h-[min(52vh,400px)] w-full sm:h-[min(55vh,440px)]',
            )}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={0}
              aspect={3 / 4}
              cropShape="rect"
              showGrid
              objectFit="cover"
              restrictPosition={false}
              minZoom={1}
              maxZoom={5}
              zoomSpeed={0.45}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              classes={{
                containerClassName: 'rounded-2xl',
                cropAreaClassName:
                  'border-[3px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]',
              }}
            />

            <AnimatePresence>
              {uploading && uploadPercent !== null ? (
                <motion.div
                  key="upload-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#0b1220]/72 backdrop-blur-md"
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

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 shadow-sm">
              <Move className="h-3.5 w-3.5 text-[#1D3160]" aria-hidden />
              {t('auctions.mobilePairingCropPanHint')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 shadow-sm">
              <ZoomIn className="h-3.5 w-3.5 text-[#1D3160]" aria-hidden />
              {t('auctions.mobilePairingCropZoomHint')}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-sm">
            <label className="shrink-0 text-xs font-semibold text-slate-600">{t('auctions.mobilePairingZoom')}</label>
            <input
              type="range"
              min={1}
              max={5}
              step={0.04}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-[#FF7300]"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={resetCrop}
              disabled={uploading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t('auctions.mobilePairingCancel')}
            </button>
            <button
              type="button"
              disabled={uploading || !croppedAreaPixels}
              onClick={() => void sendCropped()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#FF7300] to-[#e86800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:brightness-[1.03] active:scale-[0.99] disabled:opacity-50"
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

      {!guest ? (
        <>
          <p className="text-center text-xs text-gray-500">{t('auctions.mobilePairingFooter')}</p>
          <Link href="/aste/nuova" className="text-center text-sm font-semibold text-[#1D3160] underline">
            {t('auctions.mobilePairingBackToWizard')}
          </Link>
        </>
      ) : null}
    </div>
  );
}

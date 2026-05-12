'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, Upload } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadPhoto } from '@/lib/api/auction-photo-client';
import { uploadPhotoAsPairingGuest } from '@/lib/auction-pairing-guest-upload';
import { cn } from '@/lib/utils';

async function getCroppedImageBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const res = await fetch(imageSrc);
  const blob = await res.blob();
  const image = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(
    image,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  image.close?.();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('toBlob failed'));
      },
      'image/webp',
      0.88,
    );
  });
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
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

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
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(String(reader.result));
        setFeedback(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(f);
    },
    [t],
  );

  const resetCrop = useCallback(() => {
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const sendCropped = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setFeedback(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], 'photo.webp', { type: 'image/webp' });
      if (guest && uploadToken) {
        await uploadPhotoAsPairingGuest(file, {
          pairingSessionId: sessionId,
          pairingUploadToken: uploadToken,
        });
      } else {
        await uploadPhoto(file, { pairingSessionId: sessionId });
      }
      setFeedback({ tone: 'ok', text: t('auctions.mobilePairingUploadSuccess') });
      resetCrop();
    } catch (err) {
      const text = err instanceof Error ? err.message : t('auctions.mobilePairingUploadError');
      setFeedback({ tone: 'err', text });
    } finally {
      setUploading(false);
    }
  }, [croppedAreaPixels, guest, imageSrc, resetCrop, sessionId, t, uploadToken]);

  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh max-w-lg flex-col gap-4 bg-white px-4 py-6',
        guest && 'py-8',
      )}
    >
      {!guest ? (
        <div>
          <h1 className="text-lg font-bold text-[#1D3160]">{t('auctions.mobilePairingTitle')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('auctions.mobilePairingIntro')}</p>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-600">{t('auctions.mobilePairingGuestHint')}</p>
      )}

      {feedback ? (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            feedback.tone === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900',
          )}
        >
          {feedback.text}
        </p>
      ) : null}

      {!imageSrc ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/80 px-6 py-16 transition hover:border-[#FF7300]/60 hover:bg-orange-50/30">
          <Upload className="h-10 w-10 text-gray-400" strokeWidth={1.5} aria-hidden />
          <span className="text-center text-sm font-semibold text-[#1D3160]">
            {t('auctions.mobilePairingPickCta')}
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={onPickFile} />
        </label>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="relative h-[min(55vh,420px)] w-full overflow-hidden rounded-xl bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600">{t('auctions.mobilePairingZoom')}</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={resetCrop}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800"
            >
              {t('auctions.mobilePairingCancel')}
            </button>
            <button
              type="button"
              disabled={uploading || !croppedAreaPixels}
              onClick={() => void sendCropped()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF7300] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
              {uploading ? t('auctions.mobilePairingSending') : t('auctions.mobilePairingSend')}
            </button>
          </div>
        </div>
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

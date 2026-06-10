'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  createPhotoPairingSession,
  listPairingSessionPhotos,
  type PhotoPairingContextType,
  type UploadedPhoto,
} from '@/lib/api/auction-photo-client';
import { createListingPhotoPairingSession } from '@/lib/api/listing-photo-client';
import { revokePairingSessionSafe } from '@/lib/pairing-session-revoke';
import type { ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import { mergeRemoteIntoListingPhotos } from '@/lib/pairing/merge-remote-photos';
import type { MessageKey } from '@/lib/i18n/messages/en';

const POLL_FAST_MS = 800;
const POLL_NORMAL_MS = 1500;

export type QrBasePath = '/c/vendi-foto' | '/c/asta-foto';

export interface UsePhotoPairingSessionOptions {
  stepId: string;
  photoStepId: string;
  contextType: PhotoPairingContextType;
  qrBasePath: QrBasePath;
  maxPhotos: number;
  listingPhotos: ListingPhotoSlot[];
  setListingPhotos: (next: ListingPhotoSlot[]) => void;
  toastMessageKey: MessageKey;
  /** Used by compact embedded flows: collapse the QR panel as soon as a phone photo lands. */
  autoCloseOnFirstRemotePhoto?: boolean;
}

export function usePhotoPairingSession({
  stepId,
  photoStepId,
  contextType,
  qrBasePath,
  maxPhotos,
  listingPhotos,
  setListingPhotos,
  toastMessageKey,
  autoCloseOnFirstRemotePhoto = false,
}: UsePhotoPairingSessionOptions) {
  const { t } = useTranslation();
  const stepIdRef = useRef(stepId);
  stepIdRef.current = stepId;

  const [phoneUploadModalOpen, setPhoneUploadModalOpen] = useState(false);
  const [pairingSessionId, setPairingSessionId] = useState<string | null>(null);
  const [pairingUploadToken, setPairingUploadToken] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);
  const [pairingActionLoading, setPairingActionLoading] = useState(false);
  const [pairingActionError, setPairingActionError] = useState<string | null>(null);
  const [phonePhotoToast, setPhonePhotoToast] = useState<string | null>(null);
  const [remotePhotoCount, setRemotePhotoCount] = useState(0);
  const [flashPhotoId, setFlashPhotoId] = useState<number | null>(null);

  const sessionGenRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listingPhotosRef = useRef(listingPhotos);
  listingPhotosRef.current = listingPhotos;

  useEffect(() => {
    if (!phonePhotoToast) return;
    const timer = window.setTimeout(() => setPhonePhotoToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [phonePhotoToast]);

  useEffect(() => {
    if (flashPhotoId == null) return;
    const timer = window.setTimeout(() => setFlashPhotoId(null), 1200);
    return () => window.clearTimeout(timer);
  }, [flashPhotoId]);

  const phonePairingQrUrl = useMemo(() => {
    if (!pairingSessionId || !pairingUploadToken || typeof window === 'undefined') return '';
    const u = new URL(qrBasePath, window.location.origin);
    u.searchParams.set('sid', pairingSessionId);
    u.searchParams.set('t', pairingUploadToken);
    return u.toString();
  }, [pairingSessionId, pairingUploadToken, qrBasePath]);

  const mergeRemotePhotosFromSession = useCallback(
    async (sessionId: string) => {
      try {
        const remote = await listPairingSessionPhotos(sessionId);
        remote.sort((a, b) => a.id - b.id);
        setRemotePhotoCount(remote.length);
        const { next, added, lastAddedId } = mergeRemoteIntoListingPhotos(
          listingPhotosRef.current,
          remote,
          maxPhotos,
        );
        if (added > 0) {
          setListingPhotos(next);
          setPhonePhotoToast(t(toastMessageKey));
          if (lastAddedId != null) setFlashPhotoId(lastAddedId);
          if (autoCloseOnFirstRemotePhoto) setPhoneUploadModalOpen(false);
        }
      } catch {
        /* polling: ignore transient errors */
      }
    },
    [autoCloseOnFirstRemotePhoto, maxPhotos, setListingPhotos, t, toastMessageKey],
  );

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (stepId !== photoStepId || !pairingSessionId) {
      clearPoll();
      return;
    }
    void mergeRemotePhotosFromSession(pairingSessionId);
    const intervalMs = phoneUploadModalOpen ? POLL_FAST_MS : POLL_NORMAL_MS;
    pollRef.current = setInterval(() => {
      void mergeRemotePhotosFromSession(pairingSessionId);
    }, intervalMs);
    return clearPoll;
  }, [
    stepId,
    photoStepId,
    pairingSessionId,
    phoneUploadModalOpen,
    mergeRemotePhotosFromSession,
    clearPoll,
  ]);

  useEffect(() => {
    if (stepId === photoStepId) return;
    if (pairingSessionId) {
      void revokePairingSessionSafe(pairingSessionId);
    }
    setPairingSessionId(null);
    setPairingUploadToken(null);
    setPairingExpiresAt(null);
    setPhoneUploadModalOpen(false);
    setPairingActionError(null);
    setRemotePhotoCount(0);
  }, [stepId, photoStepId, pairingSessionId]);

  const createSession = useCallback(async (): Promise<boolean> => {
    const gen = ++sessionGenRef.current;
    setPairingActionLoading(true);
    setPairingActionError(null);
    try {
      const created =
        contextType === 'listing'
          ? await createListingPhotoPairingSession()
          : await createPhotoPairingSession(contextType);
      if (gen !== sessionGenRef.current || stepIdRef.current !== photoStepId) {
        void revokePairingSessionSafe(created.session_id);
        return false;
      }
      if (!created.upload_token) {
        setPairingActionError(
          'Il server non ha restituito il codice di collegamento. Aggiorna il servizio auction e riprova.',
        );
        return false;
      }
      setPairingSessionId(created.session_id);
      setPairingUploadToken(created.upload_token);
      setPairingExpiresAt(created.expires_at ?? null);
      setRemotePhotoCount(0);
      return true;
    } catch (err: unknown) {
      if (gen === sessionGenRef.current) {
        setPairingActionError(
          err instanceof Error ? err.message : 'Impossibile avviare la sessione. Riprova.',
        );
      }
      return false;
    } finally {
      if (gen === sessionGenRef.current) {
        setPairingActionLoading(false);
      }
    }
  }, [contextType, photoStepId]);

  const openPhoneUploadModal = useCallback(async () => {
    if (pairingSessionId && pairingUploadToken) {
      setPhoneUploadModalOpen(true);
      return;
    }
    const ok = await createSession();
    if (ok) setPhoneUploadModalOpen(true);
  }, [pairingSessionId, pairingUploadToken, createSession]);

  const closePhoneUploadModal = useCallback(() => {
    setPhoneUploadModalOpen(false);
  }, []);

  const regenerateQr = useCallback(async () => {
    if (pairingSessionId) {
      await revokePairingSessionSafe(pairingSessionId);
    }
    setPairingSessionId(null);
    setPairingUploadToken(null);
    setPairingExpiresAt(null);
    const ok = await createSession();
    if (ok) setPhoneUploadModalOpen(true);
  }, [pairingSessionId, createSession]);

  const revokePairing = useCallback(async () => {
    await revokePairingSessionSafe(pairingSessionId);
    setPairingSessionId(null);
    setPairingUploadToken(null);
    setPairingExpiresAt(null);
    setPhoneUploadModalOpen(false);
    setRemotePhotoCount(0);
  }, [pairingSessionId]);

  const revokeOnPublish = useCallback(() => {
    void revokePairingSessionSafe(pairingSessionId);
    setPairingSessionId(null);
    setPairingUploadToken(null);
    setPairingExpiresAt(null);
    setPhoneUploadModalOpen(false);
  }, [pairingSessionId]);

  const expiresInMinutes = useMemo(() => {
    if (!pairingExpiresAt) return null;
    const ms = new Date(pairingExpiresAt).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.max(0, Math.ceil(ms / 60_000));
  }, [pairingExpiresAt]);

  return {
    pairingSessionId,
    pairingUploadToken,
    phoneUploadModalOpen,
    setPhoneUploadModalOpen,
    phonePairingQrUrl,
    openPhoneUploadModal,
    closePhoneUploadModal,
    regenerateQr,
    revokePairing,
    revokeOnPublish,
    pairingActionLoading,
    pairingActionError,
    phonePhotoToast,
    remotePhotoCount,
    flashPhotoId,
    expiresInMinutes,
    maxPhotos,
    hasActiveSession: Boolean(pairingSessionId && pairingUploadToken),
  };
}

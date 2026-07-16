'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearScanSession,
  loadScanSession,
  saveScanSession,
} from '@/lib/scanner/scan-session-store';

import type {
  ScanCatalogCard,
  ScanPublishStatus,
  ScanResult,
  ScanSaleDraft,
  ScanSession,
  ScanSessionItem,
} from './scanner-types';

export const MAX_SCAN_SESSION_ITEMS = 100;

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSession(): ScanSession {
  const now = new Date().toISOString();
  return { version: 2, id: createId(), createdAt: now, updatedAt: now, items: [] };
}

export function createDefaultScanSaleDraft(): ScanSaleDraft {
  return {
    selectedCard: null,
    language: 'en',
    condition: 'near_mint',
    price: '',
    priceTouched: false,
    publishStatus: 'draft',
  };
}

/** Migra in memoria i lotti creati dalla prima versione dello scanner. */
export function normalizeScanSession(stored: ScanSession): ScanSession {
  return {
    ...stored,
    version: 2,
    items: stored.items.slice(0, MAX_SCAN_SESSION_ITEMS).map((item) => ({
      ...item,
      quantity: Number.isFinite(item.quantity) ? Math.max(1, item.quantity) : 1,
      sale: (() => {
        const sale = {
          ...createDefaultScanSaleDraft(),
          ...(item.sale ?? {}),
          selectedCard: item.sale?.selectedCard ?? null,
        };
        return sale.publishStatus === 'publishing'
          ? { ...sale, publishStatus: 'failed' as const, publishError: undefined }
          : sale;
      })(),
    })),
  };
}

export function useLocalScanSession() {
  const [session, setSession] = useState<ScanSession>(() => createSession());
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSessionRef = useRef(session);
  latestSessionRef.current = session;

  useEffect(() => {
    let cancelled = false;
    void loadScanSession().then((stored) => {
      if (cancelled) return;
      if (stored) {
        const normalized = normalizeScanSession(stored);
        setSession((current) => {
          const currentIds = new Set(current.items.map((item) => item.id));
          const restored = normalized.items.filter((item) => !currentIds.has(item.id));
          return current.items.length > 0
            ? {
                ...normalized,
                updatedAt: current.updatedAt,
                items: [...restored, ...current.items].slice(0, MAX_SCAN_SESSION_ITEMS),
              }
            : normalized;
        });
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      void saveScanSession(latestSessionRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void saveScanSession(session), 120);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [hydrated, session]);

  const addResult = useCallback((result: ScanResult) => {
    const now = new Date(result.captured_at_ms ?? Date.now()).toISOString();
    const { capture_blob: captureBlob, ...persistedResult } = result;
    const item: ScanSessionItem = {
      id: result.capture_id || createId(),
      capturedAt: now,
      status: result.confidence >= 0.9 ? 'recognized' : 'needs_review',
      quantity: 1,
      result: persistedResult,
      captureBlob,
      sale: createDefaultScanSaleDraft(),
    };
    setSession((current) =>
      current.items.length >= MAX_SCAN_SESSION_ITEMS
        ? current
        : {
            ...current,
            updatedAt: now,
            items: [...current.items, item].sort((left, right) =>
              left.capturedAt.localeCompare(right.capturedAt),
            ),
          },
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setSession((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.filter((item) => item.id !== id),
    }));
  }, []);

  const setItemStatus = useCallback((id: string, status: ScanSessionItem['status']) => {
    setSession((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  }, []);

  const updateItem = useCallback(
    (id: string, updater: (item: ScanSessionItem) => ScanSessionItem) => {
      setSession((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        items: current.items.map((item) => (item.id === id ? updater(item) : item)),
      }));
    },
    [],
  );

  const updateSale = useCallback((id: string, patch: Partial<ScanSaleDraft>) => {
    setSession((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.map((item) =>
        item.id === id
          ? {
              ...item,
              sale: {
                ...item.sale,
                ...patch,
                publishStatus:
                  item.sale.publishStatus === 'published'
                    ? item.sale.publishStatus
                    : (patch.publishStatus ?? 'draft'),
                publishError: undefined,
              },
            }
          : item,
      ),
    }));
  }, []);

  const selectCatalogCard = useCallback((id: string, card: ScanCatalogCard) => {
    setSession((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.map((item) => {
        if (item.id !== id || item.sale.publishStatus === 'published') return item;
        const suggestedPrice = card.marketPrice && card.marketPrice > 0
          ? card.marketPrice.toFixed(2)
          : '';
        const language = card.availableLanguages.includes(item.sale.language)
          ? item.sale.language
          : (card.availableLanguages[0] ?? item.sale.language ?? 'en');
        return {
          ...item,
          sale: {
            ...item.sale,
            selectedCard: card,
            language,
            price: item.sale.priceTouched ? item.sale.price : suggestedPrice,
            publishStatus: 'draft',
            listingId: undefined,
            publishError: undefined,
          },
        };
      }),
    }));
  }, []);

  const applySaleDefaults = useCallback(
    (patch: Pick<ScanSaleDraft, 'language' | 'condition'>) => {
      setSession((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        items: current.items.map((item) =>
          item.status === 'rejected' || item.sale.publishStatus === 'published'
            ? item
            : { ...item, sale: { ...item.sale, ...patch } },
        ),
      }));
    },
    [],
  );

  const applySuggestedPrices = useCallback(() => {
    setSession((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.map((item) => {
        const suggested = item.sale.selectedCard?.marketPrice;
        if (
          item.status === 'rejected' ||
          item.sale.publishStatus === 'published' ||
          !suggested ||
          suggested <= 0
        ) {
          return item;
        }
        return {
          ...item,
          sale: { ...item.sale, price: suggested.toFixed(2), priceTouched: false },
        };
      }),
    }));
  }, []);

  const setPublishState = useCallback((
    ids: string[],
    publishStatus: ScanPublishStatus,
    details: { listingId?: string; error?: string } = {},
  ) => {
    const selected = new Set(ids);
    setSession((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.map((item) =>
        selected.has(item.id)
          ? {
              ...item,
              sale: {
                ...item.sale,
                publishStatus,
                listingId: details.listingId,
                publishError: details.error,
              },
            }
          : item,
      ),
    }));
  }, []);

  const resetSession = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await clearScanSession();
    setSession(createSession());
  }, []);

  const totals = useMemo(
    () => ({
      captured: session.items.length,
      recognized: session.items.filter((item) => item.status === 'recognized').length,
      needsReview: session.items.filter((item) => item.status === 'needs_review').length,
      confirmed: session.items.filter((item) => item.status === 'confirmed').length,
      published: session.items.filter((item) => item.sale.publishStatus === 'published').length,
      limitReached: session.items.length >= MAX_SCAN_SESSION_ITEMS,
    }),
    [session.items],
  );

  return {
    session,
    hydrated,
    totals,
    addResult,
    removeItem,
    setItemStatus,
    updateItem,
    updateSale,
    selectCatalogCard,
    applySaleDefaults,
    applySuggestedPrices,
    setPublishState,
    resetSession,
  };
}

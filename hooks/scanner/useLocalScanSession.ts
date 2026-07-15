'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearScanSession,
  loadScanSession,
  saveScanSession,
} from '@/lib/scanner/scan-session-store';

import type { ScanResult, ScanSession, ScanSessionItem } from './scanner-types';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSession(): ScanSession {
  const now = new Date().toISOString();
  return { id: createId(), createdAt: now, updatedAt: now, items: [] };
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
        setSession((current) => {
          const currentIds = new Set(current.items.map((item) => item.id));
          const restored = stored.items.filter((item) => !currentIds.has(item.id));
          return current.items.length > 0
            ? { ...stored, updatedAt: current.updatedAt, items: [...restored, ...current.items] }
            : stored;
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
    const now = new Date().toISOString();
    const item: ScanSessionItem = {
      id: result.capture_id || createId(),
      capturedAt: now,
      status: result.confidence >= 0.9 ? 'recognized' : 'needs_review',
      quantity: 1,
      result,
    };
    setSession((current) => ({
      ...current,
      updatedAt: now,
      items: [...current.items, item],
    }));
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
    resetSession,
  };
}

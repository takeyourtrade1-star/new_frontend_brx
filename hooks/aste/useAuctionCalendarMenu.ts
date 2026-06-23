'use client';

import { useCallback, useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

import { buildAuctionExpiryIcs, buildGoogleCalendarUrl } from '@/lib/auction/calendar';

export interface UseAuctionCalendarMenuParams {
  numericId: number;
  detailTitle: string;
  endsAt: string;
  calendarMenuMobileRef: RefObject<HTMLDivElement | null>;
  calendarMenuDesktopRef: RefObject<HTMLDivElement | null>;
}

export interface UseAuctionCalendarMenuReturn {
  calendarMenuOpen: boolean;
  setCalendarMenuOpen: Dispatch<SetStateAction<boolean>>;
  handleAddToIosCalendar: () => void;
  handleAddToGoogleCalendar: () => void;
}

/**
 * Menu "Aggiungi al calendario" (ICS + Google): stato, handler e chiusura
 * su click esterno (due ref) + Escape. Estratto da AsteDetailView.
 */
export function useAuctionCalendarMenu({
  numericId,
  detailTitle,
  endsAt,
  calendarMenuMobileRef,
  calendarMenuDesktopRef,
}: UseAuctionCalendarMenuParams): UseAuctionCalendarMenuReturn {
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);

  const downloadCalendarIcs = useCallback(() => {
    if (typeof window === 'undefined') return;
    const eventStart = new Date(endsAt);
    if (Number.isNaN(eventStart.getTime())) return;

    const icsContent = buildAuctionExpiryIcs({
      auctionId: numericId,
      title: detailTitle,
      url: window.location.href,
      start: eventStart,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const fileUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = `asta-${numericId}-scadenza.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(fileUrl);
  }, [detailTitle, endsAt, numericId]);

  const openGoogleCalendar = useCallback(() => {
    if (typeof window === 'undefined') return;
    const eventStart = new Date(endsAt);
    if (Number.isNaN(eventStart.getTime())) return;
    const url = buildGoogleCalendarUrl({
      title: detailTitle,
      url: window.location.href,
      start: eventStart,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [detailTitle, endsAt]);

  const handleAddToIosCalendar = useCallback(() => {
    downloadCalendarIcs();
    setCalendarMenuOpen(false);
  }, [downloadCalendarIcs]);

  const handleAddToGoogleCalendar = useCallback(() => {
    openGoogleCalendar();
    setCalendarMenuOpen(false);
  }, [openGoogleCalendar]);

  useEffect(() => {
    if (!calendarMenuOpen) return;
    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (calendarMenuMobileRef.current?.contains(target)) return;
      if (calendarMenuDesktopRef.current?.contains(target)) return;
      setCalendarMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCalendarMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [calendarMenuOpen, calendarMenuDesktopRef, calendarMenuMobileRef]);

  return {
    calendarMenuOpen,
    setCalendarMenuOpen,
    handleAddToIosCalendar,
    handleAddToGoogleCalendar,
  };
}

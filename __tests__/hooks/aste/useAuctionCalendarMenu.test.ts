import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';

import { useAuctionCalendarMenu } from '@/hooks/aste/useAuctionCalendarMenu';
import { buildGoogleCalendarUrl } from '@/lib/auction/calendar';

vi.mock('@/lib/auction/calendar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auction/calendar')>();
  return {
    ...actual,
    buildGoogleCalendarUrl: vi.fn(() => 'https://calendar.google.com/mock'),
    buildAuctionExpiryIcs: vi.fn(() => 'BEGIN:VCALENDAR\nEND:VCALENDAR'),
  };
});

function useProbe(overrides?: Partial<Parameters<typeof useAuctionCalendarMenu>[0]>) {
  const calendarMenuMobileRef = useRef<HTMLDivElement>(null);
  const calendarMenuDesktopRef = useRef<HTMLDivElement>(null);
  const hook = useAuctionCalendarMenu({
    numericId: 42,
    detailTitle: 'Test Asta',
    endsAt: '2026-12-01T12:00:00.000Z',
    calendarMenuMobileRef,
    calendarMenuDesktopRef,
    ...overrides,
  });
  return { ...hook, calendarMenuMobileRef, calendarMenuDesktopRef };
}

describe('useAuctionCalendarMenu', () => {
  const openSpy = vi.fn();
  const createObjectURLSpy = vi.fn(() => 'blob:mock');
  const revokeObjectURLSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = openSpy;
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('chiude il menu su Escape quando aperto', () => {
    const { result } = renderHook(() => useProbe());

    act(() => {
      result.current.setCalendarMenuOpen(true);
    });
    expect(result.current.calendarMenuOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(result.current.calendarMenuOpen).toBe(false);
  });

  it('apre Google Calendar e chiude il menu', () => {
    const { result } = renderHook(() => useProbe());

    act(() => {
      result.current.setCalendarMenuOpen(true);
      result.current.handleAddToGoogleCalendar();
    });

    expect(buildGoogleCalendarUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Asta',
        start: expect.any(Date) as Date,
      }),
    );
    expect(openSpy).toHaveBeenCalledWith(
      'https://calendar.google.com/mock',
      '_blank',
      'noopener,noreferrer',
    );
    expect(result.current.calendarMenuOpen).toBe(false);
  });

  it('scarica ICS e chiude il menu', () => {
    const clickSpy = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = clickSpy;
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

    const { result } = renderHook(() => useProbe());

    act(() => {
      result.current.setCalendarMenuOpen(true);
      result.current.handleAddToIosCalendar();
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock');
    expect(result.current.calendarMenuOpen).toBe(false);

    createElementSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

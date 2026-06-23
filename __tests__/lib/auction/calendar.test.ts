import { describe, expect, it } from 'vitest';

import { buildAuctionExpiryIcs, buildGoogleCalendarUrl } from '@/lib/auction/calendar';

const START = new Date('2026-06-23T18:30:00.000Z');

describe('buildAuctionExpiryIcs', () => {
  const ics = buildAuctionExpiryIcs({
    auctionId: 42,
    title: 'Black Lotus',
    url: 'https://ebartex.test/aste/42',
    start: START,
  });

  it('produce un VCALENDAR/VEVENT valido con CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('imposta DTSTART alla scadenza e DTEND a +30 minuti', () => {
    expect(ics).toContain('DTSTART:20260623T183000Z');
    expect(ics).toContain('DTEND:20260623T190000Z');
  });

  it('include UID deterministico e URL', () => {
    expect(ics).toContain(`UID:auction-42-${START.getTime()}@ebartex`);
    expect(ics).toContain('URL:https://ebartex.test/aste/42');
  });

  it('escapa il testo ICS (newline letterale nella description)', () => {
    expect(ics).toContain('SUMMARY:Scadenza asta: Black Lotus');
    expect(ics).toContain('DESCRIPTION:');
    // la description contiene \\n letterale + url, escapato dal helper ICS
    expect(ics).toContain('https://ebartex.test/aste/42');
  });
});

describe('buildGoogleCalendarUrl', () => {
  const url = new URL(
    buildGoogleCalendarUrl({
      title: 'Black Lotus',
      url: 'https://ebartex.test/aste/42',
      start: START,
    }),
  );

  it('punta al render template di Google Calendar', () => {
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
  });

  it('passa titolo, location e intervallo date', () => {
    expect(url.searchParams.get('text')).toBe('Scadenza asta: Black Lotus');
    expect(url.searchParams.get('location')).toBe('https://ebartex.test/aste/42');
    expect(url.searchParams.get('dates')).toBe('20260623T183000Z/20260623T190000Z');
  });
});

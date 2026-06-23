// Builder puri per il promemoria "scadenza asta": contenuto .ics e URL Google
// Calendar. Estratti da AsteDetailView per isolare la logica (testabile) dagli
// effetti DOM (Blob/anchor/window.open) che restano nel componente.

import { escapeIcsText, formatGoogleDateUtc, formatIcsDateUtc } from './auction-detail-utils';

/** Durata fittizia dell'evento promemoria (l'asta "scade" a `start`). */
const EVENT_DURATION_MS = 30 * 60 * 1000;

export interface AuctionCalendarEvent {
  auctionId: number;
  title: string;
  /** URL pubblico dell'asta (es. window.location.href). */
  url: string;
  /** Istante di scadenza dell'asta. */
  start: Date;
}

/** Genera il contenuto di un file .ics per la scadenza dell'asta. */
export function buildAuctionExpiryIcs({ auctionId, title, url, start }: AuctionCalendarEvent): string {
  const end = new Date(start.getTime() + EVENT_DURATION_MS);
  const nowUtc = formatIcsDateUtc(new Date());
  const startUtc = formatIcsDateUtc(start);
  const endUtc = formatIcsDateUtc(end);
  const eventTitle = `Scadenza asta: ${title}`;
  const eventDescription = `L'asta "${title}" scade in questo momento.\\n${url}`;
  const uid = `auction-${auctionId}-${start.getTime()}@ebartex`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EBARTEX//Auction Calendar//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${escapeIcsText(eventTitle)}`,
    `DESCRIPTION:${escapeIcsText(eventDescription)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Costruisce l'URL "TEMPLATE" di Google Calendar per la scadenza dell'asta. */
export function buildGoogleCalendarUrl({ title, url, start }: Omit<AuctionCalendarEvent, 'auctionId'>): string {
  const end = new Date(start.getTime() + EVENT_DURATION_MS);
  const eventTitle = `Scadenza asta: ${title}`;
  const eventDetails = `L'asta "${title}" scade in questo momento.`;
  const gcalUrl = new URL('https://calendar.google.com/calendar/render');
  gcalUrl.searchParams.set('action', 'TEMPLATE');
  gcalUrl.searchParams.set('text', eventTitle);
  gcalUrl.searchParams.set('details', eventDetails);
  gcalUrl.searchParams.set('location', url);
  gcalUrl.searchParams.set('dates', `${formatGoogleDateUtc(start)}/${formatGoogleDateUtc(end)}`);
  return gcalUrl.toString();
}

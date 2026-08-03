/**
 * Helper per costruire URL assoluti delle immagini carte da path salvati in DB/Meilisearch.
 * Il DB può salvare path con prefisso errato "img/" (es. img/cards/4/158647.webp).
 * L'URL corretto è: CDN + path senza "img/" (es. https://....cloudfront.net/cards/4/158647.webp).
 */

import { safePublicImageUrl } from '@/lib/security/catalog-public-data';

/**
 * Rimuove il prefisso legacy "/img/" o "img/" dal path (DB/Meilisearch può avere /img/cards/6/227574.jpg).
 * Su S3/CloudFront le immagini sono senza quel prefisso: cards/6/227574.jpg.
 */
/**
 * Restituisce l'URL assoluto per l'icona di un set (set_icon_uri).
 * - Se raw è una URL assoluta o path relativo → gestisci come CDN.
 * - Se raw è null/vuoto e il gioco è MTG → fallback Scryfall SVG pubblico.
 * - Altrimenti → null.
 */
export function getSetIconUrl(
  raw: string | null | undefined,
  options?: { gameSlug?: string; setCode?: string }
): string | null {
  if (raw != null && raw !== '') {
    return safePublicImageUrl(raw, 'set-icon');
  }

  // Fallback Scryfall per MTG: solo se game_slug è mtg e set_code è disponibile
  const gameSlug = options?.gameSlug ?? '';
  const setCode = options?.setCode ?? '';
  if (
    (gameSlug === 'mtg' || gameSlug === '') &&
    setCode &&
    /^[a-z0-9]{2,6}$/i.test(setCode.trim())
  ) {
    return `https://svgs.scryfall.io/sets/${setCode.trim().toLowerCase()}.svg`;
  }

  return null;
}

/** Testo badge set: codice DB, prime 3 lettere del nome, oppure "?". */
export function getSetCodeDisplay(
  setCode?: string | null,
  setName?: string | null
): string {
  const code = (setCode ?? '').trim();
  if (code.length > 0) return code.slice(0, 6).toUpperCase();
  const name = (setName ?? '').trim();
  if (name.length > 0) return name.slice(0, 3).toUpperCase();
  return '?';
}

/**
 * Restituisce l'URL assoluto per l'immagine di una carta.
 * - Se raw è null/undefined/vuoto → null.
 * - Se raw inizia con http → restituito così com'è (normalizzando il prefisso img/).
 * - Altrimenti: accetta soltanto un path relativo risolvibile sul CDN noto.
 */
export function getCardImageUrl(raw: string | null | undefined): string | null {
  return safePublicImageUrl(raw, 'card');
}

/**
 * Helper per costruire URL assoluti delle immagini carte da path salvati in DB/Meilisearch.
 * Il DB può salvare path con prefisso errato "img/" (es. img/cards/4/158647.webp).
 * L'URL corretto è: CDN + path senza "img/" (es. https://....cloudfront.net/cards/4/158647.webp).
 */

import { ASSETS } from '@/lib/config';

/**
 * Rimuove il prefisso legacy "/img/" o "img/" dal path (DB/Meilisearch può avere /img/cards/6/227574.jpg).
 * Su S3/CloudFront le immagini sono senza quel prefisso: cards/6/227574.jpg.
 */
function stripImgPrefix(path: string): string {
  const raw = path.trim();
  if (raw.startsWith('/img/')) return raw.replace(/^\/img\//, '');
  if (raw.startsWith('img/')) return raw.replace(/^img\//, '');
  return raw;
}

/**
 * Restituisce l'URL assoluto per l'immagine di una carta.
 * - Se raw è null/undefined/vuoto → null.
 * - Se raw inizia con http → restituito così com'è.
 * - Altrimenti: si rimuove il prefisso "img/" e si prepende ASSETS.cdnUrl.
 */
export function getCardImageUrl(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const path = stripImgPrefix(trimmed);
  if (!path) return null;
  const base = (ASSETS.cdnUrl || '').replace(/\/+$/, '');
  const pathWithLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${pathWithLeadingSlash}` : pathWithLeadingSlash;
}

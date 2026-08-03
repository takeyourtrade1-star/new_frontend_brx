/**
 * Application Configuration
 * Gestisce tutte le variabili di ambiente e configurazioni globali
 * 
 * Supporta architettura AWS:
 * - auth: Microservizio di autenticazione su AWS (FastAPI con JWT RS256)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/** L'identificatore indice non e' sensibile; host e chiavi sono server-only. */
export const MEILISEARCH_PUBLIC_INDEX_NAME =
  process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || 'cards';

/** Browser API traffic is always same-origin through the hardened BFF. */
export const API_URLS = {
  auth: '',
} as const;

/**
 * Configurazione per gli asset (CDN / S3 via CloudFront)
 * - cdnUrl: base CDN per immagini carte (es. https://....cloudfront.net) → path tipo /cards/4/xxx.webp
 * - imagesBaseUrl: base CDN per immagini UI (es. https://....cloudfront.net/images) → aste.png, cart-icon.png, etc.
 *
 * In locale: senza NEXT_PUBLIC_CDN_URL le URL diventano /cards/... sul dev server e le immagini non esistono
 * (sono su S3). In development usiamo il CloudFront pubblico Ebartex come fallback (stesso .env.example).
 */
const EBARTEX_CDN_FALLBACK_DEV = 'https://di0y87a9s8da9.cloudfront.net';
const cdnBase = (
  process.env.NEXT_PUBLIC_CDN_URL ||
  (isDevelopment ? EBARTEX_CDN_FALLBACK_DEV : '')
).replace(/\/+$/, '');
export const ASSETS = {
  cdnUrl: cdnBase,
  /** URL base per immagini UI: CDN + /images (es. https://di0y87a9s8da9.cloudfront.net/images) */
  imagesBaseUrl: cdnBase ? `${cdnBase}/images` : '',
} as const;

/**
 * URL pubblico del sito — usato per metadata, sitemap, robots, canonical, OG.
 * NON è la CDN immagini (CloudFront): impostare NEXT_PUBLIC_SITE_URL (o APP_URL)
 * in produzione. Single source of truth per evitare basi URL incoerenti.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://ebartex.com'
).replace(/\/+$/, '');

/**
 * Restituisce l'URL dell'immagine UI (icone, illustrazioni). Se CDN configurato usa ASSETS.imagesBaseUrl, altrimenti /images/.
 * @param path - path relativo senza leading slash (es. "aste.png", "icone-credito/xxx.png")
 */
export function getCdnImageUrl(path: string): string {
  const p = path.replace(/^\/+/, '');
  if (ASSETS.imagesBaseUrl) return `${ASSETS.imagesBaseUrl}/${p}`;
  return `/images/${p}`;
}

/**
 * Restituisce l'URL di un video (es. sfondo landing). Stessa logica delle immagini: CDN o path locale sotto /images/.
 * Per S3: caricare in bucket sotto images/videos/ (es. video_carte.mp4).
 * @param path - path relativo senza leading slash (es. "videos/sfondo_carte.mp4", "videos/video_carte.mp4")
 */
export function getCdnVideoUrl(path: string): string {
  const p = path.replace(/^\/+/, '');
  if (ASSETS.imagesBaseUrl) return `${ASSETS.imagesBaseUrl}/${p}`;
  return `/images/${p}`;
}

export const config = {
  api: {
    baseURL: '',
    timeout: 30000, // 30 secondi
  },
  auth: {
    baseURL: '',
    tokenKey: 'ebartex_access_token',
    refreshTokenKey: 'ebartex_refresh_token',
    userKey: 'ebartex_user',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Ebartex',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  debug: {
    isDevelopment,
    showNetworkErrors: true,
  },
} as const;

export default config;

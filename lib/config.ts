/**
 * Application Configuration
 * Gestisce tutte le variabili di ambiente e configurazioni globali
 * 
 * Supporta architettura AWS:
 * - auth: Microservizio di autenticazione su AWS (FastAPI con JWT RS256)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Normalizza un URL rimuovendo il trailing slash
 */
const normalizeURL = (url: string): string => {
  if (!url) return url;
  return url.replace(/\/+$/, '');
};

/**
 * URL del microservizio di autenticazione (Python FastAPI su AWS EC2)
 * Usa sempre l'URL da env (NEXT_PUBLIC_AUTH_API_URL o VITE_AWS_AUTH_URL), non il proxy.
 */
const getAuthApiURL = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.VITE_AWS_AUTH_URL;

  if (!envUrl) {
    if (!isDevelopment) {
      throw new Error('NEXT_PUBLIC_AUTH_API_URL non è configurato. Configura la variabile d\'ambiente con l\'URL AWS.');
    }
    console.warn('NEXT_PUBLIC_AUTH_API_URL non configurato. Usa URL AWS di default.');
    return 'http://35.152.143.30:8000';
  }

  return normalizeURL(envUrl);
};

/**
 * Meilisearch - URL e API Key per ricerca globale (react-instantsearch)
 * Usa sempre l'URL da env (NEXT_PUBLIC_MEILISEARCH_URL / HOST), come prima.
 */
const getMeilisearchHost = (): string => {
  const url =
    process.env.NEXT_PUBLIC_MEILISEARCH_URL || process.env.NEXT_PUBLIC_MEILISEARCH_HOST;
  if (url) return normalizeURL(url);
  if (isDevelopment) {
    return 'http://35.152.143.30:7700';
  }
  return '';
};

/** Chiave API Meilisearch: deve essere quella dell'istanza attuale (es. 35.152.143.30). Se l'istanza accetta ricerca senza chiave, lasciare vuoto. */
const getMeilisearchApiKey = (): string => {
  return process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY ?? '';
};

// URL delle API
const authApiURL = getAuthApiURL();

/**
 * Oggetto centralizzato con tutti gli URL delle API
 */
export const API_URLS = {
  auth: authApiURL,
} as const;

export const MEILISEARCH = {
  host: getMeilisearchHost(),
  apiKey: getMeilisearchApiKey(),
  indexName: process.env.NEXT_PUBLIC_MEILISEARCH_INDEX ?? 'cards',
} as const;

/**
 * Configurazione per gli asset (CDN)
 * - cdnUrl: base CDN per immagini carte (es. https://....cloudfront.net) → path tipo /cards/4/xxx.webp
 * - imagesBaseUrl: base CDN per immagini UI (es. https://....cloudfront.net/images) → aste.png, cart-icon.png, etc.
 */
const cdnBase = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');
export const ASSETS = {
  cdnUrl: cdnBase,
  /** URL base per immagini UI: CDN + /images (es. https://di0y87a9s8da9.cloudfront.net/images) */
  imagesBaseUrl: cdnBase ? `${cdnBase}/images` : '',
} as const;

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

/**
 * URL del servizio Search Engine (BRX_Search) per operazioni admin (es. reindex).
 * Impostare NEXT_PUBLIC_SEARCH_API_URL nel .env (es. http://localhost:8000 o URL AWS).
 */
export const SEARCH_ADMIN_API_URL =
  process.env.NEXT_PUBLIC_SEARCH_API_URL || process.env.VITE_SEARCH_API_URL || '';

// Log per debug (solo in sviluppo, dopo la dichiarazione di MEILISEARCH)
if (isDevelopment && typeof window !== 'undefined') {
  console.log('[Config] Auth API URL:', authApiURL);
  console.log('[Config] Meilisearch Host:', MEILISEARCH.host);
}

export const config = {
  api: {
    baseURL: authApiURL,
    timeout: 30000, // 30 secondi
  },
  auth: {
    baseURL: authApiURL,
    tokenKey: 'ebartex_access_token',
    refreshTokenKey: 'ebartex_refresh_token',
    userKey: 'ebartex_user',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Ebartex',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  meilisearch: {
    url: MEILISEARCH.host,
    apiKey: MEILISEARCH.apiKey,
    indexName: MEILISEARCH.indexName,
  },
  debug: {
    isDevelopment,
    showNetworkErrors: true,
  },
} as const;

export default config;

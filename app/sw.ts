import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry } from 'serwist';
import { Serwist, NetworkOnly } from 'serwist';

const manifest = (
  self as unknown as { __SW_MANIFEST: Array<PrecacheEntry | string> | undefined }
).__SW_MANIFEST;

const serwist = new Serwist({
  precacheEntries: manifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Le API private NON devono mai essere cachate dal service worker (rischio di
    // servire dati privati di altre sessioni). Deve venire PRIMA di defaultCache:
    // Serwist usa il primo matcher che corrisponde. `/api/search` è pubblico e
    // resta gestito da defaultCache.
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        url.pathname.startsWith('/api/') &&
        !url.pathname.startsWith('/api/search'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

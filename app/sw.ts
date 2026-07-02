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

// --- Web Push -----------------------------------------------------------
// Il tsconfig usa lib "dom" (non "webworker"): PushEvent/NotificationEvent non
// esistono nei tipi, quindi usiamo interfacce strutturali minime e un cast di
// `self`, come già fatto sopra per __SW_MANIFEST.

interface PushMessagePayload {
  title?: string;
  body?: string;
  url?: string;
}

interface ExtendableEventLike extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface PushEventLike extends ExtendableEventLike {
  data: { json(): unknown } | null;
}

interface NotificationClickEventLike extends ExtendableEventLike {
  notification: { data?: { url?: string }; close(): void };
}

interface WindowClientLike {
  focus(): Promise<unknown>;
}

const swScope = self as unknown as {
  addEventListener(type: 'push', listener: (event: PushEventLike) => void): void;
  addEventListener(
    type: 'notificationclick',
    listener: (event: NotificationClickEventLike) => void
  ): void;
  registration: {
    showNotification(
      title: string,
      options?: { body?: string; icon?: string; badge?: string; data?: { url?: string } }
    ): Promise<void>;
  };
  clients: {
    matchAll(options?: {
      type?: string;
      includeUncontrolled?: boolean;
    }): Promise<WindowClientLike[]>;
    openWindow(url: string): Promise<unknown>;
  };
};

swScope.addEventListener('push', (event) => {
  let payload: PushMessagePayload = {};
  try {
    payload = (event.data?.json() ?? {}) as PushMessagePayload;
  } catch {
    // Payload non-JSON: mostriamo comunque la notifica con i default.
  }
  event.waitUntil(
    swScope.registration.showNotification(payload.title ?? 'EbarteX', {
      body: payload.body ?? '',
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: payload.url ?? '/' },
    })
  );
});

swScope.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    swScope.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients[0];
        if (existing) return existing.focus();
        return swScope.clients.openWindow(url);
      })
  );
});

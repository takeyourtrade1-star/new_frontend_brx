import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/account/',
        '/test-images/',
        '/demo/',
        '/login/',
        '/recupera-credenziali/',
        '/registrati/',
        '/ordini/',
        // Flussi app/privati (dietro auth o non utili all'indice).
        '/scanner',
        '/bidding',
        '/cart',
        '/aste/nuova',
        '/aste/mie',
        '/aste/partecipazioni',
        '/vendi/',
        '/c/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

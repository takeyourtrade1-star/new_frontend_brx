import { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_CDN_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://ebartex.com';

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
      ],
    },
    sitemap: `${BASE_URL.replace(/\/+$/, '')}/sitemap.xml`,
  };
}

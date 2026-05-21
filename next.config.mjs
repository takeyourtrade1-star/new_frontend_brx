import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: new URL('.', import.meta.url).pathname,
  // Evita fallimento build su Amplify/CI per opzioni ESLint deprecate (useEslintrc, extensions)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.ebartex.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ebartex.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cards.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: '*.scryfall.io', pathname: '/**' },
      // set_icon_uri may be stored as direct S3 URLs before/without CloudFront
      { protocol: 'https', hostname: '*.s3.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.s3.eu-south-1.amazonaws.com', pathname: '/**' },
    ],
  },
  // Usa le stesse variabili del frontend Vite: mappa VITE_* su NEXT_PUBLIC_* per il client
  env: {
    NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.VITE_AWS_AUTH_URL,
    NEXT_PUBLIC_CDN_URL:
      process.env.NEXT_PUBLIC_CDN_URL ||
      process.env.VITE_CDN_URL ||
      process.env.NEXT_PUBLIC_CDN_BASE_URL,
    NEXT_PUBLIC_MEILISEARCH_URL: process.env.NEXT_PUBLIC_MEILISEARCH_URL || process.env.VITE_MEILISEARCH_URL,
    NEXT_PUBLIC_MEILISEARCH_HOST: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || process.env.VITE_MEILISEARCH_HOST,
    NEXT_PUBLIC_MEILISEARCH_API_KEY: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || process.env.VITE_MEILISEARCH_API_KEY,
    NEXT_PUBLIC_MEILISEARCH_INDEX: process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || process.env.VITE_MEILISEARCH_INDEX,
    NEXT_PUBLIC_SEARCH_API_URL: process.env.NEXT_PUBLIC_SEARCH_API_URL || process.env.VITE_SEARCH_API_URL,
    NEXT_PUBLIC_SYNC_API_URL:
      process.env.NEXT_PUBLIC_SYNC_API_URL || process.env.VITE_SYNC_API_URL,
    NEXT_PUBLIC_AUCTION_API_URL: process.env.NEXT_PUBLIC_AUCTION_API_URL,
    NEXT_PUBLIC_MARKETPLACE_API_URL: process.env.NEXT_PUBLIC_MARKETPLACE_API_URL,
  },
  async headers() {
    // Skip security headers in development for easier debugging
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.cloudfront.net https://*.ebartex.com https://flagcdn.com https://cards.scryfall.io https://*.scryfall.io https://c1.scryfall.com https://c2.scryfall.com https://*.s3.amazonaws.com https://*.s3.eu-south-1.amazonaws.com",
              "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
              "media-src 'self' https://*.cloudfront.net",
              "connect-src 'self' https://*.ebartex.com https://*.cloudfront.net https://*.meilisearch.com wss://*.ebartex.com https://ebartex-user-uploads-prod.s3.eu-south-1.amazonaws.com https://ebartex-brx-match-data.s3.eu-south-1.amazonaws.com https://ebartex-brx-match-data.s3.amazonaws.com https://*.s3.eu-south-1.amazonaws.com https://*.s3.amazonaws.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // Rewrites: proxy verso servizi esterni (stesso origin per il browser, niente CORS)
  async rewrites() {
    const searchApiUrl = process.env.NEXT_PUBLIC_SEARCH_API_URL || process.env.VITE_SEARCH_API_URL || 'http://localhost:8000';
    const syncApiUrl = (process.env.SYNC_API_URL || process.env.NEXT_PUBLIC_SYNC_API_URL || process.env.VITE_SYNC_API_URL || 'https://sync.ebartex.com').replace(/\/+$/, '');
    const brxMatchUrl = (process.env.BRX_MATCH_API_URL || 'http://15.160.8.178:8005').replace(/\/+$/, '');
    const marketplaceApiUrl = (process.env.MARKETPLACE_API_URL || process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'http://15.160.8.178:8004').replace(/\/+$/, '');

    return [
      // Favicon: evita 404 su /favicon.ico servendo logo-pwa.svg
      { source: '/favicon.ico', destination: '/logo-pwa.svg' },
      // Proxy per Search Engine (BRX_Search) - reindex e altre API admin
      {
        source: '/search-api/:path*',
        destination: `${searchApiUrl}/:path*`,
      },
      // Proxy per BRX Sync: /api/sync/* → sync.ebartex.com (imposta SYNC_API_URL su Amplify)
      {
        source: '/api/sync/:path*',
        destination: `${syncApiUrl}/api/v1/sync/:path*`,
      },
      // Proxy per BRX Match (scanner MTG): /brx-match/* → EC2 dedicata (imposta BRX_MATCH_API_URL su Amplify)
      {
        source: '/brx-match/:path*',
        destination: `${brxMatchUrl}/brx-match/:path*`,
      },
      // Proxy per BRX Marketplace: /api/marketplace/* → 15.160.8.178:8004/api/v1/*
      {
        source: '/api/marketplace/:path*',
        destination: `${marketplaceApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default process.env.NODE_ENV === 'development'
  ? nextConfig
  : withSerwist(nextConfig);

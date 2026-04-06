/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita fallimento build su Amplify/CI per opzioni ESLint deprecate (useEslintrc, extensions)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.ebartex.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ebartex.com', pathname: '/**' },
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
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.cloudfront.net https://*.ebartex.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.ebartex.com https://*.cloudfront.net https://*.meilisearch.com wss://*.ebartex.com",
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

    return [
      // Favicon: evita 404 su /favicon.ico servendo icon.svg
      { source: '/favicon.ico', destination: '/icon.svg' },
      // Proxy per Search Engine (BRX_Search) - reindex e altre API admin
      {
        source: '/search-api/:path*',
        destination: `${searchApiUrl}/:path*`,
      },
      // Proxy per BRX Sync (CardTrader): /api/sync/* → sync.ebartex.com (imposta SYNC_API_URL su Amplify)
      {
        source: '/api/sync/:path*',
        destination: `${syncApiUrl}/api/v1/sync/:path*`,
      },
    ];
  },
};

export default nextConfig;

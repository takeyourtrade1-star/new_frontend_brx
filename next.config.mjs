import withSerwistInit from '@serwist/next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Usa cwd come root per il file tracing; evita che Next.js inferisca la root
  // dalla parent directory quando c'è un package-lock.json superiore.
  outputFileTracingRoot: process.cwd().replace(/\\/g, '/'),
  // Evita fallimento build su Amplify/CI per opzioni ESLint deprecate (useEslintrc, extensions)
  eslint: { ignoreDuringBuilds: false },
  compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  typescript: { ignoreBuildErrors: false },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  images: {
    // Output moderni per le immagini che passano dall'optimizer (quelle senza
    // `unoptimized`, es. asset locali e `unoptimized={false}`). Le immagini CDN
    // restano `unoptimized` per scelta deliberata del codebase (già su CloudFront).
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.ebartex.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ebartex.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cards.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: '*.scryfall.io', pathname: '/**' },
      // set_icon_uri may be stored as direct S3 URLs before/without CloudFront
      { protocol: 'https', hostname: '*.s3.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.s3.eu-south-1.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'flagcdn.com', pathname: '/**' },
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
    NEXT_PUBLIC_MEILISEARCH_INDEX: process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || process.env.VITE_MEILISEARCH_INDEX,
    NEXT_PUBLIC_SEARCH_API_URL: process.env.NEXT_PUBLIC_SEARCH_API_URL || process.env.VITE_SEARCH_API_URL,
    NEXT_PUBLIC_SYNC_API_URL:
      process.env.NEXT_PUBLIC_SYNC_API_URL || process.env.VITE_SYNC_API_URL,
    NEXT_PUBLIC_AUCTION_API_URL: process.env.NEXT_PUBLIC_AUCTION_API_URL,
    NEXT_PUBLIC_MARKETPLACE_API_URL: process.env.NEXT_PUBLIC_MARKETPLACE_API_URL,
    MARKETPLACE_API_URL: process.env.MARKETPLACE_API_URL,
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
  async redirects() {
    return [
      {
        source: '/tornei-live',
        destination: 'https://tornei.ebartex.com',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    if (!process.env.BRX_MATCH_API_URL) {
      // Fallback hardcoded all'IP del servizio match: utile in dev, ma in
      // produzione la variabile DEVE essere impostata. Segnaliamo a build-time
      // così la mancanza non passa silenziosa in CI/deploy.
      console.warn(
        '[next.config] BRX_MATCH_API_URL non impostata: uso fallback hardcoded http://15.160.8.178:8005. Impostare la variabile in produzione.'
      );
    }
    const brxMatchUrl = (process.env.BRX_MATCH_API_URL || 'http://15.160.8.178:8005').replace(/\/+$/, '');

    // NOTA: /api/sync/* e /api/marketplace/* NON hanno rewrite qui.
    // Esistono route handler dedicati (app/api/sync/[...path]/route.ts e
    // app/api/marketplace/[...path]/route.ts) che applicano auth cookie-first,
    // rate limiting e timeout. I rewrites Next.js vengono eseguiti prima dei
    // route handler e li bypasserebbero, vanificando i controlli di sicurezza.
    return [
      // Favicon: evita 404 su /favicon.ico servendo logo-pwa.svg
      { source: '/favicon.ico', destination: '/logo-pwa.svg' },
      // NOTA: il vecchio rewrite /search-api/* → BRX_Search (API admin, es. reindex)
      // è stato rimosso: nessun call-site nel frontend e bypassava auth/rate-limit
      // del BFF, esponendo il servizio admin a chiunque.
      // Proxy per BRX Match (scanner MTG): /brx-match/* → EC2 dedicata (imposta BRX_MATCH_API_URL su Amplify)
      {
        source: '/brx-match/:path*',
        destination: `${brxMatchUrl}/brx-match/:path*`,
      },
    ];
  },
};

const configuredNext =
  process.env.NODE_ENV === 'development' ? nextConfig : withSerwist(nextConfig);

export default withBundleAnalyzer(configuredNext);

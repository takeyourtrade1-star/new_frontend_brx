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
  poweredByHeader: false,
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
      { protocol: 'https', hostname: 'di0y87a9s8da9.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.ebartex.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cards.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: 'svgs.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: 'c1.scryfall.com', pathname: '/**' },
      { protocol: 'https', hostname: 'c2.scryfall.com', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'ebartex-user-uploads-prod.s3.eu-south-1.amazonaws.com',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 'flagcdn.com', pathname: '/**' },
    ],
  },
  // Esporre al browser soltanto configurazione realmente pubblica. Le origini
  // HTTP dei microservizi restano variabili server-only lette dai route handler.
  env: {
    NEXT_PUBLIC_CDN_URL:
      process.env.NEXT_PUBLIC_CDN_URL ||
      process.env.VITE_CDN_URL ||
      process.env.NEXT_PUBLIC_CDN_BASE_URL,
    NEXT_PUBLIC_AVATAR_ALLOWED_ORIGINS:
      process.env.NEXT_PUBLIC_AVATAR_ALLOWED_ORIGINS || 'https://cdn.ebartex.com',
    NEXT_PUBLIC_MEILISEARCH_INDEX: process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || process.env.VITE_MEILISEARCH_INDEX,
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
        ],
      },
    ];
  },
  // Rewrites: proxy verso servizi esterni (stesso origin per il browser, niente CORS)
  async rewrites() {
    // NOTA: /api/sync/* e /api/marketplace/* NON hanno rewrite qui.
    // Esistono route handler dedicati (app/api/sync/[...path]/route.ts e
    // app/api/marketplace/[...path]/route.ts)
    // che applicano auth cookie-first quando presente,
    // rate limiting e timeout. I rewrites Next.js vengono eseguiti prima dei
    // route handler e li bypasserebbero, vanificando i controlli di sicurezza.
    return [
      // Favicon: evita 404 su /favicon.ico servendo logo-pwa.svg
      { source: '/favicon.ico', destination: '/logo-pwa.svg' },
      // NOTA: il vecchio rewrite /search-api/* → BRX_Search (API admin, es. reindex)
      // è stato rimosso: nessun call-site nel frontend e bypassava auth/rate-limit
      // del BFF, esponendo il servizio admin a chiunque.
    ];
  },
};

const configuredNext =
  process.env.NODE_ENV === 'development' ? nextConfig : withSerwist(nextConfig);

export default withBundleAnalyzer(configuredNext);

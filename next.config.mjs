/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**', pathname: '/**' },
      { protocol: 'http', hostname: '**', pathname: '/**' },
    ],
  },
  // Usa le stesse variabili del frontend Vite: mappa VITE_* su NEXT_PUBLIC_* per il client
  env: {
    NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.VITE_AWS_AUTH_URL,
    NEXT_PUBLIC_MEILISEARCH_URL: process.env.NEXT_PUBLIC_MEILISEARCH_URL || process.env.VITE_MEILISEARCH_URL,
    NEXT_PUBLIC_MEILISEARCH_HOST: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || process.env.VITE_MEILISEARCH_HOST,
    NEXT_PUBLIC_MEILISEARCH_API_KEY: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || process.env.VITE_MEILISEARCH_API_KEY,
    NEXT_PUBLIC_MEILISEARCH_INDEX: process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || process.env.VITE_MEILISEARCH_INDEX,
    NEXT_PUBLIC_SEARCH_API_URL: process.env.NEXT_PUBLIC_SEARCH_API_URL || process.env.VITE_SEARCH_API_URL,
  },
  // Rewrites: proxy verso servizi esterni (stesso origin per il browser, niente CORS)
  async rewrites() {
    const searchApiUrl = process.env.NEXT_PUBLIC_SEARCH_API_URL || process.env.VITE_SEARCH_API_URL || 'http://localhost:8000';
    const syncApiUrl = (process.env.SYNC_API_URL || process.env.NEXT_PUBLIC_SYNC_API_URL || process.env.VITE_SYNC_API_URL || 'https://sync.ebartex.com').replace(/\/+$/, '');

    return [
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

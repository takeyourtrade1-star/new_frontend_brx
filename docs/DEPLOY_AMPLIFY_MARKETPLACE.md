# Amplify — variabili Marketplace

Stesso pattern di Sync (`DEPLOY_AMPLIFY_SYNC.md`) e Auction.

## Variabili obbligatorie

| Variabile | Valore production | Note |
|-----------|-------------------|------|
| **`MARKETPLACE_API_URL`** | `http://marketplace-api.ebartex.com` | **Runtime** — usa **http** finché SSL Let's Encrypt non è attivo |
| **`NEXT_PUBLIC_MARKETPLACE_API_URL`** | `http://marketplace-api.ebartex.com` | Fallback build + SSR |

**Non usare** `https://api.ebartex.com/marketplace` (path rewrite NPM instabile → 504).

**Non usare** IP diretto `http://15.160.8.178:8004` su Amplify (workaround temporaneo, non production).

## Flusso

1. Browser → `https://www.ebartex.com/api/marketplace/listings/...`
2. Route handler Amplify legge `MARKETPLACE_API_URL` a **runtime**
3. `fetch(https://marketplace-api.ebartex.com/api/v1/listings/...)`

Prerequisito: dominio `marketplace-api.ebartex.com` configurato in NPM (vedi `MARKETPLACE_DOMAIN_SETUP.md`).

## Dopo ogni modifica env

1. Amplify Console → App → Environment variables
2. Salva
3. **Redeploy** (trigger build)

## Verifica

Network tab browser:

- Request URL: `https://www.ebartex.com/api/marketplace/listings/public/by-blueprint/...`
- Status **200** (non 504)
- Response time **< 2s**

Publish listing:

- `POST /api/marketplace/listings` → **201** in pochi secondi

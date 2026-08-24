# Ebartex — Frontend

Marketplace di carte collezionabili (Magic, Pokémon, One Piece): aste live, scambi,
vendita C2C e BRX Express. Costruito con Next.js 15 (App Router),
TypeScript strict, Tailwind CSS e shadcn/ui.

## Tech stack

| Area | Scelta |
|------|--------|
| Framework | Next.js 15 (App Router) |
| Linguaggio | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Stato client | Zustand (`auth-store`, cart) |
| Stato server | TanStack Query (React Query) |
| Form | React Hook Form + Zod |
| Ricerca | Meilisearch (via route BFF) |
| PWA | Serwist (service worker) |
| i18n | 6 lingue (it, en, es, fr, pt, de) |

## Avvio rapido

```bash
npm install            # installa le dipendenze
cp .env.local.example .env.local   # se presente; altrimenti vedi "Variabili d'ambiente"
npm run dev            # http://localhost:3000
```

## Script

| Comando | Cosa fa |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Build di produzione (genera prima `build-info`) |
| `npm run start` | Avvia il build di produzione |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Unit test (Vitest) |
| `npm run i18n:keys` | Verifica che le 6 lingue abbiano le stesse chiavi |
| `npm run i18n:check` | Audit stringhe hardcoded (informativo) |

## Architettura

- **App Router** con Server Components di default; i componenti interattivi sono `'use client'`.
- **Pattern BFF**: il browser non parla mai direttamente con i microservizi. Tutte le
  chiamate passano da route handler `app/api/*` che applicano auth cookie-first,
  rate limit, timeout e `no-store`. Vedi [docs/](docs/) per i singoli servizi.
- **Auth**: JWT (cookie HttpOnly `ebartex_access_token` impostato dal BFF). Lo store
  Zustand mantiene anche lo stato utente lato client.
- **i18n**: dizionari in `lib/i18n/messages/<locale>.ts`. `en` (fallback) e `it`
  (default UI) sono nel bundle iniziale; le altre lingue sono caricate on-demand.
  Lookup sincrono via `useTranslation()` → `t('chiave')`.

## Struttura cartelle

```
app/                 # Route, layout e route handler BFF (app/api/*)
components/
  ui/                # Primitive shadcn
  feature/           # Componenti per dominio (aste, scambi, product, account, …)
  layout/            # Header, GlobalSearchBar, nav
lib/
  stores/            # Zustand (auth-store)
  hooks/             # Hook React Query (use-search, use-meilisearch-cards, …)
  i18n/              # Dizionari e runtime traduzioni
  config.ts          # Config centralizzata (URL servizi, CDN, Meilisearch)
hooks/               # Hook client condivisi
types/               # Interfacce TypeScript condivise
docs/                # Guide di deploy e setup servizi
scripts/             # Tooling (check i18n, build-info, budget bundle)
```

## Variabili d'ambiente

Le variabili `NEXT_PUBLIC_*` sono esposte al client (vedi `next.config.mjs`).
Le chiavi sensibili (es. Meilisearch admin) devono restare **server-only**.
Vedi [docs/](docs/) per i dettagli per ambiente (Amplify).

Il passaggio autenticato verso il portale Tornei usa authorization code
monouso + PKCE, documentato in [`docs/SSO_HANDOFF.md`](docs/SSO_HANDOFF.md).

Il BFF richiede in produzione un rate limiter Redis distribuito e un confine
proxy/IP esplicito; configurazione, rollout e smoke test sono descritti in
[`docs/RATE_LIMITING.md`](docs/RATE_LIMITING.md). In assenza dello store o di un
IP proveniente da un proxy fidato, le route protette rispondono fail-closed 503.

Le route gateway `/api/auth/users/public` e `/api/auth/users/search` richiedono
anche le variabili server-only `AUTH_INTERNAL_CALLER` e
`AUTH_INTERNAL_CALLER_TOKEN`. Il caller deve avere la capability Auth
`users.public:read`; il token non deve mai usare il prefisso `NEXT_PUBLIC_`.

# CLAUDE.md

Guida per agenti AI (Claude Code) che lavorano su questo repository.

## Cos'è

Frontend del marketplace **Ebartex** (carte collezionabili: Magic, Pokémon, One Piece).
Next.js 15 App Router, TypeScript strict, Tailwind + shadcn/ui. Dominio: aste live,
scambi, vendita C2C, BRX Express, scanner carte.

## Comandi

```bash
npm run dev          # dev server (http://localhost:3000)
npm run lint         # ESLint — DEVE restare a 0 errori
npm run typecheck    # tsc --noEmit — DEVE restare a 0 errori
npm run test         # Vitest
npm run i18n:keys    # le 6 lingue devono avere le stesse chiavi
npm run build        # build di produzione
```

Prima di considerare un lavoro concluso: `npm run typecheck` **e** `npm run lint`
devono passare. Se tocchi le stringhe i18n, esegui anche `npm run i18n:keys`.

## Regole d'architettura (non negoziabili)

1. **Mai chiamare i microservizi dal browser.** Ogni accesso backend passa da un
   route handler `app/api/*` (pattern BFF) che applica auth cookie-first, rate
   limit, timeout e `no-store`. Non aggiungere `fetch` diretti a URL di servizi
   nei componenti client.
2. **Data fetching via React Query.** Usa/aggiungi hook in `lib/hooks/`
   (es. `use-search`, `use-meilisearch-cards`). Non reintrodurre il pattern
   `useEffect` + `fetch` + `useState` per i dati server.
3. **i18n sincrono.** Testi visibili all'utente passano da `useTranslation()` →
   `t('chiave')`. Aggiungi la chiave a **tutti** e 6 i file
   `lib/i18n/messages/<locale>.ts`. `en` è il fallback; `en`+`it` sono nel bundle
   iniziale, le altre lingue sono lazy (vedi `lib/i18n/dictionaries.ts`).
4. **TypeScript strict.** Evita `any` e `@ts-ignore`; preferisci tipi espliciti.
5. **Immagini**: usa `next/image` per immagini remote/statiche. `<img>` raw è
   ammesso solo per `data:`/`blob:` URL (anteprime upload, screenshot), con
   `eslint-disable-next-line @next/next/no-img-element` e motivazione.

## Convenzioni

- Componenti interattivi: `'use client'` in cima. Default = Server Component.
- Stato client globale: Zustand (`lib/stores/auth-store.ts`). Stato server: React Query.
- Styling: classi Tailwind, mobile-first. Componenti base da shadcn (`components/ui`).
- Commenti e testi UI sono in italiano (lingua primaria del progetto).

## Mappa rapida

| Cosa | Dove |
|------|------|
| Route handler BFF | `app/api/*/route.ts` |
| Hook React Query | `lib/hooks/` |
| Config servizi/CDN/Meili | `lib/config.ts` |
| Auth | `lib/stores/auth-store.ts`, `app/api/auth/` |
| i18n runtime | `lib/i18n/` (`useTranslation`, `getMessage`, `dictionaries`) |
| Scanner carte | `hooks/useBrxScanner.ts`, `hooks/scannerEmbed.worker.ts`, `app/scanner/` |
| Ricerca | `app/api/search/`, `lib/hooks/use-search.ts`, `components/layout/GlobalSearchBar.tsx` |
| Guide deploy/setup | `docs/` |

## Trappole note

- **CSP** (`next.config.mjs`) include `unsafe-inline`/`unsafe-eval`: serve a
  framer-motion e al wasm dello scanner. Non rimuoverli senza smoke-test runtime.
- **`compiler.removeConsole`** strippa i `console.log` in produzione (tiene
  `error`/`warn`). Non affidarti a `console.log` per logica.
- **Type generati stantii**: dopo aver cancellato route, `.next/types/*` può
  riferirsi a file rimossi — pulisci `.next` o la sottocartella interessata.
- **Test bff-security**: i 2 test su GET `/api/auctions` senza cookie sono stati
  allineati al comportamento attuale del BFF (GET pubblico passa al backend;
  mutazioni POST/PATCH/DELETE restano 401). La suite ora passa.

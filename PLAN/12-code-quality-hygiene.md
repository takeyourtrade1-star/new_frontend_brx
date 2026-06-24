# Piano 12 — Code Quality & Hygiene

**Obiettivo:** Pulizia generale, type safety, rimozione debito.

---

## 12.1 Tipizzare `as any`

**File:**

- `components/feature/LandingWelcome.tsx:27`
- `components/layout/GlobalSearchBar.tsx:107`
- `lib/errors/auth-error-codes.ts:291-380`
- `components/ui/AuthErrorAlert.tsx:160`
- `lib/mock-cards.ts:260`

Tipizzare correttamente.

---

## 12.2 Rimuovere `eslint-disable react-hooks/exhaustive-deps` non giustificati

**File:** `OggettiContent.tsx:135-151, 172-192`, `SellSingleWizard.tsx:305`

O aggiungere commento esplicito o correggere la dipendenza.

---

## 12.3 Validazione Zod split

**File:** `lib/validations/auth.ts:168`

Splittare in `validations/auth/{login,registration,mfa,password-reset}.ts`.

---

## 12.4 Lista path "anonymous" hardcoded

**File:** `lib/api/auth-client.ts:140-155`

Estrarre in:

```ts
const ANONYMOUS_AUTH_PATHS = new Set([...]);
```

---

## 12.5 Rimuovere mock store da produzione

**File:** `lib/stores/mock-purchase-store.ts`, `lib/stores/mock-support-store.ts`

Feature flag dev-only o tree-shaking con `process.env.NODE_ENV === 'development'`.

---

## 12.6 Cache-Control mancanti

**File:** `app/api/products/[id]/route.ts`, `app/api/reprints/route.ts`

Aggiungere `public, max-age=60, swr=300` (catalogo pubblico).

---

## 12.7 `meilisearch-server-env.ts` fallback

**File:** `lib/meilisearch-server-env.ts`

Rimuovere `NEXT_PUBLIC_MEILISEARCH_URL` da `getMeilisearchServerConfig` (server-only env).

---

## 12.8 `BRX_MATCH_API_URL` fallback hardcoded IP

**File:** `next.config.mjs:110`

`BRX_MATCH_API_URL || 'http://15.160.8.178:8005'` ha IP hardcoded come fallback. Aggiungere warning in CI se mancante.

---

## 12.9 Aggiungere test mancanti `bff-security`

**File:** `__tests__/lib/bff-security.test.ts`

I 2 test che falliscono secondo CLAUDE.md vanno risolti. Verificare se policy `GET aste senza cookie → 401 vs pubbliche` è stata decisa.

---

## 12.10 Aggiungere `<noscript>` fallback

**File:** `app/scanner/page.tsx`, `app/cart/page.tsx`

Aggiungere `<noscript><p>Richiede JavaScript</p></noscript>` per crawler e utenti no-JS.

---

## 12.11 Aggiungere error boundaries specifici

**File:** `app/scambi/error.tsx`, `app/scanner/error.tsx`, `app/ordini/error.tsx`, `app/vendi/error.tsx` (nuovi)

Creare error boundary localizzato per ciascuna sezione.

---

## 12.12 Aggiungere `loading.tsx` espliciti

**File:** `app/aste/[id]/loading.tsx`, `app/products/[slug]/loading.tsx` (nuovi)

Skeleton specifico per pagine dettaglio (oggi skeleton inline nei componenti).

---

## Criteri di accettazione

- `npm run deadcode` (knip) mostra 0 file non utilizzati
- `npm run lint` e `npm run typecheck` restano a 0 errori
- Tutti i route handler pubblici hanno `Cache-Control` appropriato
- Ogni sezione principale (`scambi`, `scanner`, `ordini`, `vendi`) ha il proprio `error.tsx`

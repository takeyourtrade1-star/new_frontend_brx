# Piano 8 — Test & Quality Assurance

**Obiettivo:** Aggiungere copertura su flussi critici, regression risk, smoke test.

---

## 8.1 Test su Auth flow

**File:** `__tests__/lib/auth-store.test.ts` (nuovo)

Copertura:

- Login email/username valido
- Login con MFA abilitato → redirect `/login/verify-mfa`
- OTP MFA scaduto → errore
- Logout pulisce store
- Recupero password 4 step
- `preAuthToken` persistenza
- `flashMessage` + `isAuthenticated` race
- Token refresh proattivo

---

## 8.2 Test su `AsteDetailView`

**File:** `__tests__/components/AsteDetailView.test.tsx` (nuovo)

Copertura:

- Render con asta valida
- Login gate se non autenticato e click "Fai offerta"
- Offerta valida → "Stai vincendo"
- Offerta bassa → errore
- WebSocket update → "Sei stato superato"
- Calendario `.ics` download
- Proxy bidding flow

---

## 8.3 Test su `ProductDetailView`

**File:** `__tests__/components/ProductDetailView.test.tsx` (nuovo)

Copertura:

- Render con prodotto valido
- 5 tab funzionanti
- `handleOwnerQtyDelta` (verificare no duplicazione con OggettiContent)
- Lightbox foto

---

## 8.4 Test su `OggettiContent`

**File:** `__tests__/components/OggettiContent.test.tsx` (nuovo)

Copertura:

- Inventory load + filtri
- Bulk delete
- Bulk price wizard
- Sync marketplace
- Export CSV

---

## 8.5 Test su `SellSingleWizard`

**File:** `__tests__/components/SellSingleWizard.test.tsx` (nuovo)

Copertura:

- 4 step wizard
- Photo upload (mock XHR)
- QR pairing
- Validazione price
- Publish confirm

---

## 8.6 Estendere BFF security test

**File:** `__tests__/lib/bff-security.test.ts` (estendere)

Copertura aggiuntiva:

- `/api/sync` rate limit
- `/api/auctions` guest QR (3 casi validi + 5 invalidi)
- Bridge auth
- CSRF token validation
- Body size limit 413

---

## 8.7 Test i18n keys parity

**File:** `__tests__/i18n/keys-parity.test.ts` (nuovo)

Copertura: tutti e 6 i file `lib/i18n/messages/{en,it,de,fr,es,pt}.ts` abbiano stesse chiavi (script esistente lo fa, ma non è un test).

---

## 8.8 Test dispute WS reconnect

**File:** `__tests__/flow/dispute-ws.test.ts` (nuovo)

Copertura:

- 5 reconnect con delay 3s
- Fallback polling 8s
- Dedup messaggi
- Reset su `dataUpdatedAt`

---

## 8.9 Rimuovere commento residuo BFF

**File:** `app/api/auth/[...path]/route.ts:226`

Rimuovere `// <--- MANCAVA QUESTA PARENTESI...`.

---

## 8.10 Sostituire `as any` con tipi espliciti

**File:**

- `components/feature/LandingWelcome.tsx:27`
- `components/layout/GlobalSearchBar.tsx:107`
- `lib/errors/auth-error-codes.ts:291-380`
- `components/ui/AuthErrorAlert.tsx:160`
- `lib/mock-cards.ts:260`

Tipizzare correttamente.

---

## Criteri di accettazione

- `npm run test` passa
- `npm run test:coverage` mostra copertura >60% su `lib/stores/`, `lib/hooks/`, `lib/api/`
- Nessun `as any` residuo (verificato con `grep -r "as any" components/ lib/`)
- I 2 test BFF-security che falliscono (CLAUDE.md) sono risolti

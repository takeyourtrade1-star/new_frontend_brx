# Piano 10 — Bug Fix Specifici Identificati

**Obiettivo:** Risolvere bug reali trovati durante l'audit.

---

## 10.1 `useBrxScanner` framesSent Turbo

**File:** `hooks/useBrxScanner.ts:194-198, 766`

`framesSent` non incrementato in modalità Turbo. Fixare contatore o rimuovere campo.

---

## 10.2 `useBrxScanner` torch debounce

**File:** `hooks/useBrxScanner.ts:765-781`

Aggiungere debounce su `toggleTorch` per evitare race con `applyConstraints` async.

---

## 10.3 `useBrxScanner` ort.env globals

**File:** `hooks/useBrxScanner.ts:281-282`

Proteggere con singleton/once pattern per evitare race se multiple istanze del hook montano.

---

## 10.4 `AuctionCreateWizard` pairing revoke on fail

**File:** `components/feature/aste/create/AuctionCreateWizard.tsx:443`

Wrappare `createAuctionMutation.mutateAsync` in try/finally con `pairing.revokeOnPublish()` anche su fail.

---

## 10.5 `AuctionCreateWizard` `sel.title` validation

**File:** `components/feature/aste/create/AuctionCreateWizard.tsx:239-269`

Aggiungere check difensivo su `sel.title` non vuoto.

---

## 10.6 `AsteDetailView` proxyBid race condition

**File:** `components/feature/aste/AsteDetailView.tsx:294-295`

`proxyBidIsWinning`/`proxyBidOutbid` calcolati con stato locale che può divergere da WS. Usare `effectiveCurrentBidEur` come fonte unica.

---

## 10.7 `AuctionBidModal` cleanup su navigazione

**File:** `components/feature/aste/AuctionBidModal.tsx:188-201`

Reset `confirmAction` su cleanup useEffect.

---

## 10.8 `ProfiloContent` `window.prompt`

**File:** `components/feature/account/ProfiloContent.tsx:67-71`

Sostituire con modal inline con `<input>`. Implementare API reale per cambio nome (anche se mock, almeno non `window.prompt`).

---

## 10.9 `ProfiloContent` data registrazione

**File:** `components/feature/account/ProfiloContent.tsx:92`

`value="28.01.2026"` hardcoded → leggere da `user.createdAt` (anche se mock, dinamico).

---

## 10.10 `AcquistiContent` mock shipping hydration

**File:** `components/feature/acquisti/AcquistiContent.tsx:196-222`

`Date.now() - 5*86400000` può causare hydration mismatch. Usare data fissa mock o `useEffect` per generare lato client.

---

## 10.11 `AcquistiContent` `handleConfirmMockPayment` doppio click

**File:** `components/feature/acquisti/AcquistiContent.tsx:397-403`

Aggiungere guard `if (isProcessing) return` per evitare doppio pagamento.

---

## 10.12 `DisputeDetailContent` missing message window

**File:** `components/feature/dispute/DisputeDetailContent.tsx:101-105`

`useEffect` reset `wsMessages` su `dataUpdatedAt` può perdere messaggi WS arrivati dopo l'ultimo fetch. Merge invece di reset.

---

## 10.13 `OrderCard` `relativeTime` mesi/anni

**File:** `components/feature/acquisti/OrderCard.tsx:46-54`

Aggiungere gestione mesi/anni (es. "3 mesi fa", "2 anni fa").

---

## 10.14 `useClickOutside` per menu TopBar

**File:** `components/layout/TopBar.tsx:147-190`

4 `useEffect` copy-pasted identici per account/acquisti/vendi/games menu. Estrarre `useClickOutside(ref, onClose)`.

---

## 10.15 `useBrxScanner` leak su unmount

**File:** `hooks/useBrxScanner.ts` (verificare tutti i useEffect)

Verificare cleanup esplicito su tutti i listener, timer, observer, stream.

---

## Criteri di accettazione

- Tutti i bug elencati hanno un test di regressione in `__tests__/`
- `npm run test` passa
- Code review conferma assenza di memory leak in scanner, auction, dispute
- `npm run lint` e `npm run typecheck` restano a 0 errori

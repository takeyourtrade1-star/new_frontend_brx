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

---

## Diario esecuzione — 2026-06-29

`npm run typecheck` ✅, `npm run lint` ✅ (solo warning pre-esistenti, 0 errori),
`npm run i18n:keys` ✅ (2150 chiavi × 6 locali). Nessun test di regressione
scritto in questa passata (vedi nota su 10.6 e Piano 8 per la copertura test).

**Eseguiti:**

- **10.1** — `framesSent` ora incrementato anche nel path Turbo/ONNX
  (`hooks/scanner/useScanLoop.ts`, `sendFrameOnnx`); prima restava a 0 perché
  solo il path legacy lo aggiornava. Lo scanner è stato spezzato (Piano 01),
  quindi i riferimenti di riga del piano (194-198, 766) erano stantii.
- **10.2** — debounce su `toggleTorch` via `torchBusyRef`
  (`components/feature/scanner/ScannerModal.tsx`). `toggleTorch`/`applyTorch`
  vivono ora in ScannerModal, non più in `useBrxScanner`.
- **10.3** — `ort.env.wasm.*` configurato una sola volta tramite flag a livello
  di modulo `ortEnvConfigured` (`hooks/scanner/useOnnxSession.ts`), evita race
  fra istanze multiple del hook.
- **10.4** — `pairing.revokeOnPublish()` spostato in `finally`
  (`components/feature/aste/create/AuctionCreateWizard.tsx`): viene revocato sia
  in caso di successo sia di fallimento. (SellSingleWizard ha lo stesso pattern
  ma NON è citato dal piano → lasciato invariato.)
- **10.5** — check difensivo su `sel.title` (trim + fallback stringa) in
  `handleCardSelect` (`AuctionCreateWizard.tsx`).
- **10.7** — reset di `confirmAction` su chiusura/cleanup dell'effetto in
  `components/feature/aste/AuctionBidModal.tsx`.
- **10.8** — `window.prompt` sostituito da modal inline con `<input>` (Esc/Enter,
  click-outside, validazione non-vuoto) in
  `components/feature/account/ProfiloContent.tsx`. Aggiunta chiave i18n
  `common.save` a tutti e 6 i locali.
- **10.9** — data registrazione dinamica da `user.created_at` (helper
  `formatRegDate`) invece dell'hardcoded `28.01.2026`; la riga è ora non-editabile.
- **10.11** — guard `if (... || mockPaying) return` in `handleConfirmMockPayment`
  (`components/feature/acquisti/AcquistiContent.tsx`).
- **10.12** — il reset di `wsMessages` su `dataUpdatedAt` ora fa *prune* dei soli
  messaggi già presenti nel server (non più clear totale), evitando di perdere
  messaggi WS arrivati dopo lo snapshot del fetch
  (`components/feature/dispute/DisputeDetailContent.tsx`).
- **10.13** — `relativeTime` gestisce mesi/anni (con singolare/plurale corretto)
  in `components/feature/acquisti/OrderCard.tsx`.

**Già fatti (saltati):**

- **10.10** — già risolto: `Date.now()` per gli ordini mock spostato in
  `useEffect` (`AcquistiContent.tsx:195-222`).
- **10.14** — già fatto: `useClickOutside(ref, onClose, open)` estratto e usato
  per tutti i menu della TopBar (commento `FE-REV-005`).
- **10.15** — già coperto: `useBrxScanner` ferma loop+stream su unmount
  (`useEffect(() => () => stopScanning(), [stopScanning])`), `useOnnxSession`
  termina il worker, `ScannerModal` chiama `stopScanning` su unmount.

**Non eseguito (documentato):**

- **10.6** — l'attuale `AsteDetailView` calcola già `proxyBidIsWinning`/
  `proxyBidOutbid` su `effectiveCurrentBidEur` (= `detail.currentBidEur`, fonte
  WS) e `isWinning` (da `detail.highestBidderId`): la fonte è già quella unica
  richiesta dal piano. Nessuna divergenza da stato locale residua → lasciato
  invariato.

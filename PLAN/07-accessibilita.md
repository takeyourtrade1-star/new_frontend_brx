# Piano 7 — Accessibilità

**Obiettivo:** Focus trap, label, touch target, ARIA corretto.

> 🔎 **Review piano vs codebase (2026-06-24).** Il piano è risultato **molto
> stantio**: gran parte degli interventi è **già implementata** nel codebase.
> Path verificati, righe spesso non più valide. Eseguite **solo le parti sicure,
> additive e verificabili** (skip link 7.8 + focus-visible su SearchBar/MainSearch
> di 7.9). typecheck a 0 errori, lint a 0 errori (restano solo warning preesistenti
> non correlati). Dettaglio per sezione sotto.
>
> **Già fatto nel codebase (nessuna azione):**
> - **7.2** — `AuctionTimerCardMobile/Desktop` (`aria-label="Apri menu calendario"`),
>   `Pagination` (prev/next con `aria-label`), `ImageLightbox` (`role="dialog"` +
>   bottoni etichettati) sono **tutti già a posto**. Path nel piano sbagliati
>   (`AuctionTimerCard*` stanno in `components/feature/aste/detail/`, non in root).
> - **7.9 (TopBar)** — `TopBar.tsx` usa **già** `focus-visible:ring-2` ovunque;
>   non c'è alcun `focus:ring-0` da rimuovere. Il claim `TopBar.tsx:50` è stale.
> - **7.8 (target)** — `id="main-content"` **esiste già** in `app/layout.tsx`.
> - **8.x lang** — `<html lang="it">` già corretto.
>
> **Note di accuratezza (path/righe da correggere):**
> - **7.4** — `ProductDetailView.tsx:854` **non esiste più** (nessun `role="button"`
>   in quel file). Reale solo `SearchResultsTable.tsx:106,225`.
> - **7.5** — `Pagination` usa `h-9 w-9` (36px < 44px): il claim touch-target è
>   reale, ma è un cambio visivo/layout su componente condiviso → da verificare.
> - **7.7** — non esiste guardia `prefers-reduced-motion` globale; in `globals.css`
>   è coperta solo su 2 animazioni puntuali. La soluzione del piano (HOC framer-motion
>   su 15+ file) è un refactor ampio, non minimale.

---

## 7.1 `useFocusTrap` hook

**File:** `hooks/useFocusTrap.ts` (nuovo)

Implementare focus trap con ripristino focus al trigger dopo chiusura.

Applicare in 15+ modali:

- `ImageLightbox`
- `AuctionBidPanel`
- `AuctionBidModal`
- `CardImageCameraPeek`
- `AuctionCreatePhoneQrModal`
- `ScannerModal`
- `LoginGateModal`
- `BulkPriceModal`
- `BulkDeleteModal`
- `MarketplaceListingEditModal`
- `InventoryEditModal`
- `ProxyLimitModal`
- `PaymentConfirmModal`
- `MockPaymentFormModal`
- `SupportRequestModal`

> 🟢 **FATTO — hook + 2 adozioni di riferimento (2026-06-24).** Creato
> `hooks/useFocusTrap.ts` (memorizza il focus di partenza → focus sul primo
> elemento → Tab/Shift+Tab ciclici dentro il container → ripristino focus al
> trigger in cleanup). Adottato in:
> - `ImageLightbox` (già `role=dialog`/ESC/frecce) → `ref={trapRef}` sul dialog.
> - `ProxyLimitModal` → reso dialog accessibile completo: aggiunto `'use client'`
>   (parent `AsteDetailView` già client), `role="dialog"`/`aria-modal`/`aria-label`
>   + focus trap (prima non aveva alcuna semantica dialog).
>
> ⚠️ **Resto incrementale (NON applicato a tappeto):** gli altri ~13 modali hanno
> strutture diverse (alcuni gestiscono già il focus, altri sono server-compatible).
> Adottare l'hook ovunque alla cieca, senza verifica runtime, è proprio l'anti-pattern
> che i piani precedenti evitano → si fa modale per modale. Build di produzione
> (87 pagine) + typecheck + lint a 0 errori.

---

## 7.2 Aggiungere `aria-label` su bottoni icona-only

**File:** `AuctionTimerCardMobile.tsx:87`, `AuctionTimerCardDesktop.tsx:70`, `Pagination.tsx`, `ImageLightbox.tsx`

Aggiungere `aria-label="Apri menu"`, `aria-label="Pagina precedente"`, ecc.

> ✅ **GIÀ FATTO (verificato 2026-06-24).** Tutti i bottoni icona-only citati hanno
> già un `aria-label`: `AuctionTimerCardMobile/Desktop` ("Apri menu calendario"),
> `Pagination` (prev/next), `ImageLightbox` ("Chiudi"/"Foto precedente"/"successiva").
> Nessuna azione necessaria.

---

## 7.3 Sostituire placeholder con label

**File:** `AuctionBidModal.tsx:362`, `AuctionBidPanel.tsx:471`, `ProxyLimitModal.tsx:50`, `AuctionCreatePriceStep.tsx:59,81`

Aggiungere `<label htmlFor>` visivamente nascosto o visibile, usare `placeholder` solo come hint.

> 🟢 **FATTO (2026-06-24) — solo dove serviva.** `ProxyLimitModal` e
> `AuctionCreatePriceStep` (entrambi gli input `ac-res`/`ac-buynow`) avevano **già**
> `<label htmlFor>` collegati → nessuna azione. Collegate le 2 label esistenti ma
> non associate: `AuctionBidModal` (`htmlFor/id="bid-modal-input"`) e `AuctionBidPanel`
> (`htmlFor/id="bid-panel-input"`). I `placeholder` restano come hint. typecheck + lint ok.

---

## 7.4 Convertire `<div role="button">` a `<button>`

**File:** `ProductDetailView.tsx:854`, `SearchResultsTable.tsx:106,225`

Convertire a `<button type="button" className="...">` con classi adattate.

> 🟡 **FATTO con approccio corretto — la conversione del piano è inapplicabile
> (2026-06-24).** `ProductDetailView.tsx:854` non esiste più. I 2 target reali in
> `SearchResultsTable.tsx` **non sono convertibili in `<button>`**: riga 106 è un
> `<tr role="button">` (un button non può essere una riga di tabella né contenere
> `<td>`), riga 225 è un `<div role="button">` che **contiene** `CardImageCameraPeek`
> (elementi interattivi annidati → button dentro button = HTML non valido).
> Miglioramento a11y reale applicato a entrambi: aggiunto il supporto al tasto **Spazio**
> (un `role="button"` deve attivarsi con Enter **e** Spazio; prima solo Enter) con
> `preventDefault`. typecheck + lint a 0 errori.

---

## 7.5 Touch target ≥44×44

**File:** `Pagination.tsx:40`, `ScambiProponiModal.tsx:826,1082`, `CardImageCameraPeek.tsx:29`

Aggiungere `min-h-[44px] min-w-[44px] flex items-center justify-center` con icona interna 24×24.

> 🟡 **FATTO solo dove sensato (2026-06-24).** Claim in parte errati:
> - `ScambiProponiModal:826` e `:1082` → sono i bottoni **backdrop full-screen**
>   (`absolute inset-0`), già enormi. Claim errato, nessuna azione.
> - `CardImageCameraPeek` (`h-9 w-9` = 36px) → è il trigger fotocamera dentro le
>   righe-tabella di ricerca **dense**; 36px soddisfa già WCAG 2.5.8 AA (≥24px) e
>   portarlo a 44px stravolgerebbe la densità → **lasciato** (alto rischio visivo).
> - `Pagination` (`h-9 w-9` = 36px) → controlli nav standalone: bump sicuro a
>   `h-11 w-11` (44px). **Fatto.** typecheck + lint a 0 errori.

---

## 7.6 WAI-ARIA Tab pattern completo

**File:** `AsteHubPage.tsx`, `ProductDetailMarketplaceSection.tsx`, `UserProfileTabs.tsx`, `AsteMineViewBar.tsx`

Aggiungere:

- Frecce ←/→ per navigazione
- Home/End per primo/ultimo
- `aria-selected` + focus management
- `aria-controls`/`aria-labelledby`

> 🟢 **FATTO — hook + 1 adozione di riferimento (2026-06-24).** Creato
> `hooks/useTabListKeyboard.ts` (←/→/↑/↓ con wrap, Home/End, roving tabindex, focus
> sul tab selezionato). Adottato in `UserProfileTabs` (vero pattern tab→panel):
> aggiunto roving tabindex, `onKeyDown`, `id`/`aria-controls`/`aria-labelledby` tra
> tab e `tabpanel` (+ `tabIndex={0}` sul panel). Già avevano `role="tablist"/"tab"/
> "tabpanel"` e `aria-selected`.
>
> ⚠️ **Resto incrementale:** `AsteHubPage` e `AsteMineViewBar` usano i "tab" come
> **toggle di filtro** (selezione che torna a `null`, nessun `tabpanel` associato) →
> non sono un tab/panel classico, applicare il pattern completo lì richiede una
> decisione di semantica, non un copia-incolla. `ProductDetailMarketplaceSection` da
> valutare a parte. Build (87 pagine) + typecheck + lint a 0 errori.

---

## 7.7 `useReducedMotion` in framer-motion

**File:** 15+ file con framer-motion

Wrappare in HOC:

```tsx
export const AnimatedDiv = ({ children, ...props }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      {...props}
      transition={reduce ? { duration: 0 } : props.transition}
    >
      {children}
    </motion.div>
  );
};
```

> 🟢 **FATTO con approccio migliore (2026-06-24).** Invece dell'HOC per-file su 15
> file, aggiunto un singolo `<MotionConfig reducedMotion="user">` in
> `components/providers.tsx`: **tutti** i componenti `motion.*` di framer-motion
> rispettano automaticamente `prefers-reduced-motion`, a costo zero di refactor.
> ⚠️ **Non** aggiunta una guardia CSS globale `prefers-reduced-motion`: diverse
> animazioni del repo partono da `opacity:0` con `fill forwards` (es. lo slide-up
> dello scanner) → un blanket `animation:none` le lascerebbe invisibili. Una guardia
> globale va quindi scritta selettivamente, non con `*`. Build + typecheck + lint a 0 errori.

---

## 7.8 Skip link

**File:** `app/layout.tsx`

Aggiungere prima del body:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black"
>
  Vai al contenuto principale
</a>
```

> 🟢 **FATTO (2026-06-24).** Aggiunto lo skip link in `app/layout.tsx`, prima di
> `IOSInstallPromptGate`, con testo italiano hardcoded (coerente con le altre label
> a11y del repo, tutte hardcoded in IT). Target `id="main-content"` già esistente +
> aggiunto `tabIndex={-1}` perché il focus atterri sul contenitore. Additivo, visibile
> solo al focus da tastiera. typecheck + lint a 0 errori.

---

## 7.9 Rimuovere `focus:ring-0` su input

**File:** `TopBar.tsx:50`, `SearchBar.tsx:30-36`, `MainSearch.tsx:36-126`

Sostituire con `focus-visible:ring-2 focus-visible:ring-primary/30`.

> 🟢 **FATTO (2026-06-24) — solo dove serviva.** `TopBar` usa **già** `focus-visible`
> ovunque (claim `TopBar.tsx:50` stale, nessun `focus:ring-0`). Sistemati i due
> componenti realmente sprovvisti di indicatore di focus:
> - `components/ui/SearchBar.tsx` — wrapper `focus-within:ring-2 ring-[#FF7300]/40`,
>   input `focus:outline-none`, 3 bottoni `focus-visible:ring-2 ring-[#FF7300]/40`.
> - `components/layout/MainSearch.tsx` — stesso pattern (wrapper + input + 3 bottoni).
>
> Usato il token brand `#FF7300` (il repo non ha ancora `--primary` come ring-color
> riutilizzabile; v. piano 2.4) e il pattern `focus-visible` già adottato da `TopBar`
> → coerente, visibile solo su focus da tastiera (zero cambi per il mouse). typecheck
> + lint a 0 errori.

---

## 7.10 Aggiungere `aria-live` su auto-redirect scanner

**File:** `app/scanner/page.tsx:466-485, 707-714`

Aggiungere:

- Bottone "Annulla" che cancella timer
- `aria-live="polite"` per countdown
- `aria-atomic="true"` su elementi che cambiano contenuto completo

> 🟢 **FATTO con correzione dell'approccio (2026-06-24).** Il bottone di annullamento
> esiste già ("Non è questa carta" → `onNotThisCard`). ⚠️ Il dialog aveva **già**
> `aria-live="polite"` sull'**intero** container: con il countdown che cambia ogni
> secondo, lo screen reader rileggerebbe tutto a ogni tick (spam "5s…4s…3s…",
> anti-pattern). Correzione: rimosso `aria-live` dal dialog e aggiunta una live-region
> `sr-only` (`aria-live="polite" aria-atomic="true"`) che annuncia **una sola volta**
> "Carta trovata: {nome} … premi 'Non è questa carta' per annullare". Il countdown
> resta solo visivo. typecheck + lint a 0 errori.

---

> ## ✅ Stato esecuzione (2026-06-24)
>
> **Eseguito (verificato: typecheck + lint + build a 0 errori):**
> - 7.8 — skip link "Vai al contenuto principale" in `app/layout.tsx` (+ `tabIndex={-1}`).
> - 7.9 — `focus-visible:ring` su `SearchBar.tsx` e `MainSearch.tsx` (`TopBar` era già ok).
> - 7.1 — creato `hooks/useFocusTrap.ts` + adozione in `ImageLightbox` e `ProxyLimitModal`
>   (quest'ultimo reso dialog accessibile completo). Resto dei modali: incrementale.
> - 7.3 — collegate le 2 label non associate (`AuctionBidModal`/`AuctionBidPanel`);
>   gli altri input del piano avevano già `<label htmlFor>`.
> - 7.4 — supporto tasto Spazio sui 2 `role="button"` di `SearchResultsTable`
>   (conversione a `<button>` impossibile: `<tr>` / contenuto interattivo annidato).
> - 7.5 — `Pagination` a 44px (gli altri claim erano errati o già conformi AA).
> - 7.10 — live-region `sr-only` (annuncio singolo) sullo scanner al posto dell'`aria-live`
>   sull'intero dialog (che causava spam del countdown).
>
> **Già presente (nessuna azione):** 7.2 (aria-label icona-only), TopBar di 7.9,
> target di 7.8, parte di 7.3, `<html lang>`.
>
> **Aggiunto nella 2ª sessione (2026-06-24):**
> - 7.7 — `<MotionConfig reducedMotion="user">` in `components/providers.tsx` (copre
>   tutti i 15 file framer-motion, niente HOC per-file).
> - 7.6 — `hooks/useTabListKeyboard.ts` + adozione completa in `UserProfileTabs`
>   (frecce/Home/End, roving tabindex, `aria-controls`/`aria-labelledby`).
>
> **Rimandato (refactor ampio/comportamentale, da staged + runtime):**
> - 7.1 (resto) — adozione `useFocusTrap` sugli altri ~13 modali, uno alla volta.
> - 7.6 (resto) — `AsteHubPage`/`AsteMineViewBar` sono toggle-filtro (no tabpanel),
>   `ProductDetailMarketplaceSection` da valutare a parte.
> - 7.7 (resto) — guardia CSS `prefers-reduced-motion` selettiva in `globals.css`
>   (non globale `*`, per non rompere le animazioni con `opacity:0` + fill forwards).
>
> ---
>
> > ℹ️ **Fix collaterale i18n (non parte del piano 07).** Il working tree recuperato
> > conteneva `en.ts` + `ScambiVideoIntro.tsx` modificati con una nuova chiave
> > `scambi.intro.skip` presente **solo** in `en` → typecheck rotto. Aggiunta la
> > chiave agli altri 5 locale (it/de/es/fr/pt). `npm run i18n:keys` → 2088×6 OK.

## Criteri di accettazione

- Audit axe-core (o Lighthouse a11y) >= 95 su tutte le pagine principali
- Tab attraverso `/aste/[id]`, `/products/[slug]`, `/account/profilo` raggiunge tutti gli elementi interattivi
- Screen reader (NVDA/VoiceOver) legge correttamente modali, toast, e countdown
- Tutti i touch target ≥ 44×44 px su mobile

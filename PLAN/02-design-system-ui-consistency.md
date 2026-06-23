# Piano 2 — Design System & UI Consistency

**Obiettivo:** Consolidare il design system, eliminare duplicazioni, standardizzare pattern.

> 🔎 **Review piano vs codebase (2026-06-23).** Il file era stato eliminato dal
> working tree (recuperato dallo stash). I path del piano usano CamelCase ma i file
> reali sono kebab-case (`orange-button.tsx`, `button-orange.tsx`, `button.tsx`).
> Eseguite **solo le parti sicure e verificabili** (dead-code deletion di 2.1).
> Le sezioni 2.2/2.4/2.5/2.6/2.7/2.8 sono **rimandate**: non sono refactor minimali
> ma interventi ampi e comportamentali (aggiunta di ~9 componenti + refactor a
> tappeto, ~1100+ hex da sostituire, riordino z-index, scroll-lock di 10+ modali,
> cambio visivo background, rimozione `'use client'` da 30+ file) che vanno
> staged e verificati a runtime, non applicati alla cieca. Dettaglio per sezione
> sotto. typecheck + lint a 0 errori dopo le delete.

---

## 2.1 Unificare componenti duplicati

### OrangeButton / ButtonOrange

**File:** `components/ui/OrangeButton.tsx` + `components/ui/ButtonOrange.tsx`

Mantenere solo `ButtonOrange` con `asChild`, rimuovere `OrangeButton.tsx`.

**Verifica:** `grep -r "OrangeButton" components/ app/` deve restituire 0 match.

### Floating label (3 varianti)

**File:** `components/ui/floating-label-input.tsx` + `floating-label-field.tsx` + `floating-input.tsx`

Mantenere solo `floating-label-field`, rimuovere le altre 2.

### OTP input (2 varianti)

**File:** `components/ui/input-otp.tsx` + `otp-six-boxes.tsx`

Mantenere solo `input-otp` (Radix), rimuovere `otp-six-boxes`.

> ✅ **FATTO — solo le delete sicure (2026-06-23).** Verifica usi reali:
> - `OrangeButton` (`orange-button.tsx`): **0 usi** → **rimosso**. (`ButtonOrange`
>   in `button-orange.tsx` ha `asChild`/`Slot` ed è il canonico per il piano, ma
>   anch'esso ha **0 usi** oggi: lasciato com'è, non cancellato.)
> - Floating label: `floating-label-field` usato in 5 form (`registrati/*`) → tenuto;
>   `floating-label-input` e `floating-input` hanno **0 usi** → **rimossi entrambi**.
> - OTP: `input-otp` usato in 1 file (`auth/auth-code-input`), `otp-six-boxes` usato
>   in **2** flussi auth sensibili (`login/verify-mfa`, `recupera-credenziali-form`).
>   **NON rimosso:** non è una delete ma una migrazione di API/markup su flussi MFA
>   → va fatta con verifica runtime, fuori dallo scope "minimale/sicuro".
>
> Risultato: 3 file morti eliminati (`orange-button`, `floating-label-input`,
> `floating-input`). typecheck + lint a 0 errori.

---

## 2.2 Introdurre componenti shadcn mancanti

> 🟡 **IN CORSO — un componente alla volta.** I 9 componenti non esistono
> (confermato). ⚠️ **Vincolo dipendenze:** è installato solo `@radix-ui/react-slot`;
> mancano `react-dialog/select/tabs/dropdown-menu` e `sonner` → **4 componenti su 9
> (dialog/select/tabs/dropdown-menu) + toast richiedono nuove dipendenze** (decisione
> da prendere, non aggiunte unilateralmente). I dep-free (`skeleton`, `empty-state`,
> `table`) si possono fare subito.
>
> 🟢 **`skeleton.tsx` FATTO (2026-06-23).** Creato `components/ui/skeleton.tsx`
> (primitivo shadcn: `animate-pulse rounded-md bg-muted`, override via `className`,
> niente `'use client'`). ⚠️ Il piano diceva "4 implementazioni": in realtà
> `animate-pulse` compare in **18 file** (e non tutte sono skeleton — es. un badge
> "featured" pulsa). Migrazione **incrementale**: fatto `AuthSkeleton.tsx` (8 blocchi)
> come pattern di riferimento, look invariato (tailwind-merge risolve gli override).
> Gli altri file adottano `Skeleton` man mano. typecheck + lint a 0 errori.
>
> 🟢 **`empty-state.tsx` FATTO (2026-06-23).** Creato `components/ui/empty-state.tsx`
> (`EmptyState`: icona soft in cerchio + titolo/descrizione/azione, default
> sovrascrivibili, server-compatible). Default allineati a `OrdersEmptyState`, che è
> stato **reimplementato sopra `EmptyState`** mantenendo identico look e API
> (icona/messaggio/cta). `CartEmptyState` (forma diversa + i18n) potrà adottarlo dopo.
> typecheck + lint a 0 errori.
>
> ▶️ **Prossimi (decisione dipendenze):** `table` (dep-free, ma migrare
> `OggettiTable`/`SearchResultsTable`/`ModernSellerTable` è grosso); `dialog/select/
> tabs/dropdown-menu` (richiedono `@radix-ui/*`); `toast` (richiede `sonner`). Da
> fare come lavori dedicati, staged e verificati a runtime.

Aggiungere in `components/ui/`:

- `dialog.tsx` (Radix Dialog) — focus trap, ESC, scroll lock
- `select.tsx` (Radix Select) — sostituire 5+ implementazioni custom
- `tabs.tsx` (Radix Tabs) — refactor `ProductDetail*Tab`, `AccountContent`
- `dropdown-menu.tsx` (Radix) — sostituire dropdown custom in TopBar
- `toast.tsx` o installare `sonner` — centralizzare toast (oggi 4 implementazioni)
- `table.tsx` — refactor `OggettiTable`, `SearchResultsTable`, `ModernSellerTable`
- `form.tsx` + `field.tsx` — pattern shadcn per tutti i form
- `skeleton.tsx` — sostituire 4 implementazioni custom
- `empty-state.tsx` — refactor `OrdersEmptyState`, `AsteMyListingsPage`

---

## 2.3 Standardizzare bottoni

**File:** `components/ui/Button.tsx`

Azioni:

- Aggiungere prop `loading` con `<Loader2 aria-hidden />` + `aria-busy`
- Convertire `primary` da hex `#FF7300` a HSL `hsl(var(--primary))` in `tailwind.config.ts`
- Aggiungere variante `variant="orange"` per CTA brand
- Rimuovere `btn-orange-glow` animazione infinita, run on hover + `prefers-reduced-motion`

> 🟡 **PARZIALMENTE RIMANDATO.** File reale: `components/ui/button.tsx` (kebab-case),
> usa già `cva` + `bg-primary`. La prop `loading` è additiva e sicura, ma le altre
> azioni sono legate alla migrazione colori (2.4) e alla rimozione di `btn-orange-glow`
> (animazione condivisa da `button-orange`): cambi visivi/comportamentali da verificare
> a runtime. Da fare insieme a 2.4, non isolato.

---

## 2.4 Mappare colori brand in token HSL

**File:** `tailwind.config.ts`, `app/globals.css`

Aggiungere CSS vars in `:root`:

```css
--brand-orange: 22 100% 50%;
--brand-deep: 222 49% 28%;
--brand-blue: 220 49% 51%;
--ink: 222 47% 11%;
```

Aggiungere in `tailwind.config.ts`:

```ts
colors: {
  'brand-orange': {
    DEFAULT: 'hsl(var(--brand-orange))',
    dark: 'hsl(22 100% 40%)',
    light: 'hsl(22 100% 60%)',
  },
  'brand-deep': 'hsl(var(--brand-deep))',
  'brand-blue': 'hsl(var(--brand-blue))',
  'ink': 'hsl(var(--ink))',
}
```

Find/replace `bg-[#FF7300]` → `bg-brand-orange`, `text-[#1D3160]` → `text-brand-deep`, ecc.

**Target:** Eliminare 471+ hex hardcoded.

> 🛑 **RIMANDATO.** Stima del piano molto sottodimensionata: nei `.tsx` ci sono
> **~819** `#FF7300`, **~327** `#1D3160`, ~22 `#0F172A` (≈2000 hex totali a 6 cifre),
> non 471. Definire i token in `tailwind.config.ts` è sicuro e additivo, ma il
> find/replace di ~1100+ occorrenze è ad alto rischio (sfumature, opacità tipo
> `#FF7300]/90`, gradient, shadow) e va fatto in batch verificati visivamente — non
> in un colpo solo.
> ⚠️ **Inoltre i token del piano sono imprecisi:** il repo ha già token equivalenti
> (`primary` = `#FF7300`, `header-bg` = `#0F172A`, `global-bg-end` = `#1D3160`). Gli
> HSL proposti (es. `--brand-deep: 222 49% 28%`) **non coincidono** con gli hex esistenti
> → introdurli creerebbe drift di colore e duplicati. Quando si farà 2.4, definire i
> token sui **valori esatti già in uso**, non sugli HSL approssimati. **Non eseguito.**

---

## 2.5 Definire scala z-index tokenizzata

**File:** `tailwind.config.ts`

```ts
zIndex: {
  'base': '0',
  'dropdown': '100',
  'sticky': '200',
  'modal-backdrop': '240',
  'modal': '300',
  'toast': '400',
  'tooltip': '500',
  'devtools': '9999',
}
```

Sostituire tutti gli `z-[60]`, `z-[200]`, `z-[8000]`, `z-[10050]` arbitrari con token.

> 🟢 **PASSO ADDITIVO FATTO (2026-06-23).** Aggiunta la scala `zIndex` in
> `tailwind.config.ts` (`base/dropdown/sticky/modal-backdrop/modal/toast/tooltip/
> devtools`), additiva: i default Tailwind restano. **Nessun uso ancora migrato.**
> Confermati ~35 valori `z-[N]` distinti molto dispersi (`z-[1]`…`z-[10050]`): il
> rimappaggio cambia l'ordine di stacking → **RIMANDATO**, va fatto con una mappatura
> valore→token concordata e verificata a runtime (modali/dropdown/toast).

---

## 2.6 Centralizzare body scroll lock

Estrarre `hooks/useBodyScrollLock.ts` con counter (se 2 modali aperti, sblocca solo quando entrambi chiusi).

Refactor tutti i 10+ modali che fanno `document.body.style.overflow = 'hidden'` inline.

> 🛑 **RIMANDATO.** Creare l'hook con counter è utile, ma serve adottarlo in 10+
> modali (altrimenti è dead code): refactor comportamentale del lock scroll, da
> verificare a runtime (modali sovrapposti). Da fare insieme alla migrazione modali
> di 2.2, non isolato.

---

## 2.7 Rimuovere `background-attachment: fixed`

**File:** `app/globals.css:91,101,111`

Rimuovere `background-attachment: fixed` (bug iOS Safari), usare `<div fixed inset-0 -z-10>` in `app/layout.tsx`.

> 🟡 **RIMANDATO (cambio visivo).** Confermato: 3 occorrenze in `app/globals.css`
> (righe 91, 101, 111). Intervento piccolo e mirato, ma cambia il rendering dello
> sfondo su tutte le pagine → richiede smoke-test visivo (desktop + iOS) prima di
> chiudere. Eseguibile in autonomia se accetti la verifica runtime.

---

## 2.8 Rimuovere `'use client'` da componenti presentazionali

**File:** 30+ file (lista completa in appendice B del report)

Rimuovere `'use client'` da: `AuthCard`, `AuthSubmitButton`, `AuthSecondaryButton`, `AuthFooterLinks`, `AuthPageHeader`, `AuthStepIndicator`, `AuthField`, `AuthBackLink`, `AuthSplitHeader`, `AssoHintBubble`, `BuildInfoBadge`, `CardMascotteStyles`, `WardrobePanel`, `BugReportModal`, `AssoChatModal`, `CardMascotteOverlays`, `CardMascotteWidget`, `CategoriesGrid`, `EbartexProductsSection`, `GameHomeLayout`, `GridCardTitle`, `ResponsiveGrid`, `MarketplaceOrderCard`, `MockShippingOrderCard`, `SupportTicketCard`, `AsteMineViewBar`, `PhotoPairingInlinePanel`, `AuctionCreateStepPanel`, `OrderItemCard`, `cart-summary`.

> 🟢 **BATCH 1 FATTO (2026-06-23) — 11 file puri, gated da `npm run build`.**
> Rimosso `'use client'` da componenti puramente presentazionali (props → JSX):
> `AuthCard`, `AuthFooterLinks`, `AuthPageHeader`, `AuthStepIndicator`,
> `AuthSplitHeader`, `CardMascotteStyles`, `GridCardTitle`, `CategoriesGrid`,
> `GameHomeLayout`, `MarketplaceOrderCard`, `SupportTicketCard`.
> Build di produzione + lint a 0 errori.
>
> ⚠️ **Esclusi (NON puri, resterebbero/devono restare client):**
> - `BuildInfoBadge` → usa `useQuery`.
> - `ResponsiveGrid` → usa styled-jsx (`<style jsx>`, non valido in RSC).
> - `AuthField` → `forwardRef` (ref non supportate in RSC).
> - `AuthSubmitButton`/`AuthSecondaryButton` → spread di props handler su `<button>`.
> - `AuthBackLink`/`AssoHintBubble`/`MockShippingOrderCard`/`OrderItemCard` → `onClick`.
>
> 🟢 **BATCH 2 FATTO (2026-06-23) — 2 file puri, gated da `npm run build`.**
> Rimosso `'use client'` da `EbartexProductsSection` (gemello di `CategoriesGrid`)
> e `CardMascotteOverlays` (overlay puramente presentazionali, props → JSX).
> Build di produzione (87 pagine) a 0 errori.
>
> ⚠️ **Restano client per necessità (lista del piano sovradimensionata):**
> - `cart-summary` → usa `useCartStore` (Zustand).
> - `WardrobePanel`/`BugReportModal`/`AssoChatModal`/`CardMascotteWidget`/
>   `AsteMineViewBar`/`PhotoPairingInlinePanel` → `onClick`/`onChange`/`window`.
> - `AuctionCreateStepPanel` → switch puro, ma vive dentro il wizard interattivo
>   (riceve ref/handler): convertirlo sarebbe no-op senza guadagno → lasciato.
>
> Nota: per i componenti già usati sotto un boundary client la rimozione è neutra
> (restano nel bundle client); il guadagno reale è solo dove il genitore è un Server
> Component. Resta comunque igiene corretta e voluta dal piano.

---

> ## ✅ Stato esecuzione (2026-06-23)
>
> **Eseguito (sicuro, verificato):**
> - 2.1 — rimossi 3 componenti morti (`orange-button.tsx`,
>   `floating-label-input.tsx`, `floating-input.tsx`).
> - 2.5 (parziale) — aggiunta la scala `zIndex` additiva in `tailwind.config.ts`
>   (nessun uso ancora migrato).
> - 2.8 (batch 1+2) — rimosso `'use client'` da 13 componenti puramente
>   presentazionali (verifica `npm run build`). Il resto della lista del piano
>   resta client per necessità (store/handler/window/ref).
>
> typecheck + lint + build a 0 errori.
>
> **Rimandato (non minimale/comportamentale, da staged + runtime):** OTP di 2.1,
> 2.2, 2.3, 2.4, migrazione usi 2.5, 2.6, 2.7. La sez. 2.8 è di fatto chiusa per
> i componenti convertibili. Vedi note per sezione.

---

## Criteri di accettazione

- `npm run lint` e `npm run typecheck` restano a 0 errori
- `grep -r "focus:ring-0\|focus:outline-none" components/ui/` limitato ai casi giustificati
- Nessun hex `#FF7300`/`#1D3160`/`#0F172A` in `className` (eccetto `globals.css`)
- Nessun `z-[NNN]` arbitrario sopra 100 (solo token)

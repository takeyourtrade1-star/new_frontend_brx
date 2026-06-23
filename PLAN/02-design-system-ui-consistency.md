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

> 🛑 **RIMANDATO.** I 9 componenti (`dialog/select/tabs/dropdown-menu/toast/table/
> form/field/skeleton/empty-state`) **non esistono** in `components/ui/` (confermato),
> ma "aggiungere + refactorare a tappeto" tocca decine di componenti con API e
> comportamenti diversi (focus trap, scroll lock, markup tabella/select) → alto
> churn e rischio regressioni, non eseguibile alla cieca. Da affrontare un
> componente alla volta con migrazione verificata, non in blocco.

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

---

## 2.6 Centralizzare body scroll lock

Estrarre `hooks/useBodyScrollLock.ts` con counter (se 2 modali aperti, sblocca solo quando entrambi chiusi).

Refactor tutti i 10+ modali che fanno `document.body.style.overflow = 'hidden'` inline.

---

## 2.7 Rimuovere `background-attachment: fixed`

**File:** `app/globals.css:91,101,111`

Rimuovere `background-attachment: fixed` (bug iOS Safari), usare `<div fixed inset-0 -z-10>` in `app/layout.tsx`.

---

## 2.8 Rimuovere `'use client'` da componenti presentazionali

**File:** 30+ file (lista completa in appendice B del report)

Rimuovere `'use client'` da: `AuthCard`, `AuthSubmitButton`, `AuthSecondaryButton`, `AuthFooterLinks`, `AuthPageHeader`, `AuthStepIndicator`, `AuthField`, `AuthBackLink`, `AuthSplitHeader`, `AssoHintBubble`, `BuildInfoBadge`, `CardMascotteStyles`, `WardrobePanel`, `BugReportModal`, `AssoChatModal`, `CardMascotteOverlays`, `CardMascotteWidget`, `CategoriesGrid`, `EbartexProductsSection`, `GameHomeLayout`, `GridCardTitle`, `ResponsiveGrid`, `MarketplaceOrderCard`, `MockShippingOrderCard`, `SupportTicketCard`, `AsteMineViewBar`, `PhotoPairingInlinePanel`, `AuctionCreateStepPanel`, `OrderItemCard`, `cart-summary`.

---

## Criteri di accettazione

- `npm run lint` e `npm run typecheck` restano a 0 errori
- `grep -r "focus:ring-0\|focus:outline-none" components/ui/` limitato ai casi giustificati
- Nessun hex `#FF7300`/`#1D3160`/`#0F172A` in `className` (eccetto `globals.css`)
- Nessun `z-[NNN]` arbitrario sopra 100 (solo token)

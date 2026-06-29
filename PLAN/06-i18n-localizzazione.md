# Piano 6 — i18n & Localizzazione

**Obiettivo:** Eliminare stringhe hardcoded, localizzare formattazione, tradurre 246 chiavi narrative.

---

## 6.1 Localizzare formattazione date/numeri/currency

**File:** 50+ file con `toLocaleString('it-IT')` hardcoded

Azioni:

1. Creare `hooks/useIntlLocale.ts`:

```ts
export function useIntlLocale(): string {
  const lang = useLanguage(); // da LanguageContext
  return LOCALE_TO_INTL[lang] || 'it-IT';
}
```

2. Sostituire `'it-IT'` hardcoded con `useIntlLocale()`
3. Aggiornare `lib/utils.ts:15,20,48` (`formatEur`, `formatEurCents`, `formatEuroNoSpace`) per accettare parametro `locale`

**Verifica:** `grep -r "toLocaleString('it-IT'\|Intl.NumberFormat('it-IT'" components/ lib/ | wc -l` deve scendere sotto 5.

---

## 6.2 Localizzare `<html lang>` e `og:locale`

**File:** `app/layout.tsx:48,86`

Azioni:

- `<html lang="it">` → renderizzare server-side con cookie `ebartex_preferred_language` o `Accept-Language`
- `og:locale: 'it_IT'` → dinamico basato su `useLanguage()`

---

## 6.3 Tradurre 246 chiavi narrative in de/fr/es/pt

**File:** `lib/i18n/messages/{de,fr,es,pt}.ts`

Namespace prioritari:

1. `loginGate.*` (~19 chiavi) — "Sign in", "Sign up", "Email or username", "Forgot password?", "Check your email"
2. `passwordReset.*` (~20 chiavi) — "Recover credentials", "Enter reset code", "8-character code"
3. `accountPage.bulkPrice.*` (~15 chiavi) — "Are you sure?", "All platforms", "Confirm", "Cancel"
4. `auctions.mobilePairing.*` (~25 chiavi) — "Back to new listing", "Drag = move", "Photo sent!"
5. `registrati.privato.*` (3 chiavi) — "Private account", "Back to registration"
6. `pages.login.demoLanding.*` (5 chiavi) — "Sign in", "Explore the site", "Magic: The Gathering"

---

## 6.4 Aggiungere check qualità traduzioni

**File:** `scripts/check-i18n-quality.mjs` (nuovo)

Per ogni namespace NON tecnico, verificare che `value[locale] !== value[en]` per ogni lingua. Fallire con exit 1 se >N identici.

---

## 6.5 Estrarre 300 stringhe hardcoded

**Top file da refactorare:**

1. `components/dev/BugReportButton.tsx` (16 stringhe)
2. `components/dev/ScreenshotAnnotator.tsx` (11)
3. `components/feature/aste/AuctionBidPanel.tsx` (16)
4. `components/feature/aste/create/wizard/AuctionCreateEmbeddedReviewStep.tsx` (12)
5. `app/scanner/page.tsx` (14)
6. `app/users/[username]/UserProfileClient.tsx` (12)
7. `app/collezioni-firmate-alterate/signed-altered-client.tsx` (15)

Creare namespace dedicati: `dev.bugReport.*`, `scanner.*`, `auctions.bidPanel.*`.

**Verifica:** `npm run i18n:check` deve restituire 0 risultati per `app/` e `components/`.

---

## 6.6 Localizzare pagine di errore

**File:** `app/offline/page.tsx`, `app/aste/*/error.tsx`, `app/aste/error.tsx`, `app/ordini/.../page.tsx`, `app/products/[slug]/page.tsx`

Aggiungere `useTranslation()` o passare a layout con traduzione.

---

## 6.7 Uniformare "Login" / "Log in" / "Sign in"

**File:** `lib/i18n/messages/en.ts`

Scegliere "Sign in" come unico termine, sostituire in tutte le chiavi.

---

## 6.8 Fix typo `footer.link.mtg`

**File:** `lib/i18n/messages/it.ts:205`

`'Magic: the Gathering'` → `'Magic: The Gathering'`.

---

## Criteri di accettazione

- `npm run i18n:keys` passa
- `npm run i18n:check` (nuovo) passa con 0 stringhe hardcoded in `app/` e `components/`
- `npm run i18n:quality` (nuovo) passa con 0 chiavi non tradotte in de/fr/es/pt
- Tutti i `toLocaleString('it-IT')` sostituiti con `useIntlLocale()`

---

## Diario esecuzione — 2026-06-29 (6.6 pagine di errore)

Continuazione della sessione 2026-06-24 (vedi storico sotto/memoria). Gate verdi:
`npm run typecheck` ✅, `npm run lint` ✅ (0 errori), `npm run i18n:keys` ✅
(**2164 chiavi × 6 locali**), test **199/199**.

**Fatto — 6.6 Localizzare pagine di errore:**

Tutte le pagine error/offline sono Client Component dentro il provider tree → usano
`useTranslation()`. Localizzate (titolo, descrizione, bottoni "Riprova"/"Home"):
- `app/aste/error.tsx`, `app/aste/[id]/error.tsx` (con "Torna alle aste"),
  `app/scambi/error.tsx`, `app/scanner/error.tsx`, `app/ordini/error.tsx`,
  `app/vendi/error.tsx`, `app/offline/page.tsx`.
- `app/error.tsx` e `app/not-found.tsx` erano **già** localizzati.

Aggiunte 14 chiavi nuove ×6 locali (it/en/de/fr/es/pt), namespace `pages.error.*`
(sectionGeneric, home, backToAuctions, asteTitle, asteDetailTitle,
asteDetailDescription, scambiTitle, scannerTitle, scannerDescription, ordiniTitle,
vendiTitle) e `pages.offline.*` (title, description1, description2). Riusate le
preesistenti `pages.error.retry`/`pages.error.title`/`pages.error.generic`.

**Non toccato:**
- `app/global-error.tsx` — è **fuori** dal provider tree (renderizza il proprio
  `<html><body>`), quindi `useTranslation()` non è disponibile lì. Lasciato invariato.
- **6.7** (uniformare "Login"/"Sign in"): cosmetico, saltato come da nota precedente.
- 6.2/6.4 e il resto di 6.1/6.5 restano come documentato nel diario 2026-06-24.

## Diario esecuzione — 2026-06-29 (6.1 batch formattazione)

Avanzamento di **6.1** (formattazione locale-aware). Infra già pronta da sessioni
precedenti: `useIntlLocale()` e i formatter di `lib/utils.ts` accettano già `locale`.
Localizzati 9 call-site hardcoded `'it-IT'` (date + numeri) in 2 cluster client:

- **Aste detail:** `AuctionDetailsSummary` (2), `AuctionTimerCardDesktop` (1),
  `AuctionTimerCardMobile` (1), `AuctionCreateSuccessScreen` (1) →
  `new Date().toLocaleString(intlLocale, …)` / `Intl.DateTimeFormat(intlLocale, …)`.
- **Product "sold copies":** `ProductDetailChartTab` (1), `ProductDetailInfoTab` (2),
  `ProductDetailSellTab` (2), `MobileChartKpiRow` (1, ora `'use client'`) →
  `new Intl.NumberFormat(intlLocale)`.

Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.

**Restano (6.1):** ~28 call-site `'it-IT'` ancora hardcoded, in gran parte **formatter
a livello di modulo** (es. `const eurFmt = new Intl.NumberFormat('it-IT', …)` in
acquisti/aste-browse/seller-table) che richiedono restructuring (spostare il formatter
dentro il componente o passare il locale come parametro), più alcuni helper in
`lib/inventory/*` e `lib/i18n/locales.ts`. Da fare in batch dedicati.

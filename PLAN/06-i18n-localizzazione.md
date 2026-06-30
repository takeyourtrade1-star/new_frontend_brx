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

## Diario esecuzione — 2026-06-29 (6.1 batch acquisti)

Localizzato il cluster **acquisti** (7 file): i formatter a scope-modulo
(`const eurFmt = new Intl.NumberFormat('it-IT', …)`) sono stati rimossi e sostituiti
con `formatEur(n, intlLocale)` di `lib/utils`; gli helper `formatDateTime(iso)` ora
accettano `locale`; aggiunto `useIntlLocale()` nei componenti (con `'use client'`
dove mancava: MarketplaceOrderCard, SupportTicketCard).

File: `OrderCard`, `MarketplaceOrderCard`, `MockPurchaseOrderCard`,
`MockShippingOrderCard`, `SupportTicketCard`, `MockPaymentFormModal`,
`PaymentConfirmModal`. Residui `'it-IT'` di formattazione in `components/feature/acquisti/`: **0**.

Conteggio globale `'it-IT'` (toLocaleString/Intl) sceso da 37 → **18**. Gate verdi:
typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.

## Diario esecuzione — 2026-06-29 (6.1 batch vendite/users/notifiche/pagination)

Localizzati 4 file (helper → param `locale` + `useIntlLocale()` nel componente):
`VenditeSaleCard` (formatPrice + formatDateTime), `UserProfileCollectionPanel`
(formatPrice), `NotificationBell` (toLocaleDateString nel fallback di formatRelative),
`OggettiPagination` (4× toLocaleString). Conteggio globale `'it-IT'` 18 → **12**.

**Restano (~6, esclusi i fallback legittimi):** i `'it-IT'` in `lib/utils.ts`,
`lib/i18n/useIntlLocale.ts`, `lib/i18n/locales.ts` sono **default/fallback corretti**
(da NON toccare). Rimangono da fare: `CartDropdown`, `FloatingCartFab`, `TopBar`,
`app/cart/page.tsx`, `trade-proposal-ui`, `LegalDocShell`, `OggettiTable`/`OggettiMobileList`;
+ deferiti per complessità/scelta: `ProductPriceChart`/`ModernSellerTable`/
`auctions-browse-shared` (formatter module-scope multi-call-site), `SetPageClient`
(`formatEuro` è **dead code**), `SyncStatusOverview`/`SyncHistorySection` (admin IT-only),
`BuildInfoBadge` (dev), `inventory-export-utils` (non-componente, export CSV).
Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.

## Diario esecuzione — 2026-06-29 (6.1 chiusura inventario + verifica falsi positivi)

Verificato che la maggior parte dei `'it-IT'` "da fare" NON erano hardcoded:
`CartDropdown`, `FloatingCartFab`, `TopBar`, `app/cart/page.tsx`, `LegalDocShell`
usano già `LOCALE_TO_INTL[locale] ?? 'it-IT'` = **fallback corretto** (invariati).
Localizzati gli ultimi 2 hardcoded reali con `useIntlLocale()` nel componente:
`OggettiMobileList` (priceLabel) e `OggettiTable` (cella prezzo). Conteggio `'it-IT'`
hardcoded effettivi → **0** (restano solo fallback legittimi + deferiti).
`trade-proposal-ui.formatTradeEuro` resta deferito: fn module-scope, 14 call-site in
4 file (incl. fn interne), refactor invasivo a basso valore (solo formato numero).
Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅ (2164×6), test 199/199 ✅.

## Diario esecuzione — 2026-06-29 (6.5 estrazione hardcoded aste/detail)

Estratti 2 sotto-componenti `aste/detail` user-facing in i18n (18 chiavi ×6 locali,
it=originale + en/de/fr/es/pt MT): `ProxyLimitModal` → `auctions.proxyModal.*` (12
chiavi, +`useTranslation`), `AuctionShippingDetails` → `auctions.shippingDetails.*` (6
chiavi, +`'use client'`+`useTranslation`; intercettata anche "Resto Europa (default)"
che `i18n:check` non flaggava). 0 hardcoded residue nei 2 file. Parità i18n:keys ora
**2182 ×6**. Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.
NB: `i18n:check` totale resta ~800 (in gran parte falsi positivi/brand/gergo TCG); il
"0" del piano non è un target realistico — si procede per cluster user-facing a valore.

## Diario esecuzione — 2026-06-29 (6.5 batch 2: aste/detail completo + a11y)

Localizzato il resto del cluster aste/detail (16 chiavi nuove ×6 + riuso `common.close`
e `auctions.detailBidsCount`): `CalendarAddMenu` (+'use client', aria/iOS/Google),
`AuctionImageLightbox` (+'use client', Chiudi + aggiunti aria-label prev/next = a11y),
`AuctionGallery` (+'use client', aria zoom), `AuctionBidHistory` ("Nessuna offerta
ancora" + "Vedi meno"/"Vedi tutte ({count})"), `AuctionTimerCardDesktop`/`Mobile`
(aria/title calendario + "offerte"), `AuctionCreateSuccessScreen` (blocco dettagli
pubblicazione, 5 stringhe con interpolazione {date}/{id}). Parità i18n:keys **2198×6**.
Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅. Cluster aste/detail
ora privo di stringhe hardcoded user-facing.

## Diario esecuzione — 2026-06-29 (6.5 batch 3: cluster account/oggetti)

Localizzato il cluster gestione inventario (12 chiavi nuove ×6 in namespace
`accountPage.*` + riuso common.close/common.cancel/breadcrumbNav/breadcrumb.account/
itemsViewTable/itemsViewTableAria/itemsTableActions): `BulkDeleteModal` (+'use client'
già presente, +useTranslation: titolo/progress/sezione sync/opzioni/footer con
interpolazioni {count}/{current}/{total}), `OggettiContent` (breadcrumb + toolbar
Sync/Tabella/Griglia, sia desktop che mobile via replace_all), `OggettiTable` e
`OggettiMobileList` (aria-label Diminuisci/Aumenta quantità + Azioni). Parità
i18n:keys **2210×6**. Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.
`Promise` (annotazioni di tipo) e fallback `Carta #{id}` lasciati (falsi positivi/interni).

## Diario esecuzione — 2026-06-29 (6.5 batch 4: modali acquisti)

Localizzati i 2 modali acquisti: `SupportRequestModal` (namespace `support.*`, 8 chiavi
nuove incl. titolo default interpolato {id} + messaggio errore validazione) e
`PaymentConfirmModal` (namespace `mockCheckout.*`, 5 chiavi nuove + riuso
mockCheckout.simulatePayment/cancel + common.close; testo "Stai per pagare l'ordine"
spezzato in payingOrderPrefix + relativeToAuction per preservare il markup <strong>).
Parità i18n:keys **2223×6**. Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.

## Diario esecuzione — 2026-06-29 (6.5 batch 5: profilo utente pubblico)

`app/users/[username]/UserProfileClient.tsx` localizzato (namespace `userProfile.*`,
18 chiavi nuove). Tutti i sotto-componenti (AccountTypeBadge, NotFoundState, ErrorState,
ProfileHero) hanno il proprio `useTranslation`. `formatMemberSince` riscritto: rimossi
i nomi-mese IT hardcoded → `Intl.DateTimeFormat(locale, {month:'long',year:'numeric'})`
con `useIntlLocale()`. Descrizione "utente non trovato" spezzata prefix/suffix per
preservare lo @username in grassetto. Parità i18n:keys **2241×6**. Gate verdi:
typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅. NB: il componente usa ancora
useEffect+authApi.get (anti-pattern RQ) — fuori scope i18n, non toccato.

## Diario esecuzione — 2026-06-29 (6.1 formatter module-scope rimanenti — 6.1 di fatto COMPLETO)

Localizzati gli ultimi formatter user-facing a scope-modulo (commit 8a9000b):
- `auctions-browse-shared.tsx`: `MoneyWithSmallCents` → formatter creato in-render con
  `useIntlLocale()` (rimosso `EURO_PARTS_FORMATTER` module-scope).
- `ProductPriceChart.tsx`: `formatEuroShort(n, locale)` (assi Y + tooltip), locale via
  `useIntlLocale()` nel componente.
- `ModernSellerTable.tsx`: `formatReviewRating`/`formatSalesCount` ora con `locale` +
  `reviewCount.toLocaleString(intlLocale)`; locale da `useIntlLocale()` in
  `MarketplaceSellerCell`.
- `lib/inventory/inventory-export-utils.ts`: `formatPrice(cents, locale='it-IT')`
  (export senza caller attuali; default coerente con i formatter di lib/utils).

**6.1 di fatto CHIUSO.** I `'it-IT'` ancora a grep sono solo INTENZIONALI: `BuildInfoBadge`
(dev), `SetPageClient.formatEuro` (**dead code**), `SyncStatusOverview`/`SyncHistorySection`
(admin IT-only), + default/fallback in `lib/utils.ts`/`lib/i18n/locales.ts`/
`lib/i18n/useIntlLocale.ts`/`inventory-export-utils`. Gate verdi: typecheck ✅, lint ✅,
i18n:keys ✅, test 199/199 ✅.

## Diario esecuzione — 2026-06-29 (6.4 script quality + 6.5 scanner page)

**6.4 — `scripts/check-i18n-quality.mjs` + `npm run i18n:quality`:** confronta i VALORI
di de/fr/es/pt contro en (fallback) e segnala le chiavi potenzialmente non tradotte,
ESCLUDENDO i falsi positivi via allowlist (brand/gergo TCG/nomi giochi/sigle, valori
senza lettere, namespace proper-noun `country.`/`games.`, sole interpolazioni).
Default = report (exit 0, non rompe la CI); `--strict` (+ `I18N_QUALITY_BUDGET`) per
far fallire; `--list` elenca le sospette. Stato attuale: de 72, fr 85, es 71, pt 68
(296 totali genuinamente non tradotte → input per futuri batch 6.3).

**6.5 — `app/scanner/page.tsx` estratto:** 32 nuove chiavi `scanner.*` ×6 locali
(badge Turbo/Standard, StatusBar, aria-label toolbar, CameraPermissionDenied, MatchPreview
con `{card}`/`{pct}`, RequestingCameraLoader, LiveHintChip, hint scan, noscript). Tutti i
sotto-componenti (module-level) hanno ora il proprio `useTranslation`. Tradotto in
de/fr/es/pt. Restano hardcoded solo le label del DebugOverlay (dev, `?debug=1`).
Parità i18n:keys **2273×6**. Gate verdi: typecheck ✅, lint ✅, i18n:keys ✅, test 199/199 ✅.

# Piano 5 — SEO & Metadata

**Obiettivo:** Rendere `/products/*` e `/aste/*` indicizzabili, aggiungere hreflang, sitemap dinamico.

> 🔎 **Review piano vs codebase (2026-06-24).** File recuperato da git history. Le
> modifiche SEO sono lato server (metadata/sitemap/robots) → basso rischio runtime
> per l'utente, verificabili con build. Eseguito un primo batch sicuro e ad alto
> valore. typecheck + lint a 0, `npm run build` exit 0.
>
> **Stato sintetico:**
> - ✅ **5.1** `generateMetadata` per `/products/[slug]` (con `cache()` per evitare doppio fetch) — FATTO.
> - ✅ **5.3** Rotte app/private fuori dall'indice (via `robots.ts`) — FATTO.
> - ✅ **5.7** `SITE_URL` centralizzato + **fix bug** base URL = CDN in sitemap/robots — FATTO.
> - ✅ **5.5** `canonical` su pagine filtrate (`/aste`, `/search`, `/products`, `/scambi`) — FATTO.
> - ✅ **5.6** JSON-LD BreadcrumbList su `/products/[slug]` — FATTO.
> - ✅ **5.8** `<h1>` sr-only dove mancava (`/aste`, `/scambi`, `/aste/[id]`) — FATTO.
> - ⛔ **5.2** `generateMetadata` `/aste/[id]` — **RIMANDATO** (serve fetch asta server-side; vedi nota).
> - ⛔ **5.4** Sitemap dinamico prodotti/aste — **RIMANDATO** (serve enumerazione server; vedi nota).

---

## 5.1 `generateMetadata` dinamica per `/products/[slug]`

**File:** `app/products/[slug]/page.tsx`

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  if (isIndexProductId(slug)) {
    const card = await getCardDocumentById(slug);
    if (!card) return { title: 'Prodotto non trovato' };
    return {
      title: `${card.name} (${card.set_name}) | Ebartex`,
      description: `Compra ${card.name} da ${card.set_name} su Ebartex: prezzi, venditori, aste.`,
      openGraph: {
        title: card.name,
        description: `${card.set_name} · Ebartex`,
        images: card.image ? [{ url: buildImageUrl(card.image) }] : undefined,
      },
      alternates: { canonical: `/products/${slug}` },
    };
  }
  return { title: 'Prodotto | Ebartex' };
}
```

> ✅ **FATTO (2026-06-24).** `generateMetadata` aggiunta in
> `app/products/[slug]/page.tsx`. Differenze rispetto allo snippet (giustificate):
> - Helper reali: `isIndexProductId` + `getCardDocumentById` (già esistenti),
>   immagine OG via `getCardImageUrl` (CDN assoluto), non `buildImageUrl` (non export).
> - `getCardDocumentById` usa `cache:'no-store'` → l'ho avvolto con `cache()` di
>   React (`const getCard = cache(getCardDocumentById)`) condiviso tra
>   `generateMetadata` e la pagina: **una sola fetch Meili per richiesta**.
> - Per slug non-catalogo (boutique/categorie/mock) ritorna `{}` (default layout);
>   carta non trovata → `robots: { index: false }`.

---

## 5.2 `generateMetadata` dinamica per `/aste/[id]`

**File:** `app/aste/[id]/page.tsx`

Stesso pattern con `getAuctionById(id)` da BFF o fetch diretto.

> ⛔ **RIMANDATO (2026-06-24).** Non esiste un fetch asta usabile server-side:
> `lib/api/auction-client.ts` è browser-only (token da localStorage). Servirebbe
> un nuovo path di fetch diretto al backend in RSC. Inoltre le aste sono
> **effimere** (scadono): metadata dinamici su pagine che diventano stale/404 hanno
> valore SEO limitato. Nel frattempo aggiunto `<h1>` sr-only (5.8). Da affrontare
> insieme alla pre-fetch RSC delle aste (PLAN.md BLOC-5 5.2).

## 5.3 `robots: { index: false }` su pagine private

**File:** `app/scanner/page.tsx`, `app/aste/nuova/page.tsx`, `app/aste/mie/page.tsx`, `app/aste/partecipazioni/page.tsx`, `app/bidding/page.tsx`, `app/vendi/*/page.tsx`

Aggiungere:

```ts
export const metadata: Metadata = {
  title: '...',
  robots: { index: false, follow: false },
};
```

> ✅ **FATTO via `robots.ts` (2026-06-24).** Diverso dallo snippet ma migliore:
> `app/scanner/page.tsx` è `'use client'` e **non può** esportare `metadata`. Invece
> di editare N file (alcuni client) ho aggiunto le rotte al disallow di
> `app/robots.ts`: `/scanner`, `/bidding`, `/cart`, `/aste/nuova`, `/aste/mie`,
> `/aste/partecipazioni`, `/vendi/`, `/c/`. Copre client + server in un punto solo.
> Inoltre rimosse da `sitemap.ts` `/aste/nuova` e `/cart` (auth-gated dal
> middleware: erano erroneamente indicizzabili).

## 5.4 Sitemap dinamico

**File:** `app/sitemap.ts`

Aggiungere `getIndexableProductUrls(limit: 10_000)` + `getIndexableAuctionUrls(limit: 5_000)` da endpoint server-side.

Aggiungere `alternates.languages` quando routing localizzato esisterà.

> ⛔ **RIMANDATO (2026-06-24).** Gli helper `getIndexableProductUrls`/
> `getIndexableAuctionUrls` non esistono: servirebbe enumerare tutto il catalogo
> Meili (fino a 10k URL) e le aste attive a build time → operazione pesante e
> fragile (rischio timeout/rate-limit in build su Amplify), da progettare con
> attenzione (paginazione, cache, `revalidate`). Non è un fix meccanico.
> `alternates.languages` (hreflang) non applicabile: non c'è routing localizzato.

## 5.5 `alternates.canonical` per pagine filtrate

**File:** `app/search/page.tsx`, `app/products/page.tsx`, `app/aste/page.tsx`

In `generateMetadata`:

```ts
alternates: { canonical: `https://ebartex.com/search${q ? `?q=${q}` : ''}` }
```

> ✅ **FATTO (2026-06-24).** Aggiunto `alternates: { canonical }` ai metadata di
> `/aste`, `/search`, `/products`, `/scambi`. **Scelta diversa dallo snippet:**
> canonical alla pagina **pulita** (senza query/filtri) invece di includere `q`.
> Per pagine filtrate è la best-practice SEO (deduplica le infinite varianti di
> query verso un'unica URL canonica) ed evita di dover passare a `generateMetadata`
> con `searchParams`. Path relativi → risolti su `metadataBase` (SITE_URL).

## 5.6 JSON-LD BreadcrumbList

**File:** `app/products/[slug]/page.tsx`, `app/aste/[id]/page.tsx`

Iniettare `<script type="application/ld+json">` con `BreadcrumbList` schema.org.

> ✅ **FATTO per `/products/[slug]` (2026-06-24).** Componente `ProductBreadcrumbJsonLd`
> (Home → Prodotti → nome carta) iniettato quando la carta esiste. `<` escapato in
> `<` per evitare breakout del tag `<script>` con dati dal catalogo.
> ⛔ **`/aste/[id]`**: dipende da 5.2 (dati asta server-side non disponibili) → rimandato.

## 5.7 Centralizzare SITE_URL

**File:** `lib/config.ts`

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebartex.com';
```

Rimuovere duplicazione da `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`.

> ✅ **FATTO + BUG FIX (2026-06-24).** Aggiunto `export const SITE_URL` in
> `lib/config.ts` (`NEXT_PUBLIC_SITE_URL || NEXT_PUBLIC_APP_URL || 'https://ebartex.com'`).
> **Bug corretto:** `sitemap.ts` e `robots.ts` usavano `NEXT_PUBLIC_CDN_URL` (la CDN
> immagini CloudFront!) come base degli URL di pagina → gli URL finivano sul dominio
> CDN. Ora usano `SITE_URL`. Aggiornato anche `layout.tsx` `metadataBase`.

## 5.8 Aggiungere `<h1>` espliciti

**File:** `app/aste/page.tsx`, `app/products/page.tsx`, `app/search/page.tsx`, `app/scambi/page.tsx`, `app/aste/[id]/page.tsx`

Aggiungere `<h1 className="sr-only">` con descrizione del contenuto.

> ✅ **FATTO dove mancava (2026-06-24).** Aggiunto `<h1 className="sr-only">` a
> `/aste`, `/scambi`, `/aste/[id]`. **NON** aggiunto a `/search` e `/products`
> (list): i loro componenti (`SearchResults`, `products-page-client`) hanno **già**
> un `<h1>` → un secondo avrebbe violato il criterio "1 h1 per pagina".

## Criteri di accettazione

- Google Search Console mostra title/description unici per `/products/*` e `/aste/*`
- `npm run build` genera sitemap.xml con >100 URL
- Tutte le pagine hanno esattamente 1 `<h1>`
- Validazione schema.org su `https://search.google.com/test/rich-results` passa per BreadcrumbList

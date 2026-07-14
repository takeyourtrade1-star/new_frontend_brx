# Indice Piani di Lavoro — Ebartex Frontend

12 piani strutturati per refactor e hardening del codice, derivati dall'audit pre-lancio del 23 Giugno 2026.

---

## Elenco piani

| # | Titolo | Focus | Sforzo stimato | Priorità |
|---|---|---|---|---|
| [01](./01-architettura-split-monolitici.md) | Architettura & Split File Monolitici | Split hook, sotto-componenti, riduzione complessità | 2-3 settimane | Alta |
| [02](./02-design-system-ui-consistency.md) | Design System & UI Consistency | Componenti shadcn, token HSL, z-index, scroll lock | 1-2 settimane | Media |
| [03](./03-sicurezza-auth.md) | Sicurezza & Auth | Rimozione token localStorage, CSP nonce, CSRF, cookie __Host- | 1 settimana | **Critica** |
| [04](./04-performance-bundle.md) | Performance & Bundle | Rimozione unoptimized, lazy loading, code splitting, RQ staleTime | 1 settimana | Alta |
| [05](./05-seo-metadata.md) | SEO & Metadata | generateMetadata dinamica, sitemap, hreflang, JSON-LD | 3-5 giorni | Alta |
| [06](./06-i18n-localizzazione.md) | i18n & Localizzazione | Formattazione locale, 246 chiavi tradotte, pagine errore localizzate | 1-2 settimane | Media |
| [07](./07-accessibilita.md) | Accessibilità | Focus trap, label, touch target 44×44, WAI-ARIA tabs | 1 settimana | Media |
| [08](./08-test-quality-assurance.md) | Test & Quality Assurance | Test Auth/Scambi/Scanner/Account, sostituzione as any | ongoing | Alta |
| [09](./09-refactor-auth-store.md) | Refactor auth-store (755 righe) | Split in useAuthCore/useAuthFlow/useAuthBootstrap | 2-3 giorni | Media |
| [10](./10-bug-fix-specifici.md) | Bug Fix Specifici | 15 bug identificati (scanner, auction, profile, dispute) | 3-5 giorni | Alta |
| [11](./11-responsive-mobile.md) | Responsive & Mobile | TopBar overflow, touch target, drawer landscape, aspect ratio | 2-3 giorni | Media |
| [12](./12-code-quality-hygiene.md) | Code Quality & Hygiene | Tipizzazione, Zod split, cache headers, error boundaries | ongoing | Bassa-Media |
| [13](./13-refactor-mascotte-asso.md) | Refactor Mascotte Asso | `components/mascotte/`, chunk −67%, wardrobe lazy | 3-5 giorni | Media |
| [14](./14-backend-scambi.md) | Backend Scambi | Modulo `/trades` (auction) + endpoint interni inventario (sync) con propagazione CardTrader; escrow, consegna, BFF + FE | 3-5 settimane | **Alta** |

---

## Ordine di esecuzione raccomandato

1. **03** — Sicurezza (critica, blocca tutto il resto)
2. **04** — Performance (quick wins ad alto ROI)
3. **05** — SEO (impatto diretto su indicizzazione)
4. **08** — Test (safety net per i refactor successivi)
5. **10** — Bug fix specifici (prevenzione regression)
6. **01** — Architettura (split monolitici, abilita test su componenti)
7. **02** — Design system (consolidamento pattern)
8. **06** — i18n (traduzioni + formattazione)
9. **07** — Accessibilità (focus trap, ARIA, touch target)
10. **09** — Auth store refactor (dipende da 01 e 03)
11. **11** — Responsive (polish finale)
12. **12** — Code quality (ongoing, cleanup finale)

---

## Note operative

- Ogni piano include una sezione **"Criteri di accettazione"** alla fine, usabile come checklist per la review
- I piani sono indipendenti: possono essere assegnati a sotto-agenti diversi in parallelo (con attenzione ai conflitti su file condivisi)
- Tutti i piani richiedono `npm run typecheck` e `npm run lint` a 0 errori prima del merge
- I piani 04, 05, 06 toccano file in `app/`, `components/`, `lib/i18n/`: possibile conflitto se eseguiti in parallelo
- I piani 01, 02 toccano molti file: meglio un agente solo per ridurre merge conflict

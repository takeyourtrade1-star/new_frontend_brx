# Errore 403 della ricerca

## Configurazione sicura

Il browser deve chiamare esclusivamente le route same-origin `/api/search/*`.
Host e credenziali Meilisearch non devono mai usare variabili `NEXT_PUBLIC_*` o
`VITE_*`, perché verrebbero incluse nel bundle JavaScript.

Il runtime Next.js accetta soltanto queste variabili server-only:

```env
MEILISEARCH_URL=https://search-internal.example
MEILISEARCH_INDEX=cards
MEILISEARCH_SEARCH_API_KEY=<secret-manager-reference>
```

`MEILISEARCH_SEARCH_API_KEY` deve essere una chiave dedicata con:

- `actions: ["search"]`;
- `indexes` limitati agli indici pubblici realmente interrogati;
- nessun permesso `documents.*`, `indexes.*`, `tasks.*`, `keys.*` o `settings.*`.

Non usare mai la master key o una admin key nel runtime frontend/BFF. Se una
chiave è stata inserita in una variabile pubblica, in un log o nel repository,
revocarla e ruotarla prima del deploy: rimuoverla dal file corrente non la
rimuove dalla cronologia Git né dai bundle già distribuiti.

## Diagnosi

Un 403 indica normalmente chiave revocata, indice non incluso nello scope o
azione `search` mancante. Verificare la policy della chiave nel secret store e
nei log server-side. Le route pubbliche restituiscono deliberatamente soltanto
un errore generico e non inoltrano il body diagnostico di Meilisearch.

# Compatibilita' runtime Amplify

Audit eseguito il 3 agosto 2026 leggendo da Amplify esclusivamente i **nomi**
delle variabili. Il branch `main` non ha override; la configurazione e' a
livello applicazione.

## Alias transitori gia' pubblici

Il BFF preferisce sempre il nome server-only. Per evitare 503 causati soltanto
dal cambio di nome, accetta temporaneamente questi alias gia' presenti nella
configurazione storica:

| Preferito | Alias deprecato |
|---|---|
| `AUTH_API_URL` | `NEXT_PUBLIC_AUTH_API_URL` |
| `AUCTION_API_URL` | `NEXT_PUBLIC_AUCTION_API_URL` |
| `SYNC_API_URL` | `NEXT_PUBLIC_SYNC_API_URL` |
| `MARKETPLACE_API_URL` | `NEXT_PUBLIC_MARKETPLACE_API_URL` |
| `MEILISEARCH_URL` | `NEXT_PUBLIC_MEILISEARCH_URL`, poi `NEXT_PUBLIC_MEILISEARCH_HOST` |
| `MEILISEARCH_INDEX` | `NEXT_PUBLIC_MEILISEARCH_INDEX` |
| `MEILISEARCH_SEARCH_API_KEY` | `NEXT_PUBLIC_MEILISEARCH_API_KEY` |

L'ultimo alias e' ammesso soltanto per continuita' con la chiave di ricerca gia'
pubblicata nel browser: deve avere esclusivamente l'azione `search` e accesso ai
soli indici pubblici. Non sono accettati alias generici come
`MEILISEARCH_API_KEY` o `MEILI_API_KEY`, che potrebbero contenere una master key.
La migrazione deve terminare creando una chiave search-only server-side e
rimuovendo la variabile pubblica dopo un deploy verificato.

Ogni uso di alias genera un warning che contiene soltanto i nomi delle
variabili, mai URL, token o altri valori.

In produzione gli origin HTTPS esatti di questi URL pubblici storici entrano
anche nell'allowlist transitoria degli upstream. La compatibilita' non accetta
HTTP, credenziali, porte, path, query o fragment e non autorizza sottodomini o
host simili. Un URL server-only che punta a un origin diverso continua a
richiedere il relativo hostname in `TRUSTED_UPSTREAM_HOSTS`.

## Configurazioni non equivalenti: blocco intenzionale

Queste assenze non possono essere corrette nel codice senza inventare o
riutilizzare impropriamente segreti:

- `SSO_HANDOFF_ENABLED` e `SSO_MARKETPLACE_CLIENT_SECRET`: l'handoff Tornei
  resta disabilitato finché il client secret scoped non è iniettato a runtime;
  non esiste alcun alias `NEXT_PUBLIC_*` sicuro;

- `AUTH_INTERNAL_CALLER` e `AUTH_INTERNAL_CALLER_TOKEN`: il backend Auth di
  produzione richiede un'identita' scoped. `AUTH_INTERNAL_API_TOKEN` e' un
  vecchio shared token, viene ignorato dal backend hardened e non e' un alias
  sicuro;
- `BRX_MATCH_SERVICE_TOKEN` e `BRX_MATCH_TRUSTED_ORIGINS`: l'URL storico non
  fornisce ne' una credenziale dedicata ne' una allowlist indipendente;
- `RATE_LIMIT_REDIS_REST_URL`, `RATE_LIMIT_REDIS_REST_TOKEN` e
  `RATE_LIMIT_KEY_SECRET`: finche' il provider runtime non e' disponibile, il
  deploy Amplify usa l'eccezione temporanea per-instance documentata in
  `docs/RATE_LIMITING.md`. Il fallback e' bounded ma non distribuito; una
  configurazione Redis parziale, invalida o non raggiungibile resta fail-closed.

Le credenziali devono arrivare al compute SSR tramite un provider runtime di
segreti con IAM minimo e rotazione. Non copiarle in `NEXT_PUBLIC_*`, non
stamparle nei log e non scriverle in `.env.production` durante la build: quel
file entra negli artifact di deploy. Le integrazioni Auth/BRX scoped restano
fail-closed finche' non ricevono identita' dedicate; per il limiter vale invece
l'eccezione temporanea, esplicita e per-instance descritta sopra, da rimuovere
appena Redis e il provider runtime sono pronti.

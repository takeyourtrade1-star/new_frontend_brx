# Marketplace API — dominio dedicato (soluzione production)

## Perché non `api.ebartex.com/marketplace`

| Approccio | Problema |
|-----------|----------|
| Path `/marketplace` su `api.ebartex.com` | Rewrite NPM fragile, strip prefix, 504 gateway, difficile da debuggare |
| IP diretto su Amplify (`15.160.8.178:8004`) | Bypass TLS, non scalabile, IP hardcoded, niente certificato |

**Soluzione ufficiale Ebartex** (come Sync e Auction):

```
marketplace-api.ebartex.com  →  NPM (443)  →  15.160.8.178:8004
```

Zero rewrite. Il backend FastAPI serve `/health` e `/api/v1/*` alla root.

---

## Architettura richieste

```
Browser (www.ebartex.com)
  └─ GET/POST /api/marketplace/listings/...     (same-origin, JWT in header)
       └─ Next.js route handler (Amplify SSR)
            └─ fetch https://marketplace-api.ebartex.com/api/v1/listings/...
                 └─ NPM TLS
                      └─ brx-marketplace :8004
```

- **Niente CORS** lato browser (same-origin proxy).
- **Niente attese CardTrader** in create listing (sync in background sul backend).
- **Public catalog** con cache breve sul proxy (30s).

---

## Passi operativi (ordine)

### 1. DNS + NPM

Segui **`stacks/brx-marketplace/NGINX_MARKETPLACE_PROXY.md`**:

1. Record A `marketplace-api.ebartex.com` → IP NPM
2. Proxy Host → `15.160.8.178:8004`, SSL Let's Encrypt
3. Verifica `curl https://marketplace-api.ebartex.com/health`

### 2. Amplify env (runtime + build)

| Variabile | Valore |
|-----------|--------|
| `MARKETPLACE_API_URL` | `https://marketplace-api.ebartex.com` |
| `NEXT_PUBLIC_MARKETPLACE_API_URL` | `https://marketplace-api.ebartex.com` |

**Redeploy** obbligatorio dopo il cambio.

### 3. Rimuovi workaround

- Elimina `MARKETPLACE_API_URL_DIRECT` e IP hardcoded se presenti.
- Disabilita Custom Location `/marketplace` su `api.ebartex.com` in NPM.

### 4. Smoke test post-deploy

```bash
# Da terminale
curl -sS https://marketplace-api.ebartex.com/health
curl -sS "https://marketplace-api.ebartex.com/api/v1/listings/public/by-blueprint/229009?card_id=mtg_359"

# Da browser (loggato): pagina prodotto → tab Venditori → righe visibili in < 2s
# Publish listing → successo in < 3s (foto attach non blocca)
```

---

## Performance attese

| Operazione | Target |
|------------|--------|
| Health / public listings | < 500 ms |
| Tab Venditori (sync + marketplace parallel) | righe subito, nomi seller dopo |
| Publish listing | risposta API < 2 s |
| Foto listing in tabella | 1 batch `/photos/by-listings` |

---

## CORS backend (solo se chiami API direttamente dal browser)

Con il proxy `/api/marketplace` **non serve** CORS aggiuntivo.

Se in futuro esponi chiamate dirette a `marketplace-api.ebartex.com` dal client, aggiungi in SSM/env del servizio:

```env
ALLOWED_ORIGINS=https://www.ebartex.com,https://main.xxxxx.amplifyapp.com
```

---

## Riferimenti

- Deploy checklist backend: `Main-app/backend/brx-marketplace/DEPLOY_CHECKLIST.md`
- Amplify: `DEPLOY_AMPLIFY_MARKETPLACE.md`
- NPM config: `stacks/brx-marketplace/NGINX_MARKETPLACE_PROXY.md`

# Deploy su GitHub + Amplify (e Sync)

Nessuna modifica al **codice** frontend per la sincronizzazione: il frontend usa già il proxy `/api/sync/...` → il server Next.js inoltra al microservizio Sync. Serve solo configurare le variabili d’ambiente.

## 1. Frontend (Amplify)

Le richieste del **browser** vanno correttamente a `main....amplifyapp.com/api/sync/...` (stessa origine). Il **server** Next.js (API route) deve inoltrare a Sync: per questo usa la variabile d’ambiente a **runtime**.

In **Amplify Console** → tua app → **Environment variables** imposta:

| Variabile | Valore | Note |
|-----------|--------|------|
| **`SYNC_API_URL`** | `https://sync.ebartex.com` | Usata **a runtime** dal proxy `/api/sync`. Preferita rispetto a NEXT_PUBLIC_*. |
| `NEXT_PUBLIC_SYNC_API_URL` | (opzionale) `https://sync.ebartex.com` | Fallback se SYNC_API_URL non è impostata. |

Senza trailing slash. Dopo aver salvato le variabili, fai **Redeploy** (o “Redeploy this version”) così la nuova build usa le variabili e il server le ha a runtime.

## 2. Backend Sync (Docker / AWS)

Nel ambiente dove gira il Sync (ECS, EC2, ecc.) imposta:

| Variabile | Valore | Note |
|-----------|--------|------|
| `ALLOWED_ORIGINS` | `https://main.d8ry9s45st8bf.amplifyapp.com` | Origine frontend Amplify (già in codice come fallback; qui per override esplicito). |

Se il frontend è anche su altro dominio (es. `https://www.ebartex.com`), metti più origini separate da virgola, **senza spazi**:
`https://main.d8ry9s45st8bf.amplifyapp.com,https://www.ebartex.com`

## 3. Perché nei log vedi `main....amplifyapp.com/api/sync`

È il comportamento previsto: il **browser** chiama sempre la stessa origine del frontend (`/api/sync/...`), così non ci sono richieste cross-origin e non serve CORS per il browser. La richiesta arriva al server Next.js su Amplify; l’API route **legge SYNC_API_URL a runtime** e fa `fetch(https://sync.ebartex.com/api/v1/sync/...)`. Quindi:
- Log lato Amplify/frontend: `main....amplifyapp.com/api/sync` → corretto (è la richiesta del browser).
- Il server poi contatta `https://sync.ebartex.com` in backend; se manca la variabile o Sync non è raggiungibile, avrai 503 o 502.

Se ricevi **503** con messaggio “SYNC_API_URL or NEXT_PUBLIC_SYNC_API_URL is not configured”, la variabile non è disponibile a runtime: imposta **SYNC_API_URL** in Amplify e rifai un **Redeploy** completo.

## 4. Riepilogo flusso

1. **Browser** (Amplify) → richiesta a `https://main....amplifyapp.com/api/sync/...` (stessa origine, niente CORS dal browser).
2. **Next.js** (server Amplify) → usa `NEXT_PUBLIC_SYNC_API_URL` e fa `fetch(https://sync.ebartex.com/api/v1/sync/...)`.
3. **Sync** deve essere raggiungibile su `https://sync.ebartex.com` (DNS + ALB/ingress). CORS sul Sync serve solo se un giorno chiamerai l’API Sync direttamente dal browser (non con il proxy attuale).

## 5. Cosa pushare su GitHub

- **Frontend**: tutto il codice incluso `.env.example` (non committare `.env` con segreti).
- **Backend Sync**: codice con CORS e `.env.example` aggiornati.
- In **Amplify** e nel **sistema dove gira il Sync** (task definition, docker-compose, ecc.) configura le variabili sopra; non servono altri cambi al codice per “spedirlo su GitHub” connesso al sistema automatico Amazon.

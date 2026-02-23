# Perché sync.ebartex.com dà "Connessione negata" e come sistemarlo

## Cosa succede

- **http://35.152.68.54:8002/** → risponde `{"service":"brx-sync",...}` ✅ (il servizio Sync è attivo sulla porta **8002**).
- **http://sync.ebartex.com/** → **ERR_CONNECTION_REFUSED** ❌ (il browser non riesce a connettersi).

## Perché sync.ebartex.com non funziona

1. **Il servizio Sync ascolta solo sulla porta 8002**  
   I siti web usano di default la porta **80** (HTTP) o **443** (HTTPS). Nessun processo è in ascolto su 80/443 per il dominio `sync.ebartex.com`, quindi la connessione viene rifiutata.

2. **DNS**  
   `sync.ebartex.com` deve puntare all’IP del server dove gira Sync (es. `35.152.68.54`). Se il record A non c’è o punta altrove, il dominio non arriva nemmeno al server giusto.

## Cosa fare: reverse proxy su 80/443

Serve un **reverse proxy** che ascolta su 80/443 per `sync.ebartex.com` e inoltra a **35.152.68.54:8002**.

---

### Opzione A: Nginx Proxy Manager (consigliato se già in uso)

Hai già **Nginx Proxy Manager** su **http://35.152.143.30:81/nginx/proxy**. Usa quello.

#### 1. DNS

- **sync.ebartex.com** deve puntare al server dove gira il **proxy** (NPM), non al server Sync:
  - Record **A**: nome `sync` (o `sync.ebartex.com`), valore **35.152.143.30**.

#### 2. Proxy Host in Nginx Proxy Manager

1. Vai su **http://35.152.143.30:81** → accedi → **Hosts** → **Proxy Hosts** → **Add Proxy Host**.
2. **Details**:
   - **Domain names:** `sync.ebartex.com`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `35.152.68.54` (il server dove gira Sync)
   - **Forward Port:** `8002`
   - Spunta **Cache Assets** se vuoi (opzionale).
3. **SSL** (consigliato per il frontend HTTPS):
   - Abilita **SSL Certificate** → **Request a new SSL Certificate** → spunta **Force SSL**.
   - Così avrai **https://sync.ebartex.com**.
4. Salva.

#### 3. Verifica

- Il security group dell’istanza **35.152.143.30** deve avere le porte **80** e **443** aperte in ingresso.
- Da browser: **https://sync.ebartex.com** (o http se non hai attivato SSL) deve restituire `{"service":"brx-sync",...}`.

Poi nel frontend (Amplify) imposta **`NEXT_PUBLIC_SYNC_API_URL=https://sync.ebartex.com`** (o `http://` se usi solo HTTP).

---

### Opzione B: Nginx sull’istanza Sync (35.152.68.54)

Solo se **non** usi Nginx Proxy Manager. DNS: record **A** `sync.ebartex.com` → **35.152.68.54**.

Sull’istanza dove gira Sync (porta 8002), installa nginx e configura un virtual host per `sync.ebartex.com`:

```nginx
# /etc/nginx/sites-available/sync.ebartex.com
server {
    listen 80;
    server_name sync.ebartex.com;
    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Poi:

```bash
sudo ln -s /etc/nginx/sites-available/sync.ebartex.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Apri la **porta 80** (e 443 se usi HTTPS) nel security group dell’istanza (AWS / firewall).

Dopo questi passaggi, **http://sync.ebartex.com** dovrebbe rispondere come **http://35.152.68.54:8002**.

#### 3. (Opzionale) HTTPS con Let’s Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sync.ebartex.com
```

Poi nel frontend usa **https://sync.ebartex.com** (e imposta `NEXT_PUBLIC_SYNC_API_URL=https://sync.ebartex.com`).

### CORS sul backend Sync (sempre necessario)

Il frontend (es. Amplify) chiama **direttamente** `https://sync.ebartex.com`. Il backend Sync deve avere CORS configurato con l’origine del frontend, ad esempio:

- `https://main.d8ry9s45st8bf.amplifyapp.com`
- oppure `https://www.ebartex.com` se usi un dominio custom.

Nel `.env` del Sync (o nella config CORS):

```env
ALLOWED_ORIGINS=https://main.d8ry9s45st8bf.amplifyapp.com,https://www.ebartex.com
```

## Riepilogo

| Cosa | Stato |
|------|--------|
| Sync in esecuzione | ✅ su 35.152.68.54:8002 |
| Nginx Proxy Manager | ✅ su 35.152.143.30:81 (http://35.152.143.30:81/nginx/proxy) |
| sync.ebartex.com raggiungibile | ❌ finché non configuri Proxy Host in NPM e DNS |
| Cosa fare (con NPM) | DNS A `sync.ebartex.com` → **35.152.143.30**; in NPM aggiungi Proxy Host → 35.152.68.54:8002; SSL opzionale; CORS con origine Amplify |

Dopo aver messo in piedi dominio e proxy, il frontend può usare `NEXT_PUBLIC_SYNC_API_URL=https://sync.ebartex.com` (o `http://` se per ora usi solo HTTP) e le richieste arriveranno correttamente a Sync.

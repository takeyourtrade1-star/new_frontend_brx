# Rate limiting del BFF

La modalità preferita per le route `app/api/*` usa una quota condivisa tra tutte
le istanze tramite un endpoint REST compatibile Redis. L'incremento e
l'impostazione del TTL sono eseguiti in un singolo script Lua `EVAL`, quindi
restano atomici anche con richieste concorrenti e scaling orizzontale.

Per mantenere disponibili le route non sensibili dell'attuale deploy Amplify
finché non è pronto il provider di segreti runtime, esiste una modalità di
compatibilità esplicita: **solo quando tutte e quattro** le variabili URL/token
Redis dedicate e Upstash sono assenti o vuote, il processo usa un limiter in
memoria limitato a 5.000 chiavi ed emette un solo warning statico (senza IP, URL
o segreti). Quota e finestra configurate dalle route restano identiche.

Le mutazioni auth che permettono tentativi su password, codici o account non
usano mai tale fallback in produzione. Senza Redis rispondono 503 `no-store`:

- `login`, `login/code/request`, `login/code/verify`, `register`, `verify-mfa`;
- `change-password`, `mfa/enable`, `mfa/verify`, `mfa/disable`;
- `resend-verification`, `verify-email/code`, `verify-email/token`;
- `password/reset/request`, `password/reset/verify-code`,
  `password/reset/confirm-init`, `password/reset/confirm-final`.

`refresh` e il bridge di refresh restano sul fallback di compatibilità perché
validano token ad alta entropia già emessi; renderli dipendenti da Redis
causerebbe un logout generalizzato durante un outage. Il logout locale cancella
sempre i cookie prima della revoca remota best-effort e non dipende dal limiter.
`password/reset/clear-session` è una cancellazione locale e non consuma quota.
In sviluppo e test il fallback locale resta disponibile anche per le route
sensibili.

Il fallback residuo è per-instance: cold start, riavvii e scaling creano
contatori separati e permettono quindi di superare la quota globale distribuendo
richieste tra istanze. Non va descritto come protezione distribuita né
considerato lo stato finale, ma non protegge più le mutazioni auth elencate
sopra. Va rimosso non appena il provider runtime può consegnare token Redis e
chiave HMAC senza inserirli negli artifact.

Qualsiasi coppia Redis parziale, configurazione invalida, IP non attendibile,
timeout, errore dello store o risposta malformata causa invece una risposta 503
`no-store`: non avviene mai un fallback da Redis guasto alla memoria locale.

## Variabili server-only per la modalità Redis

| Variabile | Vincolo |
|---|---|
| `RATE_LIMIT_REDIS_REST_URL` | Origin HTTPS senza path/porta/credenziali/query/fragment; host `*.upstash.io` o allowlist esatta |
| `RATE_LIMIT_REDIS_REST_TOKEN` | Bearer token dedicato di almeno 32 byte (massimo 4096), con accesso solo al database/namespace del limiter |
| `RATE_LIMIT_KEY_SECRET` | Segreto casuale di almeno 32 byte, diverso da JWT/cookie/Redis token |
| `TRUSTED_CLIENT_IP_HEADER` | Override opzionale: header inserito e sovrascritto dall'edge (`cloudfront-viewer-address`, `cf-connecting-ip` o `x-vercel-forwarded-for`) |

Per compatibilità transitoria sono accettati
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` quando le variabili
`RATE_LIMIT_*` dedicate sono entrambe assenti. Non configurare metà di una
coppia: il limiter la considera un errore e fallisce chiuso.

Su Amplify/CloudFront, se entrambi gli override sono assenti, il codice usa
l'elemento più a destra di `X-Forwarded-For`: CloudFront aggiunge lì l'indirizzo
viewer, quindi un valore falsificato dal client a sinistra non cambia il bucket.
`TRUSTED_PROXY_HOPS` (intero 1-10) permette di contare da destra solo dopo aver
verificato la catena reale in staging. Un header/hop esplicitamente invalido,
una catena troppo corta o un IP malformato falliscono chiuso. L'origine non deve
essere raggiungibile direttamente aggirando CloudFront.

Variabili opzionali:

- `RATE_LIMIT_REDIS_ALLOWED_HOSTS`: hostname esatti, separati da virgola, per
  gateway approvati diversi da Upstash; non accetta wildcard. Un origin HTTPS
  bare con host `*.upstash.io` è ammesso senza allowlist, mentre ogni host custom
  deve comparire esattamente qui;
- `RATE_LIMIT_REDIS_PREFIX`: namespace Redis, default `brx:bff:rl:v1`, massimo
  64 caratteri `[A-Za-z0-9:_-]`;
- `RATE_LIMIT_REDIS_TIMEOUT_MS`: timeout 100-5000 ms, default 1500 ms.

Tutte le variabili sono server-only: non usare mai il prefisso `NEXT_PUBLIC_`.

## Requisiti dello store

- Endpoint REST capace di eseguire `EVAL` con formato comando JSON Redis
  (`["EVAL", script, 1, key, windowMs]`). Upstash Redis REST è compatibile; un
  cluster Valkey/ElastiCache richiede un gateway privato equivalente se il
  runtime Amplify non può aprire connessioni Redis dirette.
- TLS verificato, alta disponibilità e capacità dimensionata sul traffico BFF
  di picco. Il token non deve consentire comandi amministrativi.
- Nessuna eviction anticipata delle chiavi del limiter; monitorare errori,
  latenza p95/p99, connessioni, memoria, eviction e risposte 429/503.
- Il namespace può essere condiviso tra istanze/regioni solo se lo store è la
  fonte comune. Store separati per regione producono quote separate.

Le chiavi Redis contengono soltanto namespace, scope e HMAC-SHA-256 dell'IP. Le
chiavi del fallback locale usano SHA-256 one-way e non richiedono un segreto,
perché non lasciano il processo. IP e identificativi utente non vengono salvati
in chiaro. Il `sub` del JWT non entra nella chiave perché il BFF non ne verifica
localmente la firma: usarlo avrebbe permesso di cambiare soggetto e aggirare la
quota. La rotazione di `RATE_LIMIT_KEY_SECRET` cambia tutte le chiavi Redis e
azzera di fatto le finestre attive; eseguirla in una finestra controllata.

## Gate per rimuovere il fallback temporaneo

1. Rendere le variabili disponibili al runtime SSR tramite un canale segreti
   approvato, mai nel repository o in artifact accessibili a ruoli non fidati.
2. Verificare che l'header scelto sia sempre presente, sovrascritto dall'edge e
   non falsificabile; testare IPv4, IPv6 e catene `X-Forwarded-For` reali.
3. Eseguire 2× la quota con almeno due istanze concorrenti: devono passare
   esattamente le prime `limit` richieste e le altre devono ricevere 429.
4. Interrompere lo store e simulare timeout/risposte malformate: tutte le route
   protette devono ricevere 503, senza passare la richiesta agli upstream.
5. Controllare TTL ed eviction nel namespace; nessuna chiave deve restare senza
   scadenza. Verificare che log, metriche e dashboard non contengano IP, token o
   HMAC secret.
6. Configurare allarmi su 503 del limiter, aumento anomalo di 429, latenza e
   saturazione dello store; documentare escalation e rollback.

Il limiter applica attualmente la quota per IP verificato. Questo evita il
bypass tramite JWT non verificati, ma reti NAT molto grandi possono condividere
la stessa quota. Un futuro limite per utente richiede prima la verifica locale
del JWT (firma, issuer, audience, scadenza) o una sessione attestata dal backend;
non basta decodificare il payload.

## Vincolo Amplify Hosting da chiudere prima del lancio

Amplify Hosting non espone automaticamente le variabili della build al runtime
SSR. La procedura AWS basata su `.env.production` le inserisce negli artifact e
AWS raccomanda esplicitamente di non usarla per credenziali o dati sensibili:
[AWS — SSR environment variables](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html).

Di conseguenza, non aggiungere il token Redis o `RATE_LIMIT_KEY_SECRET` ad
`amplify.yml` con `env`, `echo`, `grep` o redirezioni verso `.env.production`.
Prima del go-live occorre scegliere e validare una delle seguenti opzioni:

- un runtime BFF che supporti secret injection al momento dell'esecuzione;
- un adapter revisionato che usi l'`SSR Compute role` di Amplify per leggere i
  segreti da AWS Secrets Manager/SSM senza scriverli negli artifact;
- un servizio AWS privato/IAM-authenticated che esponga esclusivamente
  l'operazione atomica di rate limit al compute SSR.

### Gate P0: SSR Compute role e provider runtime

L'implementazione corrente legge segreti dal runtime ma non include ancora un
adapter Secrets Manager/SSM. Prima del lancio occorre completare e rendere
bloccante questo runbook:

1. associare il Compute role esclusivamente al branch Amplify `prod`; nessun
   ruolo su preview/PR e nessuna credenziale AWS statica;
2. concedere soltanto `secretsmanager:GetSecretValue` (oppure
   `ssm:GetParameter`) sugli ARN esatti del token Redis e della chiave HMAC,
   più `kms:Decrypt` sulla singola KMS key. Vietare wildcard, `ListSecrets`,
   `GetParametersByPath` e accesso ai segreti Auth/DB;
3. implementare un provider `server-only` che legge a runtime con deadline
   totale, valida formato/versione, usa una cache in memoria bounded con TTL
   breve e non serve indefinitamente valori stale. Primo caricamento o refresh
   fallito deve produrre 503 `no-store` senza contattare Redis/upstream;
4. supportare rotazione con due versioni per una finestra controllata, azzerare
   la cache alla promozione e verificare che nessun valore compaia in log,
   tracing, errori o artifact;
5. nel job di rilascio eseguire `iam:SimulatePrincipalPolicy`: gli ARN esatti
   devono risultare `allowed`, mentre un segreto runtime sentinella, il parent
   path e le operazioni di elenco non devono esserlo;
6. in staging, con almeno due istanze SSR, provare cold start, rotazione,
   throttling/timeout AWS, KMS deny e secret malformato; controllare CloudTrail,
   metriche 503 e rollback prima della promozione.

Finché provider, policy IAM e prove staging non sono verdi, non configurare
parzialmente Redis e non incorporare credenziali negli artifact o in
`.env.production`: la configurazione parziale produce intenzionalmente 503. Il
fallback in memoria mantiene disponibili soltanto le route non sensibili; le
mutazioni auth elencate sopra falliscono chiuse. Il rischio per-instance residuo
resta accettato e temporaneo; il completamento di questo runbook deve
disattivare e poi rimuovere la modalità di compatibilità.

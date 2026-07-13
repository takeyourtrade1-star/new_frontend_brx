# Piano 15 — Backend registrazione e verifica email

> Destinatari: team backend/auth, DevOps e security review.
> Coordinamento frontend: team `new_frontend_brx`.
> Scritto il 2026-07-13 dopo la ricognizione del flusso frontend esistente.

---

## Riassunto esecutivo

1. Oggi il frontend esegue `POST /api/auth/register` e, in assenza di token nella risposta, **presume** che sia stata inviata un'email. Non riceve alcuna conferma esplicita di invio.
2. Il backend deve diventare l'unica fonte di verità per stato account, challenge di verifica e stato tecnico dell'email.
3. Una registrazione valida crea un account `PENDING_EMAIL_VERIFICATION`, una challenge monouso e un messaggio nella **transactional outbox**, nella stessa transazione DB.
4. L'email viene inviata da un worker asincrono. Il path HTTP di registrazione non attende il provider email.
5. L'email contiene un link e un codice alternativo; entrambi consumano la stessa challenge e l'uso di uno invalida l'altro.
6. Token e codice sono monouso, a scadenza breve, limitati nei tentativi e mai salvati o loggati in chiaro.
7. Il contratto API restituisce stati espliciti (`verification_pending`, `verified`, `expired`, ecc.), senza deduzioni basate sulla presenza di token.
8. Amazon SES deve pubblicare eventi di invio, consegna, ritardo, bounce, complaint e rendering failure verso EventBridge/SNS.
9. Il frontend riceverà OpenAPI, catalogo errori, esempi e ambiente staging prima di iniziare il wiring definitivo.
10. Il rollout avviene dietro feature flag, con migrazione degli account pending esistenti, dashboard e runbook operativo.

---

## 1. Problema da risolvere

Il frontend attuale tratta qualunque risposta 2xx di registrazione priva di `access_token` e `refresh_token` al primo livello come prova che sia necessaria la verifica email. Mostra quindi un messaggio di successo e reindirizza l'utente, anche se:

- il backend non ha tentato alcun invio;
- il provider ha rifiutato il messaggio;
- la risposta contiene token in una struttura annidata;
- la registrazione ha creato soltanto un utente senza challenge;
- l'email è in coda ma non ancora accettata dal provider;
- l'indirizzo è già associato a un account esistente.

Il repository frontend espone nel BFF i path `verify-email` e `resend-verification`, ma non esiste oggi un contratto completo né un flusso di registrazione che li utilizzi.

### Obiettivo

Realizzare un flusso di registrazione verificabile, sicuro, osservabile e idempotente:

`registrazione → account pending → email in outbox → invio provider → verifica link/codice → account active → sessione`

### Fuori scope

- MFA/TOTP dopo il primo login;
- recupero password e login passwordless, che restano flussi distinti;
- verifica KYC del venditore;
- marketing email e newsletter;
- cambio email di un account già attivo, che richiede un piano separato;
- redesign grafico del frontend.

---

## 2. Decisioni architetturali

| # | Decisione | Motivazione |
|---|---|---|
| **D1** | Il backend è l'unica fonte di verità dello stato di verifica | Il client non può sapere se il provider abbia accettato o consegnato l'email. |
| **D2** | Account iniziale `PENDING_EMAIL_VERIFICATION`; nessuna sessione ordinaria prima della verifica | Impedisce di usare funzionalità protette con un'identità email non verificata. |
| **D3** | Registrazione, challenge e outbox vengono create nella stessa transazione DB | Evita account pending senza messaggio da inviare e messaggi senza account. |
| **D4** | Invio asincrono tramite transactional outbox + worker | La disponibilità e latenza del provider non devono determinare l'esito della registrazione HTTP. |
| **D5** | Link e codice sono due credenziali della stessa challenge | Migliore UX cross-device senza creare due processi di attivazione divergenti. |
| **D6** | La challenge è monouso; resend invalida la precedente | Riduce replay e ambiguità su quale codice sia valido. |
| **D7** | Risposte API con stati discriminati e schema OpenAPI | Il frontend non deve inferire semantica dalla forma accidentale della risposta. |
| **D8** | Stato email separato dallo stato account | `provider_accepted` o `delivered` non equivalgono ad account verificato. |
| **D9** | Il link apre una pagina e viene consumato con `POST`, non con il primo `GET` | I sistemi antispam possono pre-aprire i link presenti nelle email. |
| **D10** | Rate limiting multilivello e risposte anti-enumerazione | Registrazione, verifica e resend sono endpoint pubblici ad alto rischio di abuso. |

### Scelta consigliata sull'enumerazione account

Per email sintatticamente valide, `register` e `resend` restituiscono una risposta generica `202 Accepted`, anche quando l'indirizzo è già attivo. Se l'account è già attivo, il backend può inviare una notifica di sicurezza con link al login, ma non deve rivelare pubblicamente l'esistenza dell'account.

Gli username sono pubblici: è accettabile rispondere `USERNAME_UNAVAILABLE`, purché il comportamento sia concordato e documentato. Per l'email usare sempre copy generico, per esempio: “Se l'indirizzo può essere registrato, riceverai un'email con le istruzioni”.

---

## 3. Macchine a stati

### Account

```text
PENDING_EMAIL_VERIFICATION ──verify──> ACTIVE
            │
            ├──cleanup TTL──> DELETED/ANONYMIZED
            └──admin────────> DISABLED
```

Regole:

- solo `ACTIVE` può ottenere una sessione ordinaria;
- una challenge scaduta non cambia automaticamente lo stato dell'account;
- resend crea una nuova challenge per lo stesso account pending;
- un account già `ACTIVE` non torna pending tramite questo flusso;
- la transizione ad `ACTIVE` e il consumo della challenge avvengono nella stessa transazione.

### Challenge

```text
PENDING ──verify──> CONSUMED
   │
   ├──TTL────────> EXPIRED
   ├──resend─────> INVALIDATED
   └──max tries──> LOCKED
```

### Messaggio email

```text
QUEUED → PROCESSING → PROVIDER_ACCEPTED → DELIVERED
   │          │                │
   │          ├──retry─────────┘
   │          └──FAILED/DEAD_LETTER
   └───────────────────────────> RENDER_FAILED

PROVIDER_ACCEPTED → DELIVERY_DELAYED | BOUNCED | COMPLAINED | REJECTED
```

`PROVIDER_ACCEPTED` significa soltanto che SES ha accettato la richiesta di invio. Non deve essere tradotto in “consegnata”.

---

## 4. Modello dati

Adattare nomi, tipi e convenzioni alle tabelle esistenti del servizio auth. Migrazione tramite Alembic, se confermato lo stack FastAPI/SQLAlchemy/PostgreSQL.

### Modifiche a `users`

| Campo | Tipo indicativo | Note |
|---|---|---|
| `account_status` | enum/string | Aggiungere o confermare `PENDING_EMAIL_VERIFICATION`, `ACTIVE`, `DISABLED`. |
| `email_normalized` | string indicizzata | Valore normalizzato usato per unicità e confronto; conservare separatamente l'email di display. |
| `email_verified_at` | timestamptz nullable | Fonte di verità della verifica. |
| `email_deliverability_status` | enum/string nullable | `unknown`, `ok`, `hard_bounced`, `complained`, `suppressed`. Non coincide con `account_status`. |
| `pending_cleanup_at` | timestamptz nullable | Data oltre la quale un account non verificato può essere eliminato/anonimizzato. |

Vincoli:

- unique index su `email_normalized` secondo la policy di normalizzazione approvata;
- `email_verified_at IS NOT NULL` coerente con `account_status = ACTIVE`;
- nessuna normalizzazione provider-specifica aggressiva (`+tag`, punti Gmail, ecc.) senza decisione security esplicita.

### `email_verification_challenges`

| Campo | Tipo indicativo | Note |
|---|---|---|
| `id` | UUID PK | Identificatore interno challenge. |
| `public_flow_id` | UUID/ULID unique | Identificatore opaco restituibile al client; non contiene PII. |
| `user_id` | UUID FK | Account pending. |
| `email_snapshot` | string | Snapshot dell'indirizzo destinatario; accesso limitato. |
| `code_digest` | bytes/string | HMAC/derivazione del codice con secret server-side, mai codice in chiaro. |
| `link_token_digest` | bytes/string | SHA-256/HMAC del token casuale ad alta entropia. |
| `secret_payload_ciphertext` | bytes nullable | Codice/link cifrati con KMS/envelope encryption per il worker; eliminare dopo l'invio. |
| `status` | enum/string | `PENDING`, `CONSUMED`, `EXPIRED`, `INVALIDATED`, `LOCKED`. |
| `attempts_used`, `max_attempts` | integer | Default raccomandato: massimo 5 tentativi. |
| `expires_at` | timestamptz | Default raccomandato: 20 minuti, configurabile. |
| `resend_available_at` | timestamptz | Fonte server del countdown frontend. |
| `consumed_at`, `invalidated_at`, `locked_at` | timestamptz nullable | Audit stato. |
| `created_at`, `updated_at` | timestamptz | |

Indici:

- unique su `public_flow_id`;
- indice su `(user_id, status)`;
- indice parziale sulle challenge `PENDING`;
- indice su `expires_at` per cleanup;
- al massimo una challenge `PENDING` per utente, tramite vincolo/lock applicativo coerente.

### `transactional_email_outbox`

| Campo | Tipo indicativo | Note |
|---|---|---|
| `id` | UUID/BigInt PK | Usato anche come correlation ID/tag provider. |
| `aggregate_type`, `aggregate_id` | string + UUID | `email_verification` + challenge id. |
| `event_type` | string | `registration_verification`. |
| `template_name`, `template_version`, `locale` | string | Template versionato e localizzato. |
| `recipient_ciphertext` | bytes | Destinatario cifrato o recuperabile dall'aggregate con accesso controllato. |
| `payload_ciphertext` | bytes | Variabili sensibili cifrate; nessun segreto in JSON leggibile. |
| `status` | enum/string | Stati del messaggio descritti sopra. |
| `attempt_count`, `max_attempts` | integer | Retry controllati. |
| `next_attempt_at`, `locked_at`, `locked_by` | timestamptz/string | Claim concorrente del worker. |
| `provider`, `provider_message_id` | string nullable | Correlazione con SES. |
| `last_error_code`, `last_error_summary` | string nullable | Informazioni sanificate, senza PII/segreti. |
| `accepted_at`, `delivered_at`, `bounced_at`, `complained_at` | timestamptz nullable | Eventi provider. |
| `created_at`, `updated_at` | timestamptz | |

Il worker deve usare claim concorrenti (`SELECT ... FOR UPDATE SKIP LOCKED` o equivalente) e consegna **at-least-once**. Un crash tra invio e update DB può produrre una mail duplicata: il contenuto deve restare idempotente e usare la stessa challenge. Il worker deve verificare che la challenge sia ancora valida prima di inviare un record rimasto in coda.

### Event log opzionale ma raccomandato

`email_delivery_events`: append-only, con `outbox_id`, tipo evento provider, timestamp provider, payload sanificato e hash/id evento per deduplica. La tabella outbox mantiene lo stato corrente; l'event log conserva la storia utile al supporto.

---

## 5. Contratto API v1

Pubblicare lo schema OpenAPI e generare esempi verificabili. Tutte le risposte devono essere `Cache-Control: no-store` e includere `X-Request-ID`.

### 5.1 Registrazione

`POST /api/auth/register`

Request: mantiene i campi applicativi già concordati (`username`, `email`, `password`, tipo account, paese, telefono e consensi), più:

- `locale` per il template email;
- `idempotency_key` via header `Idempotency-Key`;
- honeypot/risk signals già esistenti, senza fidarsi del client.

Risposta raccomandata: `202 Accepted`.

```json
{
  "status": "verification_pending",
  "flow_id": "01J...",
  "destination": "m***@example.com",
  "expires_at": "2026-07-13T14:20:00Z",
  "resend_available_at": "2026-07-13T14:01:00Z",
  "delivery_status": "queued"
}
```

Semantica:

- `queued` significa che il record outbox è stato creato;
- non restituire `delivered` nella risposta sincrona;
- non restituire access/refresh token;
- retry con lo stesso `Idempotency-Key` restituisce lo stesso risultato logico;
- email già attiva: risposta pubblica coerente con la policy anti-enumerazione.

### 5.2 Verifica tramite codice

`POST /api/auth/verify-email/code`

```json
{
  "flow_id": "01J...",
  "code": "483921"
}
```

Risposta `200 OK`:

```json
{
  "status": "verified",
  "verified_at": "2026-07-13T14:04:12Z",
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

Se la policy finale non prevede auto-login, sostituire `session` con `next_action: "login"`. La scelta deve essere congelata prima del wiring frontend; raccomandazione prodotto: auto-login dopo verifica riuscita, salvo vincoli security differenti.

### 5.3 Verifica tramite link

`POST /api/auth/verify-email/token`

```json
{
  "flow_id": "01J...",
  "token": "opaque-high-entropy-token"
}
```

Il link email deve aprire una pagina frontend, idealmente con token nel fragment URL (`#token=...`) per non inviarlo nei normali log HTTP/referrer. La pagina mostra una conferma e invia il `POST`. Non consumare la challenge con un semplice `GET`.

### 5.4 Reinvio

`POST /api/auth/resend-verification`

```json
{
  "flow_id": "01J..."
}
```

Risposta `202 Accepted`:

```json
{
  "status": "verification_pending",
  "flow_id": "01J-new...",
  "destination": "m***@example.com",
  "expires_at": "2026-07-13T14:30:00Z",
  "resend_available_at": "2026-07-13T14:11:00Z",
  "delivery_status": "queued"
}
```

Il resend deve:

1. lockare account e challenge corrente;
2. verificare cooldown e quota;
3. invalidare la challenge precedente;
4. creare nuova challenge + nuova outbox nella stessa transazione;
5. restituire un nuovo `flow_id`.

### 5.5 Stato del flusso — opzionale

`GET /api/auth/verification-status/{flow_id}`

Serve soltanto se il frontend deve recuperare lo stato dopo refresh o mostrare un errore di consegna noto. Non esporre dettagli provider sensibili.

```json
{
  "status": "verification_pending",
  "delivery_status": "provider_accepted",
  "destination": "m***@example.com",
  "expires_at": "...",
  "resend_available_at": "..."
}
```

Valori pubblici ammessi per `delivery_status`: `queued`, `sending`, `provider_accepted`, `delayed`, `failed`. `delivered` può essere esposto solo chiarendo che indica consegna al server destinatario, non lettura da parte dell'utente.

### Catalogo errori

Formato comune:

```json
{
  "detail": "Operazione non completata",
  "code": "VERIFICATION_INVALID_OR_EXPIRED",
  "request_id": "...",
  "retry_after_seconds": 60
}
```

Codici minimi:

- `REGISTER_INVALID_REQUEST` — 422;
- `USERNAME_UNAVAILABLE` — 409, se la policy lo consente;
- `REGISTER_RATE_LIMITED` — 429;
- `VERIFICATION_INVALID_OR_EXPIRED` — 400/422, messaggio unico;
- `VERIFICATION_TOO_MANY_ATTEMPTS` — 429;
- `VERIFICATION_RESEND_TOO_EARLY` — 429;
- `VERIFICATION_ALREADY_COMPLETED` — 200 idempotente o errore documentato;
- `VERIFICATION_DELIVERY_BLOCKED` — 409 per hard bounce/suppression, solo quando non introduce enumerazione;
- `AUTH_SERVICE_UNAVAILABLE` — 503.

Non differenziare pubblicamente “codice errato”, “flow inesistente” e “challenge scaduta” se la differenza facilita enumerazione o probing. I log interni possono conservare il motivo tecnico sanificato.

---

## 6. Flussi transazionali

### 6.1 Registrazione

1. Validare formato, policy password, consensi e honeypot.
2. Applicare rate limit/risk scoring prima delle operazioni costose.
3. Normalizzare email secondo policy unica e documentata.
4. Aprire transazione DB.
5. Lockare o risolvere l'eventuale account con la stessa email normalizzata.
6. Se nuovo: creare `users` in `PENDING_EMAIL_VERIFICATION`.
7. Se pending: invalidare eventuale challenge precedente secondo policy/idempotency.
8. Generare codice e token con CSPRNG.
9. Salvare digest e materiale cifrato a breve vita.
10. Creare record outbox `QUEUED` con template/versione/locale.
11. Commit.
12. Restituire `202 verification_pending`.

Se il commit fallisce, non deve esistere alcun job email. Se il provider è indisponibile dopo il commit, il worker ritenta senza perdere la registrazione.

### 6.2 Consumo challenge

1. Rate limit per IP, flow e account.
2. Aprire transazione e lockare challenge + user.
3. Verificare stato, scadenza e numero tentativi.
4. Confrontare digest in modo sicuro.
5. In caso di fallimento incrementare `attempts_used` atomicamente; al limite passare a `LOCKED`.
6. In caso di successo impostare challenge `CONSUMED`, `email_verified_at` e account `ACTIVE` nella stessa transazione.
7. Invalidare tutte le altre challenge pending dell'utente.
8. Commit.
9. Emettere sessione o `next_action=login` secondo contratto definitivo.
10. Pubblicare evento audit `email_verified` post-commit.

Due richieste simultanee devono produrre una sola transizione; la seconda deve ricevere un risultato idempotente e non una seconda sessione illimitata.

### 6.3 Cleanup

Job schedulato, idempotente e a batch:

- marca `EXPIRED` le challenge oltre TTL;
- elimina materiale cifrato non più necessario;
- elimina/anonimizza account pending oltre la retention approvata;
- mantiene audit minimo secondo privacy e compliance;
- elimina payload outbox sensibili dopo retention breve;
- non elimina account attivi né eventi necessari a bounce/complaint handling.

---

## 7. Sicurezza

### Segreti

- link token: almeno 256 bit casuali;
- codice: 6 cifre solo se accompagnato da massimo tentativi e rate limit rigoroso; in alternativa 8 caratteri alfanumerici senza caratteri ambigui;
- digest con HMAC server-side/pepper per il codice, perché lo spazio di ricerca di un OTP breve è ridotto;
- chiavi in Secrets Manager/KMS, con rotazione e versionamento;
- payload outbox sensibile cifrato; cancellazione dopo invio/expiry;
- mai token, codice, password o URL completo nei log, tracing, error reporting o analytics.

### Rate limit iniziali raccomandati

Valori configurabili e da tarare con metriche:

| Operazione | Limite indicativo |
|---|---|
| Register per IP | 5 / 15 minuti, burst controllato |
| Register per email normalizzata | 3 / ora |
| Verify per challenge | massimo 5 tentativi totali |
| Verify per IP | 30 / 15 minuti |
| Resend | cooldown 60 secondi, massimo 5 / 24 ore per account/email |

Usare Redis per finestre temporali e DB per limiti che devono sopravvivere a restart o eviction. Definire comportamento fail-closed/fail-open: raccomandazione fail-closed per resend e tentativi OTP quando Redis non è disponibile.

### Controlli aggiuntivi

- CAPTCHA/risk challenge soltanto dopo segnali anomali, non obbligatorio per tutti;
- protezione CSRF se gli endpoint usano cookie ambient authority;
- CORS ristretto e BFF come unico ingresso browser;
- `Cache-Control: no-store` su tutte le risposte;
- `Referrer-Policy: no-referrer` sulla pagina di verifica;
- nessuna risorsa third-party sulla pagina contenente il token;
- audit di modifiche di stato con actor, request ID e motivo;
- email mascherate nei log (`m***@example.com`) o pseudonimizzate;
- controllo costante dei tempi di risposta per ridurre side channel di enumerazione;
- consensi legali salvati con versione documento, timestamp e fonte, separati dalla challenge.

Riferimento security: [OWASP Email Validation and Verification Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html).

---

## 8. Pipeline email e Amazon SES

### Worker

- polling/consumer separato dal processo HTTP;
- claim atomico dei record outbox;
- timeout espliciti verso SES;
- exponential backoff con jitter;
- numero massimo tentativi e dead-letter queue;
- idempotenza applicativa tramite `outbox_id` come tag/correlation ID;
- verifica della challenge prima dell'invio per evitare email obsolete;
- metriche per coda, retry, latenza e dead-letter;
- nessun log del body email o dei segreti.

### Configurazione SES

- account fuori sandbox nella region corretta;
- dominio mittente verificato;
- SPF, DKIM e DMARC configurati e monitorati;
- MAIL FROM domain personalizzato se previsto;
- Configuration Set applicato a **ogni** email di verifica;
- tag `environment`, `template`, `template_version`, `outbox_id`;
- eventi SES verso EventBridge/SNS;
- handler idempotente degli eventi con deduplica;
- suppression list e bounce/complaint policy documentate.

Eventi minimi da gestire:

- `Send`/`Email Sent` → `PROVIDER_ACCEPTED`;
- `Delivery` → `DELIVERED`;
- `DeliveryDelay` → `DELIVERY_DELAYED`;
- `Bounce` hard → `BOUNCED` + deliverability `hard_bounced`;
- `Complaint` → `COMPLAINED` + soppressione di ulteriori invii non indispensabili;
- `Reject` → `REJECTED`;
- `Rendering Failure` → `RENDER_FAILED` e allarme immediato.

Riferimenti operativi: [Amazon SES EventBridge events](https://docs.aws.amazon.com/ses/latest/dg/monitoring-eventbridge.html) e [SES bounce/complaint notifications](https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity-using-notifications.html).

### Template

Il template deve includere:

- brand e mittente riconoscibili;
- motivo dell'email;
- CTA di verifica;
- codice alternativo;
- scadenza chiara;
- indicazione “se non hai richiesto tu la registrazione, ignora questa email”;
- link al supporto senza includere dati sensibili;
- versione HTML e text/plain;
- localizzazione coerente col `locale` ricevuto/risolto dal backend.

Testare rendering e link per tutte le lingue supportate dal prodotto. Il backend deve definire fallback `en` o `it` concordato con il frontend.

---

## 9. Osservabilità e runbook

### Metriche

- `registration_attempts_total` per esito tecnico;
- `pending_accounts_total`;
- `verification_challenges_created_total`;
- `verification_attempts_total` per outcome;
- `verification_completed_total`;
- `verification_time_seconds` p50/p95/p99;
- `email_outbox_depth` e age del record più vecchio;
- `email_send_attempts_total`;
- `email_provider_accepted_total`;
- `email_delivered_total`;
- `email_delayed_total`;
- `email_bounced_total`;
- `email_complaints_total`;
- `email_render_failures_total`;
- `email_dead_letter_total`.

### Correlazione

Usare lo stesso `request_id`/`correlation_id` lungo:

`register request → user/challenge → outbox → SES message id → provider event → verify request`

Non usare email, codice o token come chiave di correlazione nei log.

### Alert minimi

- outbox più vecchia oltre 2–5 minuti;
- dead-letter > 0;
- rendering failure > 0;
- calo significativo di `provider_accepted / queued`;
- aumento bounce/complaint rispetto alla baseline;
- conversione verifica sotto soglia;
- picco rate limit o tentativi OTP falliti;
- account pending in crescita senza verifiche.

### Runbook

Documentare procedure per:

- SES sandbox/quota/sending disabled;
- identità dominio o DKIM non validi;
- Configuration Set mancante;
- coda bloccata;
- template non renderizzabile;
- hard bounce e suppression list;
- complaint;
- rotazione chiavi HMAC/KMS;
- replay sicuro della dead-letter queue;
- ricerca supporto tramite `request_id`/`flow_id`, senza accedere al token.

---

## 10. Coordinamento con il frontend

Il team backend deve consegnare prima del wiring:

1. OpenAPI versionata degli endpoint v1.
2. JSON Schema o tipi generabili per tutte le risposte.
3. Catalogo errori con status HTTP e semantica retry.
4. Decisione definitiva su auto-login dopo verifica.
5. Policy anti-enumerazione definitiva.
6. TTL, tentativi massimi, cooldown e quote resend restituiti dal server.
7. Ambiente staging con SES simulator/provider di test.
8. Caselle/test fixture o endpoint interno per recuperare il codice esclusivamente in test.
9. Esempi curl/Postman senza segreti reali.
10. Changelog del contratto e referente backend per la fase E2E.

### Aspettative verso il BFF/frontend

Il backend può assumere che il frontend:

- chiami il servizio auth solo tramite route handler BFF;
- non mostri “email consegnata” sulla sola risposta `queued`;
- navighi a una pagina dedicata `/registrati/verifica` dopo `verification_pending`;
- usi `flow_id`, mai email come identificatore del flusso;
- usi `resend_available_at` server-side, non un cooldown inventato localmente;
- gestisca refresh pagina e link email;
- non persista token/codici in localStorage;
- invii link token/codice tramite body `POST`;
- supporti paste e `autocomplete="one-time-code"`;
- traduca i messaggi UX, mentre i `code` API restano stabili e non localizzati;
- elimini l'attuale deduzione “assenza token = verifica email richiesta”.

### Contract tests condivisi

Conservare fixture JSON versionate per:

- registrazione `verification_pending`;
- resend riuscito;
- challenge scaduta;
- tentativi esauriti;
- verifica riuscita con sessione;
- verifica già completata;
- rate limit con `retry_after_seconds`;
- delivery delayed/failed;
- risposta anti-enumerazione per account già attivo.

Una modifica incompatibile richiede nuova versione API o periodo di compatibilità; non cambiare silenziosamente wrapper o posizione dei token.

---

## 11. Test backend

### Unit test

- normalizzazione email e policy di confronto;
- generazione token/codice;
- digest e verifica;
- scadenza e tentativi;
- mapping stati challenge/account/email;
- policy resend;
- rendering template per locale e fallback;
- sanitizzazione log/errori;
- mapping eventi SES.

### Integration test con DB/Redis reali

- creazione atomica user + challenge + outbox;
- rollback totale in caso di errore;
- idempotenza register con stesso `Idempotency-Key`;
- unique email sotto due registrazioni concorrenti;
- due verifiche simultanee: una sola consuma la challenge;
- verify vs resend simultanei;
- resend invalida la challenge precedente;
- incremento tentativi atomico;
- cleanup non elimina account attivi;
- worker concorrenti non processano due volte lo stesso record nello stesso claim;
- evento SES duplicato non duplica gli effetti.

### API/security test

- payload mancanti, troppo grandi o malevoli;
- rate limit IP/email/flow;
- account enumeration e timing ragionevolmente uniforme;
- codice/token non presenti in log catturati;
- CSRF/CORS secondo il modello cookie/BFF;
- cache headers `no-store`;
- flow inesistente, scaduto, bloccato e consumato;
- replay di token e codice;
- sessione non emessa prima della verifica;
- account disabilitato non riattivabile via challenge.

### Email test

- HTML + text/plain;
- link corretti per staging/production;
- tutte le lingue e fallback;
- rendering failure;
- provider timeout/retry;
- bounce, complaint, reject, delivery delay;
- deduplica webhook/eventi;
- dead-letter e replay.

### End-to-end

1. Nuovo utente si registra.
2. API restituisce `verification_pending`.
3. Outbox viene processata.
4. Email compare nel provider di test.
5. Verifica tramite codice → account active + sessione.
6. Ripetizione tramite link su un secondo account.
7. Resend invalida il vecchio codice/link.
8. Refresh pagina mantiene il flusso tramite `flow_id`/cookie pending.
9. Nessuna email → UI consente resend secondo cooldown server.
10. Account già attivo non viene enumerato.

---

## 12. Migrazione e compatibilità

Prima della migrazione produrre un report read-only:

- account attivi senza `email_verified_at`;
- account pending esistenti;
- duplicati dopo normalizzazione;
- valori reali di `account_status`;
- eventuali token di verifica legacy;
- provider email e configurazione oggi in uso.

Strategia raccomandata:

1. Migrazione additiva di colonne/tabelle.
2. Deploy backend compatibile col vecchio frontend.
3. Backfill conservativo: non marcare automaticamente “non verificati” account storici già operativi senza decisione business.
4. Abilitare nuova pipeline solo per nuove registrazioni dietro feature flag.
5. Consegnare contratto staging al frontend.
6. Abilitare nuova UI su percentuale limitata.
7. Monitorare invio e conversione.
8. Rimuovere il percorso legacy dopo finestra di stabilità e rollback.

Rollback:

- feature flag disabilita nuove challenge senza rimuovere le tabelle;
- non eseguire migrazioni distruttive nello stesso rilascio;
- mantenere worker e verify attivi abbastanza a lungo da consumare challenge già emesse;
- documentare come svuotare o mettere in pausa l'outbox senza perdere record.

---

## 13. Fasi di implementazione

### Fase 0 — Discovery e contract freeze

- verificare implementazione auth corrente, provider e deploy;
- decidere auto-login, policy anti-enumerazione, TTL e retention;
- produrre OpenAPI/ADR e threat model breve;
- concordare esempi con il frontend.

**Criterio di uscita:** ADR approvato da backend, frontend e security; contratto v1 congelato.

### Fase 1 — Modello dati e dominio

- migrazione additiva;
- repository/service challenge;
- stati e transazioni;
- idempotenza;
- cleanup;
- unit e integration test DB.

**Criterio di uscita:** challenge atomiche, concorrenza coperta, nessun invio email ancora necessario.

### Fase 2 — Outbox, worker e SES

- outbox transazionale;
- cifratura payload;
- worker/retry/dead-letter;
- template;
- SES Configuration Set ed eventi;
- metriche e dashboard base.

**Criterio di uscita:** registrazione staging produce email tracciabile da outbox a evento provider.

### Fase 3 — API pubbliche e security hardening

- register v1;
- verify code/token;
- resend;
- status opzionale;
- rate limit, anti-enumeration, CSRF/CORS;
- catalogo errori e OpenAPI finale.

**Criterio di uscita:** suite API/security verde e contract fixture consegnate al frontend.

### Fase 4 — Integrazione frontend E2E

- ambiente staging stabile;
- supporto al team frontend durante wiring BFF/React Query/UI;
- contract test condivisi;
- test link/codice/resend/refresh;
- verifica delle sessioni dopo attivazione.

**Criterio di uscita:** percorso completo senza messaggi ottimistici e senza chiamate dirette browser→microservizio.

### Fase 5 — Rollout e operations

- feature flag progressiva;
- alert e runbook;
- canary registrazioni controllate;
- monitoraggio conversione/bounce/complaint;
- review security finale;
- rimozione legacy dopo finestra di stabilità.

**Criterio di uscita:** metriche stabili, nessuna dead-letter non gestita, rollback provato.

Stima indicativa backend+infra: **3–4 settimane** con un backend engineer e supporto DevOps/security, escluso il lavoro frontend. Ricalibrare dopo Fase 0.

---

## 14. Criteri di accettazione finali

### Funzionali

- [ ] Una registrazione valida crea account pending, challenge e outbox atomicamente.
- [ ] Nessuna sessione ordinaria viene emessa prima della verifica.
- [ ] L'email contiene link e codice validi e localizzati.
- [ ] Codice e link sono monouso e mutuamente invalidanti.
- [ ] Il resend invalida la challenge precedente e rispetta cooldown/quota.
- [ ] La verifica attiva l'account e produce la sessione/next action concordata.
- [ ] Retry e doppi click non creano account, challenge o sessioni duplicate.
- [ ] Account già attivi seguono la policy anti-enumerazione approvata.

### Sicurezza

- [ ] Token/codici non sono salvati in chiaro né presenti nei log.
- [ ] Challenge scadute, bloccate o consumate non sono riutilizzabili.
- [ ] Rate limit per IP, email e flow è attivo e testato.
- [ ] CORS/CSRF/cookie model è stato revisionato.
- [ ] La pagina link non consuma token via GET.
- [ ] I dati personali nei log sono mascherati/pseudonimizzati.
- [ ] Threat model e security review sono approvati.

### Affidabilità email

- [ ] Outbox e worker supportano retry, jitter e dead-letter.
- [ ] SES è fuori sandbox e dominio/SPF/DKIM/DMARC sono configurati.
- [ ] Configuration Set è applicato a ogni email.
- [ ] Delivery, delay, bounce, complaint, reject e rendering failure sono acquisiti.
- [ ] Eventi provider duplicati sono idempotenti.
- [ ] Esiste un runbook provato per coda bloccata e SES unavailable.

### Contratto e qualità

- [ ] OpenAPI e catalogo errori sono versionati.
- [ ] Contract fixture sono condivise col frontend.
- [ ] Unit, integration, concurrency, security ed E2E test sono verdi.
- [ ] Dashboard e alert sono attivi prima del rollout completo.
- [ ] Migrazione e rollback sono provati in staging.
- [ ] Il frontend non deve più dedurre lo stato dalla presenza/assenza dei token.

---

## 15. Domande da chiudere in Fase 0

| Domanda | Default raccomandato |
|---|---|
| Auto-login dopo verifica? | Sì, sessione emessa una sola volta dopo attivazione. |
| Codice a 6 cifre o alfanumerico? | 6 cifre per UX, max 5 tentativi, TTL 20 minuti e rate limit rigoroso. |
| Link e codice entrambi? | Sì, stessa challenge. |
| Cooldown resend? | 60 secondi, max 5/24h. |
| Retention account pending? | 72 ore, poi eliminazione/anonimizzazione secondo compliance. |
| Email già attiva? | Risposta pubblica generica 202 + eventuale email di sicurezza/login. |
| Username già usato? | `409 USERNAME_UNAVAILABLE`, essendo identificatore pubblico. |
| Provider? | Amazon SES con outbox astratta dal provider. |
| Stato pubblico delivery? | Esporre al massimo `queued/provider_accepted/delayed/failed`; copy prudente. |
| Endpoint status? | Sì se serve recovery dopo refresh; altrimenti flow mantenuto dal BFF. |

Il team backend deve riportare nel documento/ADR le decisioni definitive prima di cambiare il contratto API.


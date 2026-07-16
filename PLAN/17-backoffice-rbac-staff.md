# Piano 17 — Back office staff, ruoli e permessi

> Destinatari: backend Auth, microservizi BRX, frontend back office, DevOps e security review.
> Priorità: **critica**. La sicurezza viene prima della velocità di rilascio.
> Obiettivo: creare `staff.ebartex.com` come back office aziendale separato e governato da permessi centrali.
> Stato: progettazione completata; fondazione Auth validata localmente dietro feature flag, non distribuita.

---

## Stato implementazione — 2026-07-15

Completato localmente:

- piano, decisioni e threat model;
- feature flag Auth spenta per default;
- catalogo iniziale di 30 permessi atomici, senza wildcard;
- 11 ruoli di sistema separati per mansione;
- modelli per membership, ruoli, scope, assegnazioni, sessioni e audit;
- migrazione Alembic additiva con seed coerente al catalogo;
- linea Alembic `main` resa canonica senza riscrivere le revisioni già esistenti;
- migrazione ponte fail-closed per ricostruire da zero lo schema Auth corrente;
- tabelle staff escluse dal vecchio `create_all`: vengono create soltanto dalla migrazione;
- scope obbligatorio anche per gli accessi globali;
- refresh staff previsto soltanto come hash;
- test di invarianti del catalogo e del modello dati;
- ambiente test riproducibile, controllo automatico del drift e workflow CI;
- preflight solo in lettura e runbook per adottare Alembic sui database esistenti.

Verificato:

- suite Auth completa: 98 test passati, 2 saltati e zero warning;
- 12 test di invarianti RBAC inclusi nella suite;
- assenza di duplicati e wildcard nel catalogo;
- corrispondenza esatta tra catalogo e seed della migrazione;
- creazione completa da database vuoto fino alla revisione `006_staff_rbac` su PostgreSQL 16;
- upgrade, downgrade e nuovo upgrade dell'intera catena;
- parità tra schema Alembic e modelli applicativi, senza drift inatteso;
- seed reale verificato: 30 permessi, 11 ruoli, 72 legami e zero accessi preassegnati;
- rollback verificato: rimuove le 8 tabelle staff e conserva lo schema cliente;
- percorso database esistente verificato: `create_all`, preflight, stamp 005 e upgrade 006;
- preflight confermato realmente read-only: non crea neppure `alembic_version`;
- schemi sporchi, revisioni inattese e tabelle staff già presenti vengono rifiutati senza modifiche;
- la riparazione rifiuta una revisione 003 con utenti, evitando di inventare dati obbligatori;
- `git diff --check` sui repository interessati.

Ancora obbligatorio prima di chiudere la Fase 1:

- eseguire la nuova CI remota e mantenerla verde;
- security review indipendente di modelli, migrazioni e privilegi database;
- snapshot di staging con ripristino realmente provato;
- preflight read-only, migrazione e smoke test su staging durante una finestra senza scritture;
- verificare indici e query plan con volumi simili alla produzione;
- riallineare `dev` a `main`: database dev sacrificabile ricreato da zero, dati da conservare solo con migrazione dedicata;
- nessun deploy finché questi gate non sono verdi.

Decisione infrastrutturale:

- `main` è l'unica linea Alembic canonica;
- la storia esistente non viene riscritta: la revisione `003a_schema_repair` completa in modo additivo lo schema prima della 004;
- la vecchia baseline divergente di `dev` non viene unita né marcata come compatibile;
- un database esistente può essere adottato solo se il controllo strutturale lo riconosce equivalente alla revisione 005;
- feature flag staff ancora spenta e nessuna route staff esposta.

---

## 1. Risultato atteso

Ebartex avrà un'area interna separata dal marketplace, usata da:

- operatori BRX Express;
- supervisori degli hub;
- addetti alle segnalazioni;
- assistenza clienti;
- responsabili delle comunicazioni;
- amministratori degli accessi;
- auditor.

Ogni collaboratore vedrà e potrà usare soltanto ciò che serve al proprio lavoro.

Il modello sarà:

```text
identità staff
  + ruolo
  + permessi atomici
  + ambito operativo
  + regole sulla singola risorsa
  + audit obbligatorio
```

Esempio:

```text
Operatore Express
  + express.card.sort
  + hub:milano
  + solo lotti assegnati
```

---

## 2. Decisioni non negoziabili

| # | Decisione | Motivo |
|---|---|---|
| D1 | Nuova app su `staff.ebartex.com` | Isola back office, dipendenze, cookie, CSP e deploy. |
| D2 | Auth resta la fonte centrale di ruoli e permessi | Evita database e logiche diverse tra servizi. |
| D3 | Nessun nuovo microservizio dei permessi | Riduce costi, latenza e punti di guasto. |
| D4 | RBAC più ambiti e controllo della singola risorsa | Un ruolo da solo non basta per hub, code e casi assegnati. |
| D5 | Accesso negato per impostazione predefinita | Un nuovo endpoint staff nasce chiuso. |
| D6 | Ogni richiesta viene autorizzata dal backend | Menu e pagine nascoste non sono misure di sicurezza. |
| D7 | Nessun `is_admin` generale | Crea privilegi eccessivi e non scala con l'azienda. |
| D8 | Nessun permesso assegnato direttamente a una persona | I permessi passano sempre da un ruolo verificabile. |
| D9 | Sessione staff separata dalla sessione cliente | Un account cliente autenticato non diventa staff. |
| D10 | MFA obbligatoria per ogni membro dello staff | Il solo furto password non deve bastare. |
| D11 | Token staff mai disponibili al JavaScript | Riduce il rischio di furto tramite XSS. |
| D12 | Nessuna chiave tecnica inserita nel browser | Le chiavi interne restano server-side. |
| D13 | Revoca rapida e sessioni brevi | Un licenziamento o incidente deve chiudere presto l'accesso. |
| D14 | Ogni modifica privilegiata produce audit | Le azioni devono essere attribuibili e verificabili. |
| D15 | Ruoli di sistema fissi nel primo rilascio | Evita combinazioni pericolose prima di conoscere i flussi reali. |
| D16 | Nessuna auto-promozione | Nessuno può assegnare a sé stesso nuovi privilegi. |
| D17 | Modifiche additive e feature flag | Migrazione e rollback devono essere sicuri. |
| D18 | Tabelle staff gestite solo da Alembic | L'avvio applicativo non può creare tabelle RBAC senza seed. |

Riferimenti di sicurezza:

- OWASP Authorization Cheat Sheet: deny-by-default e controllo server-side su ogni richiesta;
- OWASP API Security API1:2023: controllo sull'oggetto richiesto, non soltanto sul ruolo;
- OWASP Session Management: cookie host-only, `Secure`, `HttpOnly`, `SameSite`;
- OWASP Logging Cheat Sheet: audit delle azioni amministrative senza token o PII inutili;
- NIST SP 800-63B-4: autenticazione e gestione robusta degli autenticatori;
- IETF OAuth for Browser-Based Apps: pattern BFF con token conservati sul server.

---

## 3. Stato attuale e problemi da chiudere

### Auth

- Il modello utente non contiene staff membership, ruoli o permessi.
- Il JWT cliente non distingue un accesso staff.
- Il token cliente standard dura 60 minuti.
- Esistono MFA, sessioni revocabili, audit di sicurezza e Redis: sono basi utili.
- I microservizi validano già JWT RS256 localmente.

### Frontend

- `/admin` controlla soltanto la presenza di una sessione.
- La pagina reindex richiede una chiave amministrativa nel browser.
- Il marketplace usa anche token in `localStorage` per flussi cliente.
- La CSP del marketplace è ampia perché deve supportare scanner, wasm e molte origini.
- Il codice prevede un refresh cookie condiviso su `.ebartex.com` per il vecchio SSO.

### Conseguenza

Il back office non deve riutilizzare l'attuale auth store cliente, la pagina `/admin`, la CSP o il bridge SSO del marketplace.

---

## 4. Confini dell'architettura

```text
Browser staff
    |
    | HTTPS, cookie opaco host-only
    v
staff.ebartex.com — Next.js back office + BFF
    |
    | JWT staff server-side
    v
Auth centrale -------- Redis sessioni/revoche
    |
    | token firmato con audience staff
    v
Auction / Express / Support / Search / altri servizi
```

### Browser

Il browser conserva soltanto un identificatore casuale di sessione:

```text
__Host-brx_staff_session=<valore casuale>
Secure; HttpOnly; SameSite=Strict; Path=/
```

Non contiene:

- JWT;
- refresh token;
- ruoli modificabili dal client;
- chiavi interne;
- URL privati dei servizi.

### BFF del back office

Il BFF:

- conserva i token staff server-side;
- legge la sessione da Redis;
- controlla Origin e CSRF sulle mutazioni;
- inoltra richieste soltanto verso endpoint allowlisted;
- applica timeout, rate limit, limiti payload e `no-store`;
- non accetta dal browser header identità come `X-User-Id` o `X-Role`;
- non registra cookie, token o payload sensibili.

### Backend

Il backend resta l'autorità finale:

1. valida firma e algoritmo;
2. valida `issuer`;
3. valida `audience=brx-staff`;
4. valida `token_use=staff_access`;
5. valida scadenza e MFA;
6. verifica il permesso richiesto;
7. verifica ambito e singola risorsa;
8. esegue l'azione;
9. salva audit nella stessa transazione quando possibile.

---

## 5. Sessione staff

### Regole iniziali

| Voce | Regola |
|---|---|
| MFA | Obbligatoria |
| Access token interno | 5 minuti |
| Sessione massima | 8 ore |
| Inattività massima | 30 minuti |
| Refresh | Token opaco, ruotato e salvato solo come hash |
| Cookie browser | ID opaco, host-only, `__Host-` |
| Login cliente esistente | Non concede accesso staff |
| Cambio privilegi | Nuova versione autorizzativa e revoca sessioni |
| Evento ad alto rischio | Richiede MFA recente/step-up |

### Claims minimi del token interno

```json
{
  "sub": "staff-user-uuid",
  "iss": "https://auth.ebartex.com",
  "aud": "brx-staff",
  "token_use": "staff_access",
  "jti": "token-uuid",
  "authz_version": 4,
  "mfa_at": 1784100000,
  "roles": ["support_agent"],
  "permissions": ["support.ticket.read", "support.ticket.reply"],
  "scopes": [{"type": "queue", "key": "orders-it"}],
  "iat": 1784100000,
  "exp": 1784100300
}
```

### Revoca

- Auth mantiene `authz_version` nel database.
- Redis mantiene la versione corrente per lo staff attivo.
- Una variazione di ruolo incrementa la versione.
- Le operazioni critiche verificano la versione e falliscono chiuse se la revoca non è verificabile.
- Le letture non critiche hanno comunque un token massimo di 5 minuti.
- Sospensione e cessazione revocano tutte le sessioni staff.

---

## 6. Modello autorizzativo

### Ruolo

Un ruolo rappresenta un lavoro aziendale.

Esempi:

- `express_operator`;
- `support_agent`;
- `communications_manager`.

### Permesso

Un permesso rappresenta una singola azione backend.

Formato:

```text
dominio.risorsa.azione
```

Esempi:

- `express.card.sort`;
- `support.ticket.reply`;
- `communication.announcement.publish`.

### Ambito

Un ambito limita dove vale il ruolo:

- `global`;
- `hub:<id>`;
- `team:<id>`;
- `queue:<id>`.

L'assenza di ambito non significa accesso globale. Ogni assegnazione deve avere un ambito esplicito.

### Regola sulla risorsa

Il servizio proprietario controlla anche il singolo oggetto:

- lotto assegnato all'operatore;
- ticket assegnato alla coda corretta;
- segnalazione appartenente al team;
- carta appartenente all'hub autorizzato.

Il client non può decidere questi valori.

---

## 7. Catalogo iniziale dei permessi

### Gestione staff

| Permesso | Rischio |
|---|---|
| `staff.membership.read` | medio |
| `staff.membership.invite` | alto |
| `staff.membership.suspend` | critico |
| `staff.role.read` | medio |
| `staff.role.assign` | critico |
| `staff.role.revoke` | critico |
| `staff.audit.read` | alto |

### BRX Express

| Permesso | Rischio |
|---|---|
| `express.shipment.read` | medio |
| `express.shipment.receive` | alto |
| `express.batch.read` | medio |
| `express.batch.assign` | alto |
| `express.card.read` | medio |
| `express.card.sort` | alto |
| `express.card.correct` | alto |
| `express.quality.approve` | critico |

### Assistenza

| Permesso | Rischio |
|---|---|
| `support.ticket.read` | medio |
| `support.ticket.assign` | alto |
| `support.ticket.reply` | alto |
| `support.ticket.close` | alto |
| `support.sensitive_data.read` | critico |

### Segnalazioni

| Permesso | Rischio |
|---|---|
| `report.case.read` | medio |
| `report.case.assign` | alto |
| `report.case.reply` | alto |
| `report.case.resolve` | critico |
| `report.sensitive_data.read` | critico |

### Comunicazioni

| Permesso | Rischio |
|---|---|
| `communication.announcement.read` | basso |
| `communication.announcement.create` | alto |
| `communication.announcement.publish` | critico |
| `communication.announcement.cancel` | alto |

### Strumenti tecnici

| Permesso | Rischio |
|---|---|
| `search.reindex.start` | alto |

---

## 8. Ruoli iniziali

| Ruolo | Permessi principali | Ambito tipico |
|---|---|---|
| `platform_owner` | Tutti, solo emergenza | global |
| `access_administrator` | Membership, ruoli, audit | global |
| `express_operator` | Ricezione, lettura e smistamento | hub |
| `express_supervisor` | Operatore più assegnazione, correzione e qualità | hub |
| `reports_agent` | Lettura, risposta e gestione segnalazioni | queue/team |
| `reports_lead` | Agente più assegnazione, risoluzione e dati sensibili | queue/team |
| `support_agent` | Lettura e risposta ticket | queue/team |
| `support_lead` | Agente più assegnazione, chiusura e dati sensibili | queue/team |
| `communications_manager` | Preparazione e pubblicazione annunci | global |
| `operations_administrator` | Operazioni tecniche esplicitamente consentite | global |
| `auditor` | Lettura staff e audit | global |

Regole:

- `platform_owner` viene usato solo come account break-glass;
- `access_administrator` non può assegnare `platform_owner`;
- nessuno modifica i propri ruoli;
- ruoli critici richiedono motivazione;
- assegnazioni temporanee hanno `valid_until`;
- permessi di dati sensibili non sono inclusi nei ruoli base se non necessari;
- ruoli custom restano disabilitati nel primo rilascio.

---

## 9. Modello dati Auth

### `staff_memberships`

| Campo | Uso |
|---|---|
| `user_id` | Identità Auth collegata |
| `status` | `pending`, `active`, `suspended`, `terminated` |
| `authz_version` | Revoca e aggiornamento privilegi |
| `mfa_required` | Deve restare vero per lo staff |
| `created_by_user_id` | Chi ha creato la membership |
| `activated_at` | Attivazione |
| `suspended_at` | Sospensione |
| `terminated_at` | Cessazione |
| `created_at`, `updated_at` | Audit tecnico |

### `permissions`

Catalogo stabile con:

- codice;
- servizio proprietario;
- descrizione;
- livello di rischio;
- stato attivo.

### `staff_roles`

- UUID interno;
- chiave stabile;
- nome visibile;
- descrizione;
- ruolo di sistema;
- stato attivo.

### `staff_role_permissions`

Relazione molti-a-molti tra ruoli e permessi.

### `authorization_scopes`

- tipo: `global`, `hub`, `team`, `queue`;
- chiave esterna opaca;
- nome visibile;
- stato attivo.

### `staff_role_assignments`

- membro staff;
- ruolo;
- ambito obbligatorio;
- validità iniziale e finale;
- autore assegnazione;
- revoca, autore e motivazione;
- vincolo contro duplicati attivi.

### `staff_sessions`

- refresh token soltanto come hash;
- versione autorizzativa;
- scadenza assoluta e per inattività;
- IP e user agent;
- revoca e motivazione.

### `authorization_audit_logs`

- attore;
- soggetto coinvolto;
- azione;
- permesso;
- tipo e ID risorsa;
- decisione `allowed`, `denied`, `error`;
- codice motivazione;
- request/correlation ID;
- stato precedente e successivo sanificati;
- IP, user agent e data.

Token, password, cookie, segreti e contenuti personali non necessari non vanno mai nei log.

---

## 10. API Auth previste

### Sessione staff

```text
POST /api/staff/session/login
POST /api/staff/session/verify-mfa
POST /api/staff/session/refresh
POST /api/staff/session/logout
GET  /api/staff/me
```

### Membership e ruoli

```text
GET  /api/staff/access/members
POST /api/staff/access/invites
POST /api/staff/access/members/{id}/suspend
POST /api/staff/access/members/{id}/terminate
GET  /api/staff/access/roles
POST /api/staff/access/members/{id}/assignments
DELETE /api/staff/access/members/{id}/assignments/{assignment_id}
GET  /api/staff/access/audit
```

Tutte le liste:

- sono paginate;
- hanno limite massimo;
- non restituiscono campi sensibili non necessari;
- usano filtri allowlisted;
- rispondono `403` senza permesso;
- rispondono `404` quando rivelare l'esistenza della risorsa sarebbe rischioso.

Non esiste un endpoint pubblico per creare il primo owner. Il bootstrap usa un comando manuale, auditato e monouso.

---

## 11. Nuova dashboard frontend

### Progetto

- nome indicativo: `brx-backoffice`;
- deploy Amplify separato;
- dominio: `staff.ebartex.com`;
- variabili server-only;
- nessun accesso diretto ai microservizi dal browser;
- nessun riuso dell'attuale auth store cliente;
- nessun token in `localStorage` o `sessionStorage`;
- CSP stretta, senza scanner, wasm o origini marketplace non necessarie;
- dipendenze minime e aggiornamenti separati.

### Moduli

```text
/
/express
/reports
/support
/communications
/access/staff
/access/roles
/audit
/operations/search
```

Il menu viene costruito dalle capability restituite da `/api/staff/me`, ma ogni pagina e ogni BFF route ripetono il controllo server-side.

### Prima versione della gestione ruoli

Permette:

- invitare;
- attivare dopo MFA;
- assegnare un ruolo predefinito;
- scegliere un ambito;
- impostare una scadenza;
- sospendere o terminare;
- leggere lo storico.

Non permette ancora:

- creare ruoli custom;
- modificare il catalogo permessi;
- assegnare `platform_owner` dalla UI;
- auto-assegnarsi ruoli;
- cancellare audit.

---

## 12. Cookie e SSO tra sottodomini

Prima del go-live bisogna verificare se in produzione è attivo:

```text
AUTH_COOKIE_DOMAIN=.ebartex.com
```

Se è attivo, i cookie cliente vengono inviati anche ai nuovi sottodomini.

Soluzione definitiva:

1. cookie cliente host-only;
2. nessun refresh token condiviso sul parent domain;
3. login centralizzato con codice breve monouso;
4. scambio del codice dal BFF del singolo prodotto;
5. sessione distinta per ogni host;
6. back office escluso dal SSO cliente.

La nuova app non va aperta allo staff reale prima di questo gate oppure di un isolamento equivalente approvato dalla security review.

---

## 13. Audit e osservabilità

### Eventi obbligatori

- login staff riuscito e fallito;
- MFA fallita;
- refresh e logout;
- invito creato, accettato, scaduto o revocato;
- membership attivata, sospesa o terminata;
- ruolo assegnato, revocato o scaduto;
- tentativo di auto-promozione;
- accesso negato a risorsa o funzione;
- lettura di dati sensibili;
- esportazione dati;
- pubblicazione comunicazione globale;
- reindex e altre operazioni tecniche;
- uso dell'account break-glass.

### Protezione log

- audit applicativo separato dai normali log tecnici;
- righe append-only a livello applicativo;
- accesso all'audit a sua volta auditato;
- nessun token, cookie o password;
- PII mascherata o pseudonimizzata;
- request ID condiviso tra BFF e servizi;
- orologi in UTC;
- storico caldo nel database e archivio economico successivo;
- alert per modifiche critiche, break-glass e accessi negati ripetuti.

---

## 14. Threat model minimo

| Minaccia | Difesa obbligatoria |
|---|---|
| Utente cliente prova `/api/staff/*` | Audience/token use separati, risposta 401/403 |
| Staff modifica ruolo nel browser | Il backend ignora ruoli e ID dichiarati dal client |
| Operatore hub A cambia ID e apre hub B | Controllo scope e object-level su ogni richiesta |
| Furto password staff | MFA obbligatoria e rate limit |
| XSS nel back office | Token solo server-side, CSP stretta, output encoding |
| CSRF su una mutazione | SameSite Strict, Origin check e token CSRF |
| Furto cookie sessione | Cookie `__Host-`, TLS, rotazione e session binding prudente |
| Dipendente sospeso mantiene il token | `authz_version`, session revoke e token 5 minuti |
| Access admin si promuove owner | Divieto server-side e audit critico |
| Chiave interna finisce nel browser | BFF server-only e test automatici sui bundle/env |
| Audit cancellato o modificato | Permessi DB separati e copia append-only |
| Replay di una mutazione | Idempotency key per operazioni sensibili |
| Doppio click pubblica due annunci | Vincolo idempotente e stato transazionale |
| Servizio Auth non raggiungibile | Verifica JWT locale; write critiche fail-closed |
| Redis revoche non raggiungibile | Write critiche bloccate; letture limitate dal token breve |
| Errore di configurazione abilita endpoint | Feature flag off di default e deny-by-default |

---

## 15. Piano step by step

### Fase 0 — Contratto e sicurezza

Attività:

- approvare decisioni D1-D18;
- approvare catalogo permessi e ruoli iniziali;
- approvare threat model;
- assegnare proprietario di ogni dominio;
- definire dati sensibili visibili a supporto e segnalazioni;
- definire durata audit con supporto legale/privacy;
- verificare cookie reali in produzione;
- creare feature flag `STAFF_AUTHORIZATION_ENABLED=false`.

Gate:

- nessun punto critico aperto;
- nessun ruolo ambiguo;
- nessun permesso generico come `admin.all`.

Rollback:

- nessun impatto runtime, documento e flag soltanto.

### Fase 1 — Fondazione Auth/RBAC

Attività:

- migrazione Alembic additiva;
- `main` come linea Alembic canonica e riallineamento controllato degli ambienti `dev`;
- modelli staff, permessi, ruoli, scope, assegnazioni, sessioni e audit;
- esclusione delle tabelle staff dal vecchio `create_all` applicativo;
- seed idempotente dei permessi e ruoli di sistema;
- catalogo permessi versionato nel codice;
- indici e vincoli database;
- repository di sola fondazione;
- test su duplicati, riferimenti, scadenze e revoche;
- nessuna route pubblica attiva.

Gate:

- migrazione upgrade/downgrade verificata su PostgreSQL isolato e poi su staging;
- unica linea Alembic canonica validata sia su database vuoto sia su database esistente;
- feature flag ancora spenta;
- nessuna modifica al login cliente;
- test statici e database verdi.

Rollback:

- spegnere flag;
- rollback della sola migrazione prima che esistano dati staff reali.

### Fase 2 — Sessione staff e MFA

Attività:

- login staff separato;
- blocco se membership non attiva;
- blocco se MFA non configurata;
- token `staff_access` da 5 minuti;
- refresh opaco ruotato;
- sessioni massime e idle timeout;
- logout e revoca globale;
- endpoint `/api/staff/me`;
- bootstrap owner tramite CLI;
- alert sul break-glass.

Gate:

- nessun token nel browser;
- cliente normale sempre respinto;
- revoca verificata entro l'obiettivo;
- MFA non aggirabile tramite refresh o endpoint alternativi.

Rollback:

- flag off;
- revoca di tutte le staff session.

### Fase 3 — Enforcement comune nei servizi

Attività:

- libreria interna versionata per validare token e permessi;
- `require_permission(code)`;
- validazione scope tipizzata;
- helper audit comune;
- contract test obbligatorio per ogni endpoint staff;
- rollout iniziale su Auth e Auction;
- nessuna chiamata Auth per ogni richiesta ordinaria.

Gate:

- endpoint senza dichiarazione permesso rifiutato dai test;
- audience cliente non accettata;
- test cross-scope e IDOR verdi.

Rollback:

- endpoint staff dietro flag, nessun impatto sulle API cliente.

### Fase 4 — Nuova app `staff.ebartex.com`

Attività:

- nuovo progetto Next.js minimale;
- nuova Amplify app;
- ambiente staging separato;
- cookie sessione opaco;
- BFF allowlisted;
- CSP e security headers stretti;
- layout dashboard e route guard server-side;
- pagina accesso negato senza dettagli sensibili;
- dependency scan e secret scan in CI.

Gate:

- nessun token in storage o bundle;
- nessun URL backend pubblico nei componenti;
- cookie host-only verificato dal browser;
- test CSRF, CSP e session fixation verdi.

Rollback:

- DNS non pubblicato o riportato alla maintenance page;
- revoca sessioni staging.

### Fase 5 — Gestione staff e ruoli

Attività:

- lista staff paginata;
- invito monouso con scadenza;
- assegnazione ruolo e ambito;
- sospensione e cessazione;
- audit visibile agli autorizzati;
- nessuna UI per ruoli custom;
- step-up MFA per operazioni critiche.

Gate:

- impossibile auto-promuoversi;
- impossibile assegnare owner dalla UI;
- ogni modifica produce audit;
- revoca chiude le sessioni.

### Fase 6 — Prima verticale reale

Usare comunicazioni e reindex perché sono limitati e facili da verificare.

Attività:

- `communication.announcement.create`;
- preview destinatari;
- `communication.announcement.publish`;
- idempotenza e conferma esplicita;
- `search.reindex.start`;
- eliminazione della chiave reindex dal browser;
- audit completo.

Gate:

- Communications Manager non vede ruoli o supporto;
- Access Administrator non pubblica annunci;
- retry non duplica pubblicazioni;
- nessun internal token lascia il server.

### Fase 7 — Supporto e segnalazioni

Attività:

- code e assegnazioni;
- masking PII;
- accesso ai soli casi autorizzati;
- separazione tra risposta, chiusura e azioni economiche;
- audit delle letture sensibili;
- rate limit ed export controllato.

Gate:

- test IDOR su ogni endpoint con ID;
- operatore queue A non legge queue B;
- dati sensibili invisibili senza permesso esplicito.

### Fase 8 — BRX Express

Attività:

- scope hub;
- ricezione spedizioni;
- lotti e assegnazioni;
- scansione e smistamento;
- correzioni separate dalle approvazioni qualità;
- tracciamento completo per carta;
- idempotenza per scansioni e cambi stato.

Gate:

- operatore hub A non accede a hub B;
- una carta non salta stati obbligatori;
- correzione e approvazione critica possono essere separate.

### Fase 9 — Go-live e gestione continua

Attività:

- security review indipendente;
- test di penetrazione sulle authorization boundary;
- runbook incidente e offboarding;
- alert critici;
- backup e restore audit verificati;
- revisione accessi periodica;
- rimozione della vecchia `/admin`;
- verifica costi e retention.

Gate:

- nessun P0/P1 aperto;
- owner e sostituto formati;
- procedura di revoca provata;
- rollback provato;
- dashboard operativa e monitorata.

---

## 16. Strategia di test

### Unit test

- catalogo permessi senza duplicati;
- ogni ruolo usa permessi esistenti;
- scope obbligatorio;
- assegnazioni scadute ignorate;
- revoche ignorano cache vecchie;
- audience e token use corretti;
- MFA recente per operazioni critiche.

### Integration test

- cliente contro endpoint staff;
- staff senza permesso;
- staff con permesso e scope corretto;
- staff con ruolo corretto ma scope errato;
- oggetto spostato tra code durante la richiesta;
- revoca concorrente a una mutazione;
- retry idempotente;
- audit scritto insieme alla mutazione.

### Security test

- IDOR/BOLA su ogni parametro ID;
- CSRF;
- XSS e token extraction;
- session fixation;
- cookie tossing da altro sottodominio;
- privilege escalation;
- auto-assegnazione;
- mass assignment;
- replay;
- bypass tramite endpoint legacy;
- secret scanning di bundle e log.

### Frontend test

- menu coerente con capability;
- route server-side protette;
- BFF cookie-first;
- nessun `localStorage` per credenziali;
- errori 401/403 gestiti senza leak;
- logout e scadenza sessione.

---

## 17. Runbook aziendali obbligatori

### Onboarding

1. Access Administrator invia invito.
2. La persona verifica l'identità.
3. Configura MFA.
4. Riceve ruolo e scope minimi.
5. Accetta policy interne.
6. Primo accesso registrato.

### Cambio mansione

1. Assegnare il nuovo ruolo.
2. Revocare quello non più necessario.
3. Incrementare `authz_version`.
4. Revocare le sessioni esistenti.
5. Registrare motivazione e approvatore.

### Offboarding

1. Stato `terminated`.
2. Revoca immediata di ruoli e sessioni.
3. Invalidazione refresh e cache.
4. Rimozione da hub, team e code.
5. Alert e audit di chiusura.
6. Controllo attività recente.

### Incidente

1. Sospendere account.
2. Revocare sessioni.
3. Conservare audit.
4. Cercare request ID e azioni correlate.
5. Valutare impatto su utenti e dati.
6. Ripristinare solo dopo verifica e nuova MFA.

### Break-glass

1. Credenziale non usata quotidianamente.
2. MFA forte obbligatoria.
3. Uso sempre alertato.
4. Motivazione obbligatoria.
5. Sessione molto breve.
6. Review successiva obbligatoria.

---

## 18. Controllo costi

La sicurezza non richiede una nuova piattaforma costosa:

- stesso servizio Auth;
- stesso PostgreSQL;
- stesso Redis;
- validazione JWT locale nei microservizi;
- Redis usato solo per sessioni e revoche staff;
- nessuna chiamata Auth su ogni richiesta ordinaria;
- una sola nuova app frontend a basso traffico;
- audit recente nel DB, storico compresso su storage economico;
- paginazione e retention per evitare crescita illimitata.

Metriche da osservare:

- numero sessioni staff attive;
- richieste BFF e durata;
- controlli revoca Redis;
- righe audit generate;
- dimensione audit mensile;
- errori 401/403;
- build e traffico Amplify.

---

## 19. Criteri finali di accettazione

- [ ] `staff.ebartex.com` è una app e un deploy separati.
- [ ] Un utente cliente non può ottenere una sessione staff.
- [ ] MFA è obbligatoria e non aggirabile.
- [ ] Nessun token staff arriva al JavaScript.
- [ ] Nessuna chiave interna arriva al browser.
- [ ] I cookie staff sono host-only e prefissati `__Host-`.
- [ ] Ogni endpoint staff è deny-by-default.
- [ ] Ogni endpoint dichiara un permesso atomico.
- [ ] Ogni risorsa controlla scope e object-level authorization.
- [ ] Nessuno può modificare i propri privilegi.
- [ ] `platform_owner` non è assegnabile dalla UI ordinaria.
- [ ] Ruoli e sessioni sono revocabili rapidamente.
- [ ] Ogni azione privilegiata genera audit.
- [ ] Audit e log non contengono token o PII non necessarie.
- [ ] I retry delle mutazioni sensibili sono idempotenti.
- [ ] I test IDOR/BOLA coprono tutti gli endpoint con ID.
- [ ] Le operazioni critiche falliscono chiuse.
- [ ] Il vecchio reindex con chiave browser è rimosso.
- [ ] La vecchia area `/admin` viene rimossa dopo la parità.
- [ ] Esistono runbook onboarding, offboarding, incidente e break-glass.
- [ ] Security review e rollback sono stati provati prima del go-live.

---

## 20. Ordine di lavoro attuale

```text
[completato] audit architetturale iniziale
[completato] decisione app separata + sottodominio
[completato] threat model e catalogo iniziale
[in corso]   fondazione Auth/RBAC dietro feature flag
[da fare]    sessione staff e MFA
[da fare]    enforcement comune nei servizi
[da fare]    nuova app back office
[da fare]    gestione ruoli
[da fare]    comunicazioni/reindex
[da fare]    supporto/segnalazioni
[da fare]    BRX Express
[da fare]    hardening e go-live
```

Nessuna fase può saltare il proprio gate di sicurezza.

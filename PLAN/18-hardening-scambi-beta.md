# Piano 18 — Hardening Scambi per la beta

> Obiettivo: chiudere in modo corretto le falle emerse dall'audit di sicurezza/affidabilità
> degli Scambi (backend `brx-marketplace` + servizio `auction`/`sync`, BFF e frontend di questo repo),
> così che la feature — già live in beta — regga volume e casi limite senza corrompere l'inventario.
> Non è un piano d'emergenza: il servizio è architetturalmente sano (transazioni atomiche, lock
> pessimistici, idempotenza a ledger, ownership verificata, nessun IDOR/SQLi/XSS). Questo piano
> irrobustisce i pochi punti dove un invariante non è *imposto* dal codice o dal DB.
> Scritto il 2026-07-16. Complementare a [[14-backend-scambi]] (che ha costruito la feature) e
> a [[17-backoffice-rbac-staff]] §3 (JWT cliente in `localStorage`, stessa radice del finding F1).

---

## 0. Sintesi dei findings

Legenda stato: **✔ verificato in prima persona sul codice** (2026-07-16) · **▲ da audit, plausibile, da confermare in Fase 0**.

| # | Sev | Dove | Falla | Stato |
|---|-----|------|-------|-------|
| B1 | **ALTA** | `brx-marketplace` `trade_inventory_service.py:212-373` | La reservation escrow non ha stato terminale: `release`/`consume` verificano `status=="succeeded"` ma non chiudono la riga `reserve`. Con ≥2 reservation attive sullo stesso listing, un doppio release (op_key diversi) supera il guard `reserved_quantity < quantity` e restituisce in vendita l'escrow di un altro scambio. | ✔ |
| B2 | **ALTA** | `brx-marketplace` `003_drop_legacy_mapping_fix_idempotency.py:25` vs `001_initial_schema.py:134` | La 003 droppa solo l'*indice* `ix_mkt_orders_idempotency_key`, non il *constraint* `uq_mkt_orders_idempotency_key`. L'unicità **globale** su `idempotency_key` resta attiva: un utente B che riusa la chiave di A → `IntegrityError`, il fallback per-buyer non la trova → 500 e chiave altrui bloccata. | ✔ (residuo in codice; stato reale del DB prod da confermare in Fase 0) |
| B3 | MEDIA | `brx-marketplace` `main.py`, `deploy/docker-compose.prod.yml`, `internal_trade_inventory.py` | Superficie esposta: documentazione e dettagli DB pubblici; router `/internal/trade-inventory/*` montato sull'app pubblica, protetto dal solo token statico. | ✔ fix locale / ▲ filtro nginx+SG da confermare |
| B4 | MEDIA | `brx-marketplace` `sync_service.py`, `listing_service.py` | Le inserzioni DEMO restano pubbliche e utilizzabili per provare catalogo, scambi e futuri pagamenti fino al lancio. Gli ordini restano mock. | ✔ comportamento voluto |
| B5 | MEDIA | `brx-marketplace` escrow + scheduler `auction` | Le reservation marketplace sono già coperte da `recover-accepting`/`recover-completions`; `ACCEPTING` viene committato prima delle chiamate inventory. Resta lo smoke staging del job. | ✔ codice |
| B6 | BASSA | `trade_inventory_service.py:79,253,335` | Lock multi-listing `WHERE id IN (...) FOR UPDATE` senza `ORDER BY`: due reserve concorrenti su insiemi sovrapposti → deadlock Postgres → 500 evitabile. | ✔ |
| B7 | BASSA | `brx-marketplace` migrazioni | Manca `CHECK quantity >= 0` su `mkt_listings` (esiste `CHECK reserved_quantity >= 0`). Nessun backstop DB se un percorso futuro sbaglia. | ✔ fix locale |
| F1 | **ALTA** | frontend auth store + client Scambi/Marketplace/Sync | Access token JWT duplicato in `localStorage` e riletto per l'header `Authorization`, mentre il BFF usa già cookie HttpOnly. | ✔ fix locale |
| F2 | MEDIA | proxy BFF marketplace/trades/sync | Path traversal, assenza rate limit marketplace e default HTTP. | ✔ fix locale |
| C1 | **BLOCCANTE** | frontend `sync-client.ts` vs backend `sync` `routes/sync.py` | Su `HEAD` manca `POST /api/v1/sync/link-cardtrader`. | ✔ fix locale frontend+backend / deploy da fare |
| C2 | MEDIA | frontend `use-marketplace-listings.ts` | Polling più rapido del limite BFF e 429 ignorati. | ✔ fix locale |
| C3 | BASSA | frontend client marketplace/sync | Dead code verso endpoint backend `410 Gone`. | ✔ rimosso |

Priorità d'intervento: **B1 → B2 → C1 → F1 → F2/B3 → B4/B5 → resto**.

### Esito verifica locale 2026-07-16

- **B1/B6 implementati localmente** in `brx-marketplace`; lo stato terminale resta separato
  dallo `status` dell'operazione. Sei test escrow verdi su Postgres usa-e-getta; 009 e backfill verdi.
- **B2 implementato localmente** con migrazione 010 e due test DB verdi. Il DB produzione
  non è stato interrogato: la guardia idempotente resta necessaria.
- **B3 corretto localmente**: documentazione disattivata in produzione e `/health/db`
  ridotto a un check senza dettagli. Tre test verdi; filtro nginx e Security Group restano da verificare.
- **B7 implementato localmente** con migrazione 011 e test DB sul vincolo `quantity >= 0`.
- **B4 chiuso come decisione prodotto**: DEMO/PARTIAL restano visibili e usano stock locale
  con ordini mock, perché servono a provare il flusso completo fino al lancio. Prima di attivare
  pagamenti reali questa scelta andrà rivalutata esplicitamente.
- **B5 chiuso localmente**: `auction` salva `ACCEPTING` prima della reserve e
  `recover-accepting` riprende o compensa anche le reservation marketplace. Non serve un nuovo sweep.
- **C1 corretto localmente**: alias backend presente; il frontend mostra l'errore localizzato
  e conserva il token inserito se il collegamento fallisce. Resta il deploy coordinato.
- **F2/C2/C3 corretti localmente**: validazione path condivisa, rate limit marketplace,
  default HTTPS, polling a 2.5s con stop su 429 e rimozione dei client verso endpoint `410`.
  I test BFF mirati sono verdi.
- **F1 corretto localmente**: l'access token resta solo in memoria, i residui legacy vengono
  rimossi all'avvio e i tre client usano il cookie HttpOnly verso il BFF. Test dedicati verdi.

---

## 1. Principi

1. **Ogni invariante critico è imposto in due punti**: nel codice (CAS/lock) *e* nel DB (constraint/CHECK). B1 e B7 nascono dall'assenza del secondo.
2. **Nessun nuovo costo infrastrutturale** (come già fatto nell'hardening del 2026-07-15): si riusano worker, Redis, scheduler e DB esistenti.
3. **Migrazioni additive e idempotenti**, con `IF EXISTS`/guardie: lo stato reale del DB prod è incerto (baseline riallineate a mano in passato — vedi [[14-backend-scambi]] §"Deploy 2026-07-14"), quindi ogni DDL va scritto per essere sicuro su schema già parzialmente divergente.
4. **Deploy col pattern collaudato**: build → push ECR (tag immutabile) → `alembic upgrade head` one-off nel container sull'host → `docker compose up -d`, con tag di rollback comune. Nessuna azione su produzione senza conferma esplicita dell'utente.
5. **Ogni fix chiude con un test che fallisce prima e passa dopo** — in particolare i test di concorrenza che oggi mancano.

---

## 2. Fase 0 — Verifiche (read-only, prima di toccare codice)

Obiettivo: trasformare i ▲ in ✔/scartati e conoscere lo stato reale della produzione. Tutte letture; gli accessi prod (SSH/`psql`/AWS) solo con conferma dell'utente.

- **B2 — stato constraint in prod**: `\d mkt_orders` sul RDS → verificare se `uq_mkt_orders_idempotency_key` esiste ancora e se esiste `ix_mkt_orders_buyer_idempotency`. Verificare anche `SELECT version_num FROM mkt_alembic_version`. Determina se la migrazione di fix serve davvero o se il DB prod è già a posto (baseline riallineata a mano).
- **B3 — filtro rete**: dalla config nginx-proxy-manager su `35.152.137.13` (host dei vhost) verificare che `marketplace-api.ebartex.com` **non** inoltri `/internal/*`; dal SG dell'istanza `15.160.8.178` verificare chi può raggiungere `:8004`. Verificare che `require_internal_token` sia fail-closed (token assente → 503) come da [[backend-services-map]].
- **B4 — demo-mode, chiuso**: il comportamento è confermato e voluto. Le inserzioni
  DEMO/PARTIAL restano pubbliche e prenotabili fino al lancio per testare il flusso completo;
  gli ordini restano mock e le scritture reali restano disabilitate.
- **B5 — copertura recover**: nel worker `auction` (scheduler privato dell'hardening 2026-07-15) verificare se `recover-accepting` rilascia le reservation *marketplace* oltre a quelle *sync*, o solo lo stato trade.
- **C1 — intento onboarding**: leggere `SincronizzazioneContent.tsx:124-148` e i due endpoint sync (`link-cardtrader` inesistente, `setup-test-user` esistente con user-match) per decidere se il fix è frontend (usare l'endpoint reale) o backend (esporre il vero `link-cardtrader`). `setup-test-user` ha un nome da percorso di test: probabilmente serve l'endpoint backend vero.

**Gate**: ogni ▲ risolto in "confermato + fix scelto" oppure "non riproducibile → chiuso". Esiti annotati in cima a questo file.

---

## 3. Fase 1 — Invariante escrow (B1) · brx-marketplace · ALTA

**Il fix.** Una reservation deve poter essere chiusa **una volta sola**, da un'unica operazione terminale (release *oppure* consume). Il lifecycle della reservation deve restare separato dallo `status` dell'operazione: cambiare `status="succeeded"` in `released`/`consumed` romperebbe il replay idempotente della reserve dopo la chiusura.

1. **Transizione serializzata sulla riga `reserve`.** Aggiungere `reservation_state` (`open`/`released`/`consumed`). In `release_trade_listings` e `consume_trade_listings`, dopo il `FOR UPDATE` già presente:
   - `release`: `open → released`; `consume`: `open → consumed`.
   - Se la riga non è più `open` → nuovo errore `RESERVATION_ALREADY_CLOSED` (409), **senza** toccare le quantità.
   - La transizione avviene sotto il lock `FOR UPDATE` già acquisito, quindi è serializzata contro qualunque altro release/consume concorrente sulla stessa reservation.
2. **Nessuna dipendenza dall'op_key del release/consume** per l'invariante: l'idempotenza per-op_key (replay dello stesso release) resta e continua a rispondere `replayed`, ma non è più *l'unica* barriera. La barriera vera diventa lo stato della reservation.
3. **Modello + migrazione** (`mkt_trade_inventory_ops`), migrazione `009_*`:
   - aggiungere `reservation_state` nullable per le operazioni non-reserve, con `CHECK` che impone `open`/`released`/`consumed` sulle reserve;
   - fare il backfill dello storico tramite `payload_json->>'reservation_op_key'`, senza cambiare lo `status` dell'operazione;
   - aggiungere colonna nullable `closed_by_op_key VARCHAR(255)` + `closed_at TIMESTAMPTZ` per audit (quale release/consume ha chiuso la reservation);
   - bloccare la migrazione se esistono più operazioni terminali riuscite sulla stessa reservation: richiedono riconciliazione stock, non una scelta automatica;
   - indice parziale sulle reservation `open` per diagnosi e recovery.
4. **B6 nello stesso giro**: aggiungere `.order_by(Listing.id)` ai tre `select(...).with_for_update()` (righe 79-81, 253, 335) per un ordine di lock deterministico → niente deadlock.

**Test (devono fallire su main, passare dopo)** in `tests/` con Postgres reale:
- due reservation attive sullo stesso listing, poi **doppio release** della prima (op_key diversi) → il secondo dà `RESERVATION_ALREADY_CLOSED`, `quantity`/`reserved_quantity` invariati; l'escrow della seconda reservation resta intatto.
- `release` poi `consume` sulla **stessa** reservation → la seconda operazione dà `RESERVATION_ALREADY_CLOSED`; nessun doppio conteggio.
- replay dello stesso `release` (stesso op_key) → `replayed: true`, effetto una sola volta.
- replay della `reserve` dopo release/consume → ancora `replayed: true`.
- due `reserve` concorrenti su insiemi di listing sovrapposti → nessun deadlock, entrambe terminano (una può fallire per quantità, non per lock).

**Gate**: i test sopra verdi; `ruff`/`black --check` verdi sui file toccati; la suite escrow esistente resta verde.

---

## 4. Fase 2 — Constraint idempotenza ordini (B2) · brx-marketplace · ALTA

Dipende dall'esito Fase 0 (potrebbe essere già a posto in prod).

- Migrazione `010_*`: `op.drop_constraint("uq_mkt_orders_idempotency_key", "mkt_orders", type_="unique")` avvolto in guardia idempotente (blocco `DO $$ ... IF EXISTS (SELECT FROM pg_constraint WHERE conname=...) THEN ... END $$`), così è sicura sia sullo schema che ha ancora il constraint sia su quello già ripulito.
- Verificare che resti attivo `ix_mkt_orders_buyer_idempotency` (unicità per-buyer, creato dalla 003): se assente, ricrearlo nella stessa migrazione.
- Correggere `manual_apply_all.sql:96` (`DROP INDEX ... uq_...`, che Postgres rifiuta su un constraint) → `ALTER TABLE ... DROP CONSTRAINT IF EXISTS uq_mkt_orders_idempotency_key`, per coerenza con lo script di bootstrap.

**Test**: due buyer distinti con lo **stesso** `idempotency_key` → entrambi creano il proprio ordine (nessun 500, nessun blocco cross-utente); stesso buyer + stessa chiave → replay idempotente.

**Gate**: test verde; catena Alembic marketplace lineare fino alla nuova head; `alembic upgrade head` + `downgrade -1` + `upgrade head` verdi su Postgres isolato.

---

## 5. Fase 3 — Superficie ed error-leak (B3) · brx-marketplace · MEDIA

- `main.py`: `docs_url`/`redoc_url`/`openapi_url` = `None` quando `ENVIRONMENT == "production"` (restano attivi in dev/staging).
- `/health/db`: rimuovere `str(exc)` dalla risposta (loggarlo soltanto) e togliere/gating del conteggio righe; oppure spostare l'endpoint dietro `require_internal_token`. `/health` semplice resta pubblico per l'healthcheck del compose.
- **Endpoint interni**: chiudere il gap di rete individuato in Fase 0 — regola nginx che rifiuta `/internal/` sul vhost pubblico **e** SG che limita `:8004` alla sola rete interna. Difesa in profondità già presente (token fail-closed): questa fase la rende ridondante di proposito.
- **Healthcheck worker in prod**: propagare il `healthcheck: disable: true` già presente in `docker-compose.prod.yml:54-55` sull'host (il container prod gira una versione precedente senza il disable → "unhealthy" cronico). Valutare la rimozione del worker `sync_worker`: oggi è dead weight (task disabilitato). Deciso in Fase 6.

**Gate**: in staging `/docs` e `/redoc` → 404; `/health/db` non espone dettagli DB; `curl` su `/internal/*` dal vhost pubblico → rifiutato a livello proxy; `/health` ancora 200 per il compose.

**Stato locale**: codice e test completati. Restano verifica rete e smoke staging.

---

## 6. Fase 4 — Demo-mode (B4) · chiusa come decisione prodotto

- Nessun filtro aggiuntivo: le inserzioni DEMO/PARTIAL devono restare nel catalogo pubblico
  e nell'escrow per consentire test realistici del sito fino al lancio.
- Gli ordini DEMO restano mock e non attivano pagamenti reali o scritture CardTrader reali.
- Prima di abilitare i pagamenti reali va aperto un gate di lancio dedicato per decidere se
  isolare, eliminare o convertire le inserzioni DEMO esistenti.

**Gate**: comportamento documentato e mantenuto intenzionalmente; nessuna modifica necessaria ora.

---

## 7. Fase 5 — TTL/recovery escrow (B5) · chiusa dalla verifica locale

- Nessun nuovo job: `accept` salva e committa `ACCEPTING` prima delle chiamate inventory;
  `recover-accepting` ripete le reserve idempotenti e, sugli errori certi, chiama `_release_both`,
  che include sia sync sia marketplace. `recover-completions` riprende consume/credit.
- Resta solo da verificare in staging che il job schedulato sia effettivamente attivo.

**Gate**: test `auction` di crash dopo reserve e smoke staging del job; nessun nuovo TTL applicativo.

---

## 8. Fase 6 — Frontend: JWT fuori da localStorage (F1) · ALTA

Radice condivisa con [[17-backoffice-rbac-staff]] §3. Qui si chiude lo **scope scambi/marketplace/sync**, che passa già tutto da BFF same-origin con cookie HttpOnly.

- In `trades-client.ts`, `marketplace-client.ts`, `sync-client.ts`: rimuovere la lettura di `localStorage` e l'header `Authorization: Bearer` costruito lato client. Le chiamate sono già same-origin verso `/api/*`; il BFF legge il cookie HttpOnly e aggiunge lui l'auth verso il backend. ✔ Verificato in `app/api/_lib/forwarded-authorization.ts:38-51`: `getForwardedAuthorization` è cookie-first e usa l'header entrante solo come fallback quando il cookie è assente — la rimozione dell'header client-side è sicura per costruzione.
- In `auth-store.ts:122`: smettere di persistere l'access token in `localStorage`. Valutare se qualche flusso legacy lo legge ancora (ricerca usi di `config.auth.tokenKey`): se sì, migrarlo o isolarlo. Se un residuo cross-prodotto lo richiede, tracciarlo esplicitamente come debito verso il Piano 17.
- Verifica: dopo login, `localStorage` non contiene il token; gli scambi funzionano lo stesso (cookie-only); un `localStorage.clear()` in devtools non scollega l'utente per le operazioni scambi.

**Gate**: `typecheck`/`lint`/`test` verdi; smoke: proporre/accettare/annullare uno scambio con `localStorage` vuoto; nessuna regressione 401.

**Stato locale**: codice e test completati. Resta lo smoke autenticato end-to-end.

---

## 9. Fase 7 — Frontend: hardening proxy marketplace (F2) + polling (C2) · MEDIA

- `app/api/marketplace/[...path]/route.ts`: (a) validare i segmenti di `params.path` **prima** del gate pubblico — rifiutare `..`, segmenti vuoti e varianti percent-encoded — e calcolare `isPublicMarketplacePath` sul path **normalizzato**; (b) aggiungere `checkRateLimit` come in `trades/_proxy.ts` e `sync/[...path]`; (c) default URL `https://` o fail-closed se `MARKETPLACE_API_URL` non è configurata. Applicare la stessa validazione dei segmenti a `trades/_proxy.ts:34` e `sync/[...path]/route.ts:57`.
- `use-marketplace-listings.ts:113`: portare l'intervallo di polling a ≥2s (sotto il limite BFF di 30/min) **o** alzare il limite del proxy sync; sostituire il `catch` vuoto con gestione esplicita (log + stop del polling su 429), così un refresh ritardato non resta invisibile.

**Gate**: test BFF che un path con `..` non raggiunge un endpoint privato; il proxy marketplace risponde 429 oltre soglia; il polling non genera 429 a regime.

**Stato locale**: completato; test BFF mirati, typecheck e lint verdi.

---

## 10. Fase 8 — Contract: onboarding CardTrader (C1) + pulizia (C3) · BLOCCANTE/BASSA

- **C1**, secondo l'esito Fase 0:
  - se l'intento è onboarding reale → esporre nel backend `sync` il vero `POST /api/v1/sync/link-cardtrader` (con user-match come `setup-test-user`) e mantenere il client frontend;
  - come fix rapido intermedio → puntare la UI su `setupTestUser` (già in `sync-client.ts:254`).
  - In entrambi i casi: aggiungere il `catch` mancante in `handleLinkToken` (`SincronizzazioneContent.tsx:124-148`) con messaggio i18n (×6) e stato d'errore visibile.
- **C3**: rimuovere il dead code verso endpoint `410` (`triggerSync`/`triggerMarketplaceSync` in `marketplace-client.ts:166`, `purchaseInventoryItem` in `sync-client.ts:399`) e i tipi orfani collegati.
- Allineamenti minori opzionali: arrotondare a 2 decimali il prezzo in `sell-single-draft.ts` prima dell'invio (evita 422 Pydantic); tipizzare `OrderStatus.pending_external` lato frontend; rimuovere/gating dell'endpoint sync `/sync/debug-logs` senza auth.

**Gate**: onboarding CardTrader completo senza 404 su dev; `i18n:keys` verde; nessun riferimento a endpoint `410`.

**Stato locale**: fix frontend e backend completati; dead code rimosso e chiavi i18n allineate.
Resta il deploy coordinato e lo smoke end-to-end.

---

## 11. Fase 9 — Test, regressione e deploy

- Suite completa verde: `brx-marketplace` pytest (unit + integrazione/concorrenza nuovi), `auction`/`sync` se toccati, e in questo repo `typecheck`/`lint`/`test`/`i18n:keys`/`build`.
- I test d'integrazione marketplace girano nella nuova CI con PostgreSQL 16 usa-e-getta,
  `TEST_DATABASE_URL`, migrazioni complete e verifica downgrade/upgrade.
- Deploy per servizio con tag ECR immutabile e **rollback tag comune**; `alembic upgrade head` one-off sull'host prima del restart; smoke post-deploy: escrow (reserve→release→consume idempotenti), health, `/internal/*` senza token → 401, onboarding CardTrader, uno scambio end-to-end.
- Runbook `repos/auction/docs/TRADES_RUNBOOK.md` aggiornato con la condizione
  `RESERVATION_ALREADY_CLOSED` e la procedura operativa senza correzioni manuali dello stock.

**Stato locale**: workflow CI e runbook completati. Resta l'esecuzione effettiva della CI
dopo il push e il deploy/smoke con rollback tag.

---

## 12. Fuori scope

- Rotazione del token interno S2S / passaggio a mTLS (miglioramento infra, non falla): valutare in un ciclo ops dedicato.
- Verifica `iss`/`aud`/`jti` e revoca nel marketplace: dipende dal modello sessione centrale, di competenza [[17-backoffice-rbac-staff]].
- Rimozione globale del token da `localStorage` per **tutti** i flussi cliente (non solo scambi): tracciata dal Piano 17.
- Valore di mercato reale ed equità imposta dal server sugli scambi (già fuori scope in [[14-backend-scambi]] §9).

## 13. Rischi e note

1. **Stato DB prod incerto**: baseline Alembic riallineate a mano in passato ([[14-backend-scambi]]). Ogni migrazione di questo piano è scritta idempotente con guardie `IF EXISTS`; Fase 0 (`\d`) precede qualsiasi DDL.
2. **B1 è un teardown-invariant, non un bug di happy-path**: si manifesta solo con ≥2 reservation sullo stesso listing o con release+consume incrociati. Basso in beta a volumi bassi, ma è esattamente la classe di bug che emerge quando il volume sale — motivo per cui è priorità 1.
3. **Ordine di deploy**: marketplace prima (escrow + constraint), poi eventuali modifiche auction (recover), infine frontend. I fix frontend (F1/F2/C1) sono indipendenti e deployabili anche prima, non regrediscono il backend.
4. **Doppia proprietà dei modelli inventario** (sync + copia auction) resta un rischio di drift noto: non toccata qui, ma da ricordare se si aggiungono colonne.

## 14. Criteri di accettazione complessivi

- [ ] Una reservation marketplace si chiude **una sola volta**: doppio release, release+consume e retry non alterano mai lo stock oltre il trasferimento previsto (test di concorrenza verdi in CI).
- [ ] Due buyer con la stessa idempotency key creano ordini indipendenti; nessun 500 né blocco cross-utente.
- [ ] In produzione `/docs`, `/redoc` non sono raggiungibili; `/health/db` non espone dettagli; `/internal/*` non è raggiungibile dal vhost pubblico e risponde 401 senza token.
- [ ] Nessun access token in `localStorage` per i flussi scambi/marketplace/sync; le operazioni funzionano cookie-only.
- [ ] Il proxy marketplace ha rate limit, rifiuta path con `..` e non usa HTTP in chiaro di default.
- [ ] L'onboarding "Collega CardTrader" completa senza 404, con errore gestito e localizzato.
- [x] Decisione prodotto esplicita: DEMO pubblica e utilizzabile fino al lancio, con ordini mock.
- [ ] Recovery marketplace verificato anche in staging.
- [ ] Suite verdi ovunque; deploy con rollback tag; runbook aggiornato.

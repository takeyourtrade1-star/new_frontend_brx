# Piano 14 — Backend Scambi

> Obiettivo: dare agli scambi un backend vero — stabile, sicuro, senza duplicazioni
> d'inventario — riusando lo stack e i pattern già in produzione (servizio auction).
> Scritto il 2026-07-13 dopo ricognizione completa di frontend, inventario e backend.

---

## Riassunto in 10 righe

1. Oggi gli scambi sono **solo UI**: dati mock, nessun endpoint, nessuna persistenza.
2. Il backend nuovo nasce come **modulo `/trades` dentro il servizio auction** (repo `ebartex-devs/auction`): stesso DB dell'inventario → transazioni atomiche vere.
3. Uno scambio è una **vendita bilaterale senza denaro**: proposta → accettazione → spedizione incrociata → conferma di entrambi → completato.
4. L'inventario si protegge con l'**escrow**: all'accettazione le carte vengono scalate (congelate); alla conferma di entrambi vengono accreditate all'altro; se salta tutto, tornano indietro. Mai duplicazioni, mai quantità negative.
5. Ogni cambio di stato è **una transazione DB con lock di riga** + riga di storico append-only (stesso pattern degli ordini d'asta).
6. La **controproposta** è un nuovo scambio collegato al precedente (catena tracciabile).
7. **Crediti/conguaglio: rinviati** — i campi esistono a schema ma devono valere 0; la UI li nasconde dietro feature flag. Si attivano quando arrivano i pagamenti.
8. **Indirizzi di spedizione**: oggi non esistono in piattaforma → snapshot per-scambio (proposer alla proposta, receiver all'accettazione; visibili all'altro solo dopo l'accettazione).
9. v1 scambia solo item **non sincronizzati su CardTrader** (`external_stock_id IS NULL`): regola **verificata sul codice di brx_sync** — quelle righe non vengono mai toccate da nessun percorso di sync; le righe CardTrader invece verrebbero sovrascritte.
10. Sei fasi: fondamenta backend → accettazione+escrow → consegna+completamento → BFF → wiring frontend → hardening. Ogni fase finisce verde e testabile.

---

## 1. Cosa esiste oggi (ricognizione 2026-07-13)

### Frontend (questo repo)
- UI completa ma **100% mock**: proposte ricevute da `mock-received-proposals.ts`, inventari finti `MOCK_INVENTORY_A/B`, valori € finti (`card-mock-value.ts`), submit che non chiama nessuna API (redirect o `alert()`).
- **Due UI di proposta divergenti**: il wizard `TradeProposalPage` + `TradeComposer` (attuale, inventari mock) e il vecchio `ScambiProponiModal` (1550 righe, usa l'inventario reale via `syncClient` solo lato offerta). Vanno unificate.
- Tab "inviate" e "conclusi" sono **vuote per design**: non esiste alcun modello dati per proposte inviate o scambi conclusi.
- **Nessuna azione di spedizione/conferma** esiste in UI: solo copy descrittivo.
- Crediti/compensazione compaiono in: step "Crediti" del wizard, `MoneyField`/`MoneyChip`/`AnimatedBalanceScale`, regola di equità ±10/15% (mock). Consegna: scelta `direct` vs `intermediary` (soglia €100).

### Backend (org GitHub `ebartex-devs`: `auth`, `auction`, `search`, `frontend`)
- Stack comune: **FastAPI + SQLAlchemy 2 async + PostgreSQL 16 + Redis + Alembic**, deploy **ECS Fargate** via GitHub Actions (build → ECR → migrazione one-off → update service). Job schedulati: EventBridge → Lambda → endpoint `/internal/*` protetti da `X-Internal-Token`.
- **DB oggi condiviso** tra i servizi (transizione verso DB-per-servizio in corso ma non completata): il dump `ebartex_schema_completo.sql` contiene auth+auction+inventario insieme; il servizio auth legge `user_inventory_items` in raw SQL.
- Il servizio **auction** è il riferimento: possiede già ordini (`orders` con stati `PAYMENT_PENDING…DELIVERED`), storico transizioni append-only (`order_status_history`), notifiche generiche (`related_kind`/`related_id`), dispute con chat, rate limit Redis, idempotenza (`Idempotency-Key` + vincoli unici), lock di riga (`SELECT FOR UPDATE` + `lock_timeout`), task post-commit per email/notifiche.
- **L'inventario è nel suo stesso DB**: `user_inventory_items` (id BigInt, `user_id` UUID, `blueprint_id`, `quantity`, `price_cents`, `properties` JSONB con condizione/lingua, `external_stock_id` CardTrader, `graded`; vincolo unico `user_id+blueprint_id+external_stock_id`).
- **Pagamenti**: stub (`payOrder` mock) — coerente con la scelta di rinviare i crediti.
- **Mancano ovunque**: indirizzi postali (nessuna tabella in tutta la piattaforma) e qualunque traccia di trades/scambi (campo libero).

### Servizio Sync (brx_sync) — verificato sul codice
Repo trovato: `takeyourtrade1-star/brx_sync` (snapshot 2026-02-23). Fatti che contano per gli scambi:
- **Ogni percorso di scrittura del Sync aggancia le righe per `(user_id, blueprint_id, external_stock_id)`**: bulk sync iniziale (upsert), pull manuale da CardTrader (sovrascrittura **assoluta** di quantità/prezzo), webhook CardTrader (delta su vendite/annulli). **Le righe con `external_stock_id NULL` non vengono mai toccate**, e non esiste alcun passo di cancellazione/riconciliazione delle righe assenti da CardTrader.
- Non c'è sync periodico automatico (niente Celery beat): i pull partono solo su azione utente/API; i webhook però arrivano in qualsiasi momento.
- Le righe **CardTrader-linked** sono pericolose per un escrow: un sync manuale sovrascriverebbe la quantità col valore assoluto di CardTrader (cancellando il nostro decremento), e i webhook applicano delta senza lock né dedup.
- **Nessuna API interna S2S**: un altro servizio non può chiedere al Sync di scalare stock con propagazione a CardTrader (ogni endpoint richiede il JWT dell'utente stesso).
- Bug notati di passaggio (non bloccano gli scambi, meritano un fix a parte in brx_sync): l'endpoint purchase rilascia il lock di riga *prima* di scrivere il decremento (lost-update possibile tra acquisti concorrenti); i webhook loggano ma non rifiutano firme non valide e non hanno dedup (un webhook rispedito applica il delta due volte).

### Cosa resta non verificabile
- Il repo del servizio **marketplace** (porta 8004, dove vive `SyncMode demo/partial/real`) non è accessibile da nessun account — non serve per la v1.
- Lo snapshot di brx_sync ha ~5 mesi: prima della Fase 2 confermare che il deploy attuale non abbia cambiato le regole di matching (vedi §10).

---

## 2. Decisioni architetturali (con motivazione)

| # | Decisione | Perché |
|---|-----------|--------|
| **D1** | Il backend scambi è un **modulo dentro il servizio auction** (router `/trades`), non un microservizio nuovo | L'inventario è nello stesso DB → l'accettazione può scalare le carte **nella stessa transazione** che cambia stato allo scambio. Un servizio separato dovrebbe fare saga HTTP con molti più modi di fallire. Inoltre riusa gratis: notifiche, email, auth JWT, rate limit, deploy. Il codice va tenuto ben separato (file `trade_*`) così da poterlo estrarre quando il DB verrà davvero diviso. |
| **D2** | **Escrow all'accettazione, trasferimento al completamento**: le carte si scalano dal proprietario quando lo scambio è accettato; si accreditano all'altro solo quando **entrambi** confermano la ricezione | "Si tolgono dall'inventario" appena il patto è vincolante (non vendibili altrove), ma non compaiono nell'inventario dell'altro finché non le ha fisicamente. Se lo scambio salta, il ripristino è esatto (abbiamo lo snapshot). |
| **D3** | **Nessuna prenotazione alla proposta**; vince il primo che accetta | Prenotare alla proposta bloccherebbe l'inventario per giorni su proposte che magari nessuno accetta. La stessa carta può stare in più proposte: alla prima accettazione le altre falliranno la validazione (con messaggio chiaro). |
| **D4** | **Controproposta = nuovo scambio** con `parent_trade_id`; l'originale passa a `COUNTERED` | Ogni scambio resta immutabile dopo la creazione → storico pulito, niente ambiguità su "chi ha proposto cosa", catena consultabile. |
| **D5** | **Indirizzi snapshot per-scambio** (tabella `trade_parties`), niente rubrica indirizzi globale per ora | La rubrica indirizzi è un progetto a sé (serve anche ai pagamenti). Il proposer dà l'indirizzo alla proposta, il receiver all'accettazione; ognuno vede l'indirizzo dell'altro **solo da ACCEPTED in poi**. |
| **D6** | **Crediti rinviati**: colonne `offered_credits_cents`/`requested_credits_cents` a schema ma vincolate a 0 (validazione server); UI dietro flag `scambiCreditsEnabled=false` | Richiesta esplicita: si attivano quando i pagamenti veri esistono. Tenere le colonne evita una migrazione futura e mantiene il payload stabile. |
| **D7** | **v1 solo consegna diretta** (spedizione incrociata tra utenti); "intermediario Ebartex" resta a schema (`delivery_method`) ma non selezionabile | L'intermediario richiede operatività interna (ricezione, verifica, rispedizione) che oggi non esiste. |
| **D8** | **Tradabilità v1**: un item è scambiabile solo se `quantity > 0` **e** `external_stock_id IS NULL` (cioè non è stock sincronizzato su CardTrader) | **Verificato sul codice di brx_sync**: le righe con external NULL non vengono mai toccate da nessun percorso di sync → l'escrow è al sicuro per costruzione. Le righe CardTrader invece verrebbero sovrascritte dai pull manuali e mosse dai webhook. Allargare la regola richiederà un endpoint interno S2S su brx_sync che propaghi a CardTrader (oggi non esiste). |
| **D9** | Il **valore in €** mostrato in UI è il `price_cents` dichiarato dal proprietario, **informativo**; la regola di equità ±10/15% non è applicata dal server in v1 | Non esiste un servizio di prezzi di mercato; imporre soglie su valori dichiarati dai proprietari non protegge nessuno. Restano i limiti strutturali (max item, validazioni). |

---

## 3. Modello dati (4 tabelle nuove, migrazione Alembic nel repo auction)

Tutte con lo stile già in uso: id `BigInteger`, utenti come `UUID` senza FK (arrivano dal JWT), `NUMERIC`/`Integer` per i soldi, timestamptz.

### `trades`
| Campo | Tipo | Note |
|---|---|---|
| `id` | BigInt PK | |
| `proposer_id`, `receiver_id` | UUID | chi propone / chi riceve |
| `proposer_display_name`, `receiver_display_name` | String(128) | snapshot alla creazione (client interno auth, come per gli ordini) |
| `status` | String(32) | vedi macchina a stati |
| `message` | Text | messaggio del proposer (max 2000) |
| `delivery_method` | String(16) | `direct` (v1); `intermediary` riservato |
| `parent_trade_id` | BigInt FK→trades, null | catena controproposte |
| `offered_credits_cents`, `requested_credits_cents` | Integer default 0 | **devono essere 0 in v1** (check + validazione) |
| `due_at` | timestamptz | scadenza proposta (default +7 giorni) |
| `accepted_at`, `completed_at`, `cancelled_at` | timestamptz null | |
| `cancellation_reason` | String(255) null | |
| `created_at`, `updated_at` | timestamptz | |

### `trade_items` — le carte sul tavolo
| Campo | Tipo | Note |
|---|---|---|
| `id`, `trade_id` FK CASCADE | | |
| `direction` | String(8) | `offered` (dal proposer) / `requested` (dal receiver) |
| `owner_user_id` | UUID | proprietario di partenza |
| `inventory_item_id` | BigInt, **senza FK** | riferimento morbido a `user_inventory_items.id` (il Sync può cancellare righe; la validazione all'accettazione se ne accorge) |
| `quantity` | Integer > 0 | può essere parte della quantità posseduta (2 copie su 4) |
| `blueprint_id`, `price_cents`, `properties` JSONB, `description`, `graded` | | **snapshot congelato alla proposta**: permette di mostrare la proposta anche se l'item cambia, di rilevare modifiche, e di ricreare la riga in caso di ripristino |
| `escrowed_at` | timestamptz null | quando è stata scalata dall'inventario |
| `released_at`, `release_target` | timestamptz null, String(16) | `receiver_credited` (trasferita) o `returned_to_owner` (ripristinata) — garantisce che ogni item venga rilasciato **una volta sola** |

### `trade_parties` — i due partecipanti (spedizione)
| Campo | Note |
|---|---|
| `trade_id` + `user_id` PK composta, `role` (`proposer`/`receiver`) | |
| `ship_full_name`, `ship_street`, `ship_city`, `ship_zip`, `ship_province`, `ship_country`, `ship_phone` | snapshot indirizzo (null finché non inserito) |
| `address_submitted_at` | |
| `shipped_at`, `tracking_carrier`, `tracking_code` | "ho spedito il mio pacco" |
| `receipt_confirmed_at` | "ho ricevuto il pacco dell'altro" |

### `trade_status_history` — audit append-only
Identica a `order_status_history`: `trade_id`, `from_status`, `to_status`, `actor_user_id` (null = sistema), `reason`, `payload_json`, `created_at`. **Ogni** transizione scrive qui.

### Notifiche (tabella esistente, zero DDL)
Nuovi `type`: `trade_proposed`, `trade_countered`, `trade_accepted`, `trade_declined`, `trade_cancelled`, `trade_shipped`, `trade_completed`, `trade_expiring`, `trade_expired`, `trade_assistance`. Con `related_kind='trade'`, `related_id=trade.id`. Email post-commit sui momenti chiave (proposta, accettazione con istruzioni spedizione, completamento).

---

## 4. Macchina a stati

```
                 ┌──────────── DECLINED      (receiver rifiuta)
                 ├──────────── CANCELLED     (proposer ritira, prima dell'accettazione)
                 ├──────────── EXPIRED       (job: due_at superato)
  PROPOSED ──────┼──────────── COUNTERED     (receiver contro-propone → nasce trade figlio PROPOSED)
                 │
                 └── ACCEPTED  ← qui scatta l'ESCROW (carte scalate da entrambi)
                        │
                        ├── COMPLETED        (entrambi hanno confermato la ricezione → trasferimento)
                        ├── CANCELLED        (annullo consensuale: uno chiede, l'altro conferma → ripristino)
                        └── DISPUTED         (richiesta assistenza → blocco, risoluzione manuale admin
                                              → COMPLETED oppure CANCELLED con ripristino)
```

Regole ferree:
- Ogni transizione = **una transazione DB**: `SELECT … FOR UPDATE` sullo scambio (+ `lock_timeout` 1500ms come nel bidding), verifica dello stato di partenza ("compare-and-set"), scrittura storico, notifiche. Due click simultanei → uno vince, l'altro riceve errore chiaro.
- Stati terminali: `DECLINED`, `CANCELLED`, `EXPIRED`, `COUNTERED`, `COMPLETED`. Da lì non si muove più nulla.
- `SHIPPED` non è uno stato globale: è per-partecipante (`shipped_at` su `trade_parties`), perché le due spedizioni sono indipendenti.

### La transazione di accettazione (il cuore del sistema)
1. Lock dello scambio; verifica: status `PROPOSED`, chiamante = receiver, non scaduto, crediti = 0.
2. Lock di **tutte** le righe inventario coinvolte, in ordine di `id` (ordine deterministico → niente deadlock tra accettazioni concorrenti).
3. Per ogni item: la riga esiste ancora, appartiene ancora al proprietario previsto, è tradabile (D8), `quantity` sufficiente, e `blueprint_id`+`properties` **coincidono con lo snapshot** (se nel frattempo la carta è stata modificata, errore `TRADE_ITEM_CHANGED`: chi accetta deve rivedere la proposta).
4. Scala le quantità con update "guardato" (`UPDATE … SET quantity = quantity - n WHERE id = … AND quantity >= n` — doppia difesa oltre al lock; **non** copiare il pattern del purchase di brx_sync, che rilegge un valore stantio), la riga resta anche a 0; marca `escrowed_at`.
5. Salva l'indirizzo del receiver (obbligatorio nel body dell'accept).
6. Stato → `ACCEPTED`, storico, notifiche a entrambi; email con indirizzi e istruzioni **solo post-commit**.
7. Commit. Se qualunque passo fallisce → rollback totale: o tutto o niente.

### Il completamento
Alla **seconda** conferma di ricezione (lock sullo scambio): per ogni item escrowed e non ancora rilasciato → crea una **riga nuova** in `user_inventory_items` per il destinatario (stesso blueprint, stesse properties, `external_stock_id NULL`, `price_cents` dello snapshot come valore di partenza), marca `released_at` + `receiver_credited`, stato → `COMPLETED`. Tutto in una transazione: il vincolo "released una volta sola" + il CAS sullo stato rendono **impossibile** la doppia consegna anche con retry o doppi click.

### Il ripristino (annullo post-accettazione / risoluzione dispute)
Per ogni item escrowed: se la riga originale esiste ancora ed è ancora del proprietario → `quantity += n`; altrimenti si **ricrea la riga dallo snapshot**. Marca `returned_to_owner`. Stessa transazione del cambio stato.

---

## 5. Casistiche coperte (checklist esplicita)

| Caso | Gestione |
|---|---|
| Due utenti accettano nello stesso istante scambi che contengono la stessa carta | Lock inventario in ordine deterministico: il primo commit vince, il secondo fallisce la validazione quantità con errore chiaro |
| La carta viene venduta/cancellata (via Sync o marketplace) mentre la proposta è aperta | Nessuna prenotazione alla proposta (D3) → all'accettazione la validazione fallisce: "item non più disponibile" |
| La carta viene modificata (condizione, lingua) dopo la proposta | Confronto con lo snapshot → `TRADE_ITEM_CHANGED`, la proposta va rivista |
| Stessa carta offerta in 5 proposte diverse | Consentito; la prima accettazione scala la quantità, le altre falliranno all'accettazione. La GET di dettaglio ricalcola la disponibilità così la UI può mostrare "non più disponibile" già prima |
| Quantità parziali (offro 2 copie delle 4 che ho) | `trade_items.quantity` per-item, validato ≤ posseduto |
| Doppio click / retry di rete su propose/accept/confirm | `Idempotency-Key` su tutte le POST (pattern bids) + CAS sullo stato: replay → stessa risposta, mai doppio effetto |
| Proposta ignorata per sempre | `due_at` (+7gg): job schedulato la porta a `EXPIRED` (promemoria a −24h). Nessun escrow da ripulire perché a `PROPOSED` non si congela nulla |
| Il proposer ci ripensa | `cancel` consentito solo a `PROPOSED` |
| Il receiver rifiuta | `decline`, opzionale motivo; stato terminale |
| Controproposta | Nuovo trade collegato; l'originale chiude a `COUNTERED`; catena visibile |
| Uno dei due non spedisce mai | Promemoria automatici; dopo N giorni ciascuno può chiedere assistenza → `DISPUTED`, risoluzione manuale (completa o annulla+ripristina). Niente auto-completamento: le carte non si assegnano mai da sole |
| Annullo dopo l'accettazione | Solo consensuale (uno propone l'annullo, l'altro conferma) o via assistenza → ripristino esatto dall'escrow |
| Item con stock su CardTrader | Escluso dalla tradabilità v1 (D8) → mai drift col marketplace esterno |
| Un sync CardTrader (webhook o pull manuale) gira mentre uno scambio è in corso | Gli item scambiabili hanno `external_stock_id NULL`: nessun percorso di scrittura del Sync li tocca (verificato nel codice brx_sync); gli item CardTrader sono fuori dalla tradabilità v1 |
| Utente estraneo prova a leggere/agire su uno scambio altrui | Ogni endpoint verifica chiamante ∈ {proposer, receiver}; altrimenti **404** (niente enumerazione degli id) |
| Payload malevoli | Item "requested" devono appartenere al receiver, "offered" al chiamante — sempre riverificati su DB; max 30 item per lato; messaggio ≤ 2000; crediti = 0; rate limit per-IP (tier default) |
| Scambio con se stessi | Rifiutato (`proposer_id != receiver_id`) |
| Audit / contestazioni future | `trade_status_history` append-only con attore e motivo per ogni transizione |

---

## 6. API

### Backend (servizio auction, router `/trades`, JWT obbligatorio ovunque)
| Metodo e path | Chi | Cosa fa |
|---|---|---|
| `POST /trades` | proposer | Crea proposta: `{receiver_id, offered:[{inventory_item_id, quantity}], requested:[…], message?, delivery_method, ship_address}` + `Idempotency-Key` |
| `GET /trades?role=received\|sent&status=…` | partecipante | Liste paginate (tab richieste/inviate/conclusi) |
| `GET /trades/{id}` | partecipante | Dettaglio con item, disponibilità ricalcolata, indirizzi (solo se ≥ ACCEPTED), stato spedizioni |
| `GET /trades/{id}/history` | partecipante | Storico transizioni |
| `POST /trades/{id}/accept` | receiver | Accettazione (body: indirizzo) — la transazione del §4 |
| `POST /trades/{id}/decline` | receiver | Rifiuto (+ motivo opzionale) |
| `POST /trades/{id}/cancel` | proposer | Ritiro (solo PROPOSED) |
| `POST /trades/{id}/counter` | receiver | Controproposta (body come create) → trade figlio |
| `POST /trades/{id}/ship` | ciascuno | Segna il proprio pacco spedito (+ tracking opzionale) |
| `POST /trades/{id}/confirm-receipt` | ciascuno | Conferma ricezione del pacco altrui; alla seconda → COMPLETED |
| `POST /trades/{id}/request-cancel` / `confirm-cancel` | ciascuno | Annullo consensuale post-accettazione |
| `POST /trades/{id}/assistance` | ciascuno | Segnala problema → DISPUTED |
| `POST /internal/expire-trades` | EventBridge | Scadenze batch (pattern `close-expired`) |
| `POST /internal/resolve-trade` | admin/ops | Risoluzione manuale DISPUTED (completa o annulla) |

Errori: `{detail, code}` col catalogo esistente (`AppError`), + codici nuovi (`TRADE_NOT_FOUND`, `TRADE_INVALID_STATE`, `TRADE_ITEM_UNAVAILABLE`, `TRADE_ITEM_CHANGED`, `TRADE_CREDITS_DISABLED`…).

### BFF (questo repo)
- Nuovo `app/api/trades/[...path]/route.ts` sul template di `app/api/auctions/[...path]/route.ts`, con una differenza: **fail-closed anche sulle GET** (gli scambi sono privati, niente pass-through pubblico). Rate limit 60/min, timeout 12s, `no-store`, forward di `Idempotency-Key`/`X-Request-ID`, target `AUCTION_API_URL` (già configurato).
- Test in `bff-security` per i casi senza cookie (tutti 401).

---

## 7. Modifiche frontend

1. **Client + hook**: `lib/api/trades-client.ts` (fetch verso `/api/trades/*`, retry 401 via `tokenManager` come gli altri client) e `lib/hooks/use-trades.ts` (React Query: liste per tab, dettaglio, mutazioni con invalidation).
2. **Tab reali** in `ScambiContent`: `richieste` = ricevute PROPOSED; `inviate` = inviate PROPOSED/COUNTERED; `conclusi` = ACCEPTED/COMPLETED/terminali. Via i mock (`mock-received-proposals.ts`).
3. **Dettaglio proposta** (`ReceivedProposalDetail`): wire di accetta (con form indirizzo), rifiuta, contro-proponi; poi sezione consegna: indirizzi, "ho spedito" (+tracking), "ho ricevuto", stato dell'altro lato.
4. **Composer unificato**: `TradeProposalPage`+`TradeComposer` diventa l'unico flusso; lato "offro" = il **mio inventario reale** filtrato tradabile (hook account inventory esistente + filtro D8); lato "chiedo" = **collezione pubblica** del receiver (hook `use-public-user-collection` esistente) filtrata tradabile. `ScambiProponiModal` si ritira (già previsto dal backlog di refactor). Gli entry-point da pagina prodotto risolvono venditore+blueprint → item dell'inventario pubblico; se l'item non è tradabile → "non scambiabile".
5. **Crediti nascosti**: flag `scambiCreditsEnabled=false` in `lib/config/features.ts`; step "Crediti" saltato, `MoneyField`/bilancia rimossi dal flusso attivo (la bilancia può restare informativa usando i `price_cents` reali al posto dei valori mock).
6. **Notifiche**: aggiungere i type `trade_*` a `types/notification.ts` + deep-link a `/scambi`.
7. **i18n**: ogni stringa nuova in **tutti e 6** i locale + `npm run i18n:keys`.

---

## 8. Fasi di lavoro

Ogni fase chiude con typecheck/lint/test verdi ed è utilizzabile/testabile da sola.
Le fasi 1–3 sono nel repo `ebartex-devs/auction` (pytest + curl su dev), 4–5 in questo repo.

### Fase 1 — Fondamenta backend
Migrazione Alembic (4 tabelle), modelli, schemi Pydantic, repository; endpoint: create (con validazione proprietà/tradabilità/limiti), liste, dettaglio, history, decline, cancel; notifiche di proposta/rifiuto/ritiro; job scadenza (`/internal/expire-trades`); unit test.
**Criteri**: flusso proposta→rifiuto/ritiro/scadenza completo via curl su dev; storico scritto per ogni transizione; utente estraneo → 404; crediti ≠ 0 → 422.

### Fase 2 — Accettazione con escrow + controproposta
La transazione di accettazione (§4), counter con catena, idempotenza su tutte le POST, **test di concorrenza su DB reale** (modello: `test_bidding_concurrency_db_integration.py`): due accept simultanee su item sovrapposti → esattamente una vince; inventario mai negativo.
**Criteri**: i test di concorrenza passano; item modificato → `TRADE_ITEM_CHANGED`; item CardTrader → rifiutato.

### Fase 3 — Consegna e completamento
Ship/confirm-receipt, trasferimento al completamento (righe nuove al destinatario), annullo consensuale post-accettazione con ripristino esatto, promemoria, `assistance`→DISPUTED + `/internal/resolve-trade`.
**Criteri**: doppia conferma → una sola consegna anche con retry; ripristino ricrea esattamente quantità/properties; a fine scambio la somma delle carte nel sistema è invariata (test dedicato); l'accredito funziona anche per un utente **senza** riga `user_sync_settings` (verifica FK, §10.2).

### Fase 4 — BFF
Route handler `app/api/trades/[...path]`, test bff-security, client TS + tipi.
**Criteri**: `npm run typecheck`/`lint`/`test` verdi; senza cookie tutto 401; con cookie il proxy funziona contro dev.

### Fase 5 — Wiring frontend
Hook React Query, tab reali, dettaglio con azioni, composer unificato su inventari reali, sezione consegna, crediti dietro flag, notifiche, i18n ×6.
**Criteri**: scambio completo end-to-end tra due utenti reali su dev **senza alcun mock**; `npm run i18n:keys` verde; mock file eliminati.

### Fase 6 — Hardening e ops
Metriche (contatori transizioni/escrow), schedule EventBridge in infra, runbook per DISPUTED, README del modulo nel repo auction, smoke test in staging, review sicurezza finale (authz, rate limit, input caps, log senza PII).
**Criteri**: checklist sicurezza firmata; runbook provato su un caso DISPUTED simulato.

---

## 9. Fuori scope v1 (esplicito)

- **Crediti/conguaglio** e qualsiasi compensazione in denaro (D6) — dopo i pagamenti.
- **Intermediario Ebartex** (deposito e verifica centrale) — resta a schema (D7).
- **Item sincronizzati CardTrader** e listing del marketplace fixed-price (D8).
- **Rubrica indirizzi** riusabile e integrazione corrieri/etichette.
- **Chat** sullo scambio (c'è solo il messaggio della proposta); dispute complete con chat (c'è l'assistenza minima).
- **Valore di mercato reale** delle carte e equità imposta dal server (D9).

## 10. Rischi e verifiche da fare

1. **Snapshot brx_sync datato (2026-02-23)**: le regole di matching per `external_stock_id` sono verificate su quel codice; prima della Fase 2 confermare che il servizio deployato non le abbia cambiate (basta rileggere `sync_tasks.py`/`webhook_processor.py` nella versione attuale, o chiedere a chi lo mantiene).
2. **DB condiviso in produzione + vincolo FK su `user_id`**: da confermare con una query in dev prima della Fase 1 (`user_inventory_items` visibile dalla connessione del servizio auction, e `\d user_inventory_items` per il vincolo). Nella storia del progetto esistono **tre DDL divergenti** per `user_id`: nessuna FK (`schema.sql` di brx_sync), FK→`users(id)`, FK→`user_sync_settings.user_id` (ORM brx_sync). Se in prod fosse attiva la FK verso `user_sync_settings`, l'accredito a un utente che non ha mai configurato CardTrader fallirebbe → test dedicato in Fase 3.
3. **Deploy backend**: la CI del repo auction (GitHub Actions → ECS) esiste; serve confermare che il tuo account possa lanciarla o che ci sia chi la lancia.
4. **Righe inventario a quantità 0**: verificare come le mostrano frontend e Sync (le teniamo a 0 invece di cancellarle per semplificare i ripristini).
5. Quando il DB verrà separato per servizio, l'escrow atomico andrà ripensato (saga o spostamento dell'inventario) — il confine netto del modulo (D1) serve esattamente a quello.

## 11. Criteri di accettazione complessivi

- [ ] Due utenti reali completano uno scambio end-to-end su dev: proposta → accettazione → doppia spedizione → doppia conferma → carte trasferite.
- [ ] In nessuno scenario testato (concorrenza, retry, annulli, dispute) l'inventario totale del sistema cambia se non per il trasferimento previsto; mai quantità negative, mai duplicazioni.
- [ ] Ogni transizione è nello storico con attore e motivo.
- [ ] Un utente non partecipante non può né leggere né agire (404).
- [ ] Crediti disattivati ovunque (server rifiuta ≠ 0, UI non li mostra).
- [ ] Suite: pytest (unit + concorrenza) nel repo auction; typecheck/lint/test/i18n:keys verdi in questo repo; bff-security aggiornata.

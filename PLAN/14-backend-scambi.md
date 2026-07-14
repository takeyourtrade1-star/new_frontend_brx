# Piano 14 — Backend Scambi

> Obiettivo: dare agli scambi un backend vero — stabile, sicuro, senza duplicazioni
> d'inventario — riusando lo stack e i pattern già in produzione.
> Scritto il 2026-07-13; **riscritto il 2026-07-14** dopo che l'intero backend è
> tornato disponibile in locale (`C:\Users\xheta\BRX`, junction verso `C:\Users\xheta\repos`).

---

## Riassunto in 12 righe

1. Oggi gli scambi sono **solo UI**: dati mock, nessun endpoint, nessuna persistenza.
2. Il ciclo di vita dello scambio (proposta → accettazione → spedizione incrociata → doppia conferma → completato) vive come **modulo `/trades` nel servizio auction** (`repos\auction`), che ha già stati+storico+notifiche+email.
3. **Le mutazioni di inventario passano dal servizio proprietario**: sync per righe CardTrader/trade, marketplace per inserzioni Ebartex-only; auction orchestra entrambi via endpoint S2S idempotenti.
4. L'inventario reale è quasi tutto **collegato a CardTrader**: uno scambio deve quindi decrementare **anche CardTrader** al momento dell'accettazione (come fa già il purchase), altrimenti il **reconciler** (gira ogni 6 ore) ripristinerebbe le quantità e distruggerebbe l'escrow.
5. Le righe sync **non collegate** (`external_stock_id NULL`) e le inserzioni **Ebartex-only** (`mkt_listings.cardtrader_article_id NULL`) sono scambiabili senza CardTrader; il reconciler non le altera.
6. **Escrow all'accettazione, trasferimento alla doppia conferma**: mai duplicazioni, mai quantità negative; ogni operazione è idempotente (chiavi univoche) e compensabile.
7. Nuova colonna **`source`** su `user_inventory_items` (`cardtrader` | `trade` | `internal_test`): serve alla UI (oggi nasconde le righe NULL come "test") e rende esplicite le regole — era già l'evoluzione prevista dal piano CardTrader.
8. La **controproposta** è un nuovo scambio collegato al precedente; niente prenotazioni alla proposta: vince il primo che accetta.
9. **Crediti/conguaglio rinviati** (campi a schema, vincolati a 0, UI dietro flag) — si attivano coi pagamenti.
10. **Indirizzi di spedizione**: non esistono in piattaforma → snapshot per-scambio, visibili all'altro solo dopo l'accettazione.
11. Deploy col **pattern collaudato oggi sul sync**: build → push ECR → docker compose sull'host, con tag di rollback.
12. Sette fasi: 0) fondazioni inventario nel sync → 1) fondamenta trades → 2) accettazione (saga) → 3) consegna/completamento → 4) BFF → 5) frontend → 6) hardening. Ogni fase chiude verde e testabile.

---

## 1. Quadro verificato (ricognizione 2026-07-13, aggiornata 2026-07-14)

### Frontend (questo repo)
- UI completa ma **100% mock**: proposte ricevute hardcoded, inventari finti, valori € finti, submit che non chiama nessuna API. Due UI di proposta divergenti (`TradeProposalPage`+`TradeComposer` vs il vecchio `ScambiProponiModal`) da unificare. Tab "inviate"/"conclusi" senza modello dati. Nessuna azione spedizione/conferma. I picker degli scambi sono stati **lasciati volutamente sui mock** per permettere i test manuali (nota del piano CardTrader).
- Crediti/compensazione in più punti (step Crediti, `MoneyField`, bilancia ±10/15% su valori mock); consegna `direct` vs `intermediary` (soglia €100).

### Backend — ora tutto in locale (`C:\Users\xheta\BRX\backend\*` → `C:\Users\xheta\repos\*`)
- Stack comune: **FastAPI + SQLAlchemy 2 async + PostgreSQL 16 (RDS) + Redis + Celery**, container da ECR, **deploy = docker compose sugli host EC2** (la CI GitHub Actions→ECS del repo auction è il flusso dev). Accessi verificati da sessione precedente: SSH sugli host, AWS admin, gh.
- **`repos\auction`** (2026-07-06) = il riferimento per il dominio: ordini con stati e storico append-only (`order_status_history`), notifiche generiche (`related_kind`/`related_id`), dispute, rate limit Redis, idempotenza (`Idempotency-Key` + vincoli unici), `SELECT FOR UPDATE` + `lock_timeout`, email post-commit, Alembic. Nessuna traccia di trades.
- **`repos\sync`** (2026-07-14, **aggiornato stamattina**) = il servizio inventario. Novità di oggi già **deployate in produzione**:
  - **Reconciler v2** (`app/services/reconciler.py`): confronta l'export CardTrader con le righe locali **solo `external_stock_id NOT NULL`** e applica quantità/prezzi con update ottimistici; azzeramento solo alla 2ª snapshot consecutiva; mai hard delete; mai scritture verso CT. **"Le righe interne (external_stock_id NULL) non vengono mai toccate"** (docstring riga 21 + select riga 281-287). Gira ogni 6 ore (Celery beat) + endpoint manuale.
  - **Purchase v2** (`app/api/v1/routes/sync.py:916+`): prenotazione atomica con `UPDATE … WHERE quantity >= n` in transazione breve, CardTrader chiamato **fuori dai lock**, ripristino della prenotazione su errore. Il TOCTOU segnalato nella prima versione di questo piano è **fixato**.
  - **Webhook**: firma HMAC ora obbligatoria, endpoint legacy disabilitato, dedup idempotente via Redis persistente. Anche questo bug segnalato è **fixato**.
  - Client CardTrader completo: `increment_product_quantity` (delta ±, CT auto-cancella a quantità ≤0), `delete_product`, `check_product_availability`, `get_products_export`, bulk update/create.
  - Test d'integrazione con **Postgres usa-e-getta** (`tests/integration`) — harness riusabile per i nuovi endpoint.
  - **Nessuna API interna S2S**: oggi ogni endpoint richiede il JWT dell'utente. Da creare (Fase 0).
- **Decisione di prodotto già presa (2026-07-14)**: le inserzioni create su Ebartex **non si esportano mai** su CardTrader; CT = solo import + decremento/delete post-vendita (protezione oversell). Gli scambi si allineano: un accredito da scambio non crea nulla su CT.
- **DB**: RDS `ebartex-db-postgres` PG 16.13; il sync punta al db `ebartex_auth_db`, dove vive `user_inventory_items` (unique `user_id+blueprint_id+external_stock_id`, condizione/lingua in `properties` JSONB). Il DB è condiviso tra i servizi (il dump storico mescola auth+auction+inventario; auth legge l'inventario in raw SQL; la migration 001 di auction crea proprio queste tabelle). **Verifica formale in Fase 0** che anche auction punti allo stesso db.
- **Marketplace** (porta 8004): sorgente recuperato in `repos\brx-marketplace`; possiede le inserzioni Ebartex-only e partecipa alla v1 scambi con snapshot/riserva/rilascio S2S.
- **Mancano ovunque**: indirizzi postali (nessuna tabella in piattaforma) e qualsiasi traccia di trades. Pagamenti: stub.
- In produzione il sync ha **pochi utenti attivi** (bonifica account test fatta oggi): superficie di rischio v1 minima.

---

## 2. Decisioni architetturali (con motivazione)

| # | Decisione | Perché |
|---|-----------|--------|
| **D1** | Il ciclo di vita degli scambi è un **modulo `/trades` dentro il servizio auction** | Riusa gratis: macchina a stati con lock, storico append-only, notifiche, email, auth JWT, rate limit, Alembic, deploy. Codice ben separato (file `trade_*`) per poterlo estrarre in futuro. |
| **D2** | **Ogni mutazione passa dal servizio proprietario via endpoint S2S idempotenti**: sync per `user_inventory_items`, marketplace per `mkt_listings`; auction orchestra e compensa | Il sync resta l'unico proprietario della logica CardTrader. Marketplace applica l'escrow locale sulla stessa riga usata dalla vendita Ebartex, evitando oversell senza imporre CardTrader. |
| **D3** | **Escrow all'accettazione, trasferimento alla doppia conferma di ricezione**; ripristino esatto se lo scambio salta | Le carte "si tolgono" quando il patto è vincolante, compaiono all'altro quando le ha davvero. Snapshot per-item congelato alla proposta → ripristini esatti e rilevamento modifiche. |
| **D4** | **Le righe CardTrader-linked si scambiano decrementando anche CT all'accettazione** (stesso schema del purchase v2: riserva locale condizionale → chiamata CT fuori dai lock → compensazione); ripristino = increment CT + locale | **Obbligatorio, verificato nel codice**: il reconciler riallinea ogni 6h le righe CT-linked alla verità CardTrader — un decremento solo locale verrebbe annullato al giro dopo. Decrementando CT in pari passo, export e locale coincidono e il reconciler non ha nulla da correggere. È anche coerente col prodotto: per l'oversell uno scambio È una vendita. |
| **D5** | **Le righe con `external_stock_id NULL` si gestiscono direttamente** (decremento/accredito locale, senza CT) | Verificato nel reconciler: le righe interne non vengono mai toccate da nessun percorso del sync → sicure per costruzione. Le carte **ricevute negli scambi** nascono così (`source='trade'`), quindi diventano subito ri-scambiabili in modo sicuro. |
| **D6** | Nuova colonna **`source`** su `user_inventory_items`: `cardtrader` (backfill: external NOT NULL), `internal_test` (backfill: external NULL esistenti — oggi sono mock), `trade` (accrediti scambi) | La UI attuale (compose inventario) nasconde le righe NULL come "test interni": senza un campo esplicito le carte ricevute in scambio sarebbero invisibili. Nel sync sono tradabili `cardtrader` e `trade`; le inserzioni Ebartex-only arrivano separatamente dal marketplace. |
| **D7** | **Niente prenotazione alla proposta**; vince il primo che accetta; stessa carta ammessa in più proposte | Prenotare alla proposta bloccherebbe l'inventario per giorni. All'accettazione si rivalida tutto; le proposte concorrenti falliranno con errore chiaro. |
| **D8** | **Controproposta = nuovo scambio** con `parent_trade_id`; l'originale passa a `COUNTERED` | Scambi immutabili dopo la creazione → storico pulito, catena consultabile. |
| **D9** | **Indirizzi snapshot per-scambio** (proposer alla proposta, receiver all'accettazione; visibili all'altro solo da ACCEPTED) | La rubrica indirizzi è un progetto a sé (servirà anche ai pagamenti). |
| **D10** | **Crediti rinviati**: colonne a schema vincolate a 0; UI dietro flag `scambiCreditsEnabled=false`. **Consegna v1 solo `direct`** (l'intermediario Ebartex resta a schema) | Richiesta esplicita; l'intermediario richiede operatività che non esiste. |
| **D11** | Il **valore €** mostrato è il `price_cents` dichiarato, informativo; la regola ±10/15% non è imposta dal server | Non esiste un servizio prezzi di mercato; restano i limiti strutturali. |
| **D12** | **Le inserzioni Ebartex-only sono scambiabili dalla v1**; quelle CardTrader-linked continuano a usare il sync | Gli scambi non richiedono vendite o pagamenti attivi. L'escrow marketplace decrementa atomicamente `mkt_listings.quantity`; la vendita Ebartex e lo scambio competono sulla stessa riga. |

---

## 3. Modello dati

### Nel servizio **auction** (migrazione Alembic nuova) — 4 tabelle
Stile esistente: id `BigInteger`, utenti `UUID` senza FK (dal JWT), timestamptz.

**`trades`** — `id`; `proposer_id`, `receiver_id` (+ display name snapshot); `status`; `message` (≤2000); `delivery_method` (`direct`); `parent_trade_id` FK→trades; `offered_credits_cents`/`requested_credits_cents` (default 0, **check = 0 in v1**); `due_at` (default +7gg); `accepted_at`, `completed_at`, `cancelled_at`, `cancellation_reason`; timestamps.

**`trade_items`** — `trade_id` FK CASCADE; `direction` (`offered`/`requested`); `owner_user_id`; `inventory_source` (`sync`/`marketplace`) e riferimento esclusivo `inventory_item_id` oppure `marketplace_listing_id`; `quantity` (>0, anche parziale); **snapshot congelato alla proposta**: `blueprint_id`, `price_cents`, `properties` JSONB, `description`, `graded`, `was_cardtrader_linked` bool; **tracking escrow**: `escrowed_at`, `released_at`, `release_target` (`receiver_credited`/`returned_to_owner`/`returned_as_new_row`) — garantiscono rilascio **una volta sola**.

**`trade_parties`** — PK (`trade_id`,`user_id`), `role`; indirizzo snapshot (`ship_full_name/street/city/zip/province/country/phone`, null finché non inserito), `address_submitted_at`; `shipped_at`, `tracking_carrier`, `tracking_code`; `receipt_confirmed_at`.

**`trade_status_history`** — identica a `order_status_history`: `from_status`, `to_status`, `actor_user_id` (null=sistema), `reason`, `payload_json`. Ogni transizione scrive qui.

**Notifiche** (tabella esistente, zero DDL): nuovi type `trade_proposed/countered/accepted/declined/cancelled/shipped/completed/expiring/expired/assistance`, con `related_kind='trade'`.

### Nel servizio **sync** (Fase 0)
- Colonna **`source`** su `user_inventory_items` (String, backfill come D6) + aggiornamento dei **due** modelli ORM che mappano la tabella (quello del sync e la copia nel repo auction).
- **`inventory_ops`**: registro idempotenza per gli endpoint interni — `op_key` UNIQUE (es. `trade:123:offered:reserve`), `kind`, `payload_json`, `status`, timestamps. Un retry con lo stesso `op_key` restituisce l'esito registrato, mai un doppio effetto.

### Nel servizio **marketplace** (estensione Ebartex-only)
- **`mkt_trade_inventory_ops`**: ledger idempotente per riserva/rilascio.
- Endpoint S2S `snapshot`, `reservations`, `reservations/release`, protetti dallo stesso token interno.
- Solo `cardtrader_article_id IS NULL`: gli oggetti CardTrader-linked restano sul percorso sync e non possono essere prenotati due volte.

---

## 4. Macchina a stati e transazioni

```
                 ┌──────────── DECLINED      (receiver rifiuta)
                 ├──────────── CANCELLED     (proposer ritira prima dell'accettazione)
                 ├──────────── EXPIRED       (job: due_at superato; nessun escrow da ripulire)
  PROPOSED ──────┼──────────── COUNTERED     (nasce trade figlio PROPOSED)
                 │
                 └── ACCEPTING (transitorio: prenotazioni in corso)
                        │  ok → ACCEPTED     (escrow completo su entrambi i lati)
                        │  ko → PROPOSED     (prenotazioni compensate, errore mostrato)
                        │
                     ACCEPTED
                        ├── COMPLETED        (2ª conferma di ricezione → accredito al destinatario)
                        ├── CANCELLED        (annullo consensuale → ripristino)
                        └── DISPUTED         (assistenza → blocco; risoluzione manuale → COMPLETED o CANCELLED+ripristino)
```

- Ogni transizione: **transazione con `SELECT … FOR UPDATE`** sullo scambio (+`lock_timeout` 1500ms), verifica stato di partenza, storico, notifiche; email solo post-commit. Stati terminali: DECLINED, CANCELLED, EXPIRED, COUNTERED, COMPLETED.
- `SHIPPED` non è uno stato globale: `shipped_at` per-partecipante (le due spedizioni sono indipendenti).

### Accettazione (saga a 2 gambe, sincrona nella richiesta)
1. Lock trade; verifica: `PROPOSED`, chiamante=receiver, non scaduto, crediti=0. Rivalidazione item vs snapshot nel provider proprietario (esistenza, proprietario, sorgente tradabile, quantità, `blueprint_id`+`properties` invariati — se cambiati → `TRADE_ITEM_CHANGED`). Salva indirizzo receiver. Stato → `ACCEPTING`.
2. **Gamba A**: partiziona gli item del proposer per provider. Il sync prenota le righe inventario e propaga il decremento CT quando serve; marketplace prenota atomicamente le inserzioni Ebartex-only. Ogni gruppo ha un `op_key` distinto.
3. **Gamba B**: idem per gli item del receiver. Se fallisce → release della gamba A (`op_key …:release`) e trade torna `PROPOSED` con motivo.
4. Entrambe ok → stato `ACCEPTED`, `escrowed_at` sugli item, storico, notifiche, email con indirizzi e istruzioni.
5. **Recupero**: un job interno rilascia e riporta a `PROPOSED` gli scambi rimasti in `ACCEPTING` oltre N minuti (crash a metà saga). Tutte le chiamate sono idempotenti per `op_key` → retry sicuri.

### Completamento
Alla **seconda** conferma di ricezione (lock sul trade): `POST sync /internal/credit` per ciascun destinatario — crea **righe nuove** (`source='trade'`, `external_stock_id NULL`, snapshot di blueprint/properties/price) in modo idempotente; marca `released_at`+`receiver_credited`; stato → `COMPLETED`. Il CAS sullo stato + `released_at` + `op_key` rendono impossibile la doppia consegna anche con retry.

### Ripristino (annullo consensuale post-accettazione / risoluzione assistenza)
`POST sync /internal/reservations/release`: per ogni item — riga NULL-origin → incremento locale (o ricreazione da snapshot se sparita); riga CT-linked → `increment_product_quantity(+n)` su CT **e** incremento locale guardato; se CT rifiuta (prodotto auto-cancellato a quantità 0) → **riga nuova locale** `source='trade'` con notifica all'utente ("su CardTrader l'inserzione non esiste più: ricreala tu se vuoi") — mai lasciare una riga CT-linked disallineata, il reconciler la azzererebbe. Marca `returned_to_owner`/`returned_as_new_row`.

---

## 5. Casistiche coperte (checklist esplicita)

| Caso | Gestione |
|---|---|
| Due accettazioni simultanee che toccano la stessa carta | Decrementi condizionali atomici lato sync: la prima prenota, la seconda fallisce la gamba → compensazione + errore chiaro |
| Carta venduta/cancellata (purchase, CT, marketplace) mentre la proposta è aperta | Nessuna prenotazione alla proposta: all'accettazione la rivalidazione o il decremento condizionale falliscono |
| Vendita Ebartex che corre contro l'accettazione | Vendita e scambio aggiornano la stessa `mkt_listings` sotto lock: una sola operazione consuma la quantità disponibile |
| Carta modificata (condizione/lingua/prezzo) dopo la proposta | Confronto con lo snapshot → `TRADE_ITEM_CHANGED`, proposta da rivedere |
| Stessa carta in N proposte | Ammesso; la prima accettazione vince; la GET di dettaglio ricalcola la disponibilità per la UI |
| Vendita su CardTrader che corre contro l'accettazione | `check_product_availability` prima del decremento CT; finestra residua di pochi secondi = stesso rischio già accettato dal purchase (evento raro, esito: gamba fallita e compensata) |
| Reconciler (ogni 6h) durante uno scambio | Righe CT-linked: CT decrementato in pari passo → export e locale coincidono, nulla da correggere. Righe NULL/trade: mai toccate dal reconciler (verificato nel codice). **Test d'accettazione dedicato** |
| Webhook CT (vendita/annullo) su una riga parzialmente in escrow | Il webhook applica delta sulla quantità residua — l'escrow è già fuori dalla riga; coerente |
| CT auto-cancella il prodotto (escrow totale o vendita del resto) e poi lo scambio salta | Ripristino fallback: riga nuova locale `source='trade'` + notifica (D nel §4); mai righe CT-linked fantasma |
| Doppio click / retry di rete su qualsiasi azione | `Idempotency-Key` sulle POST del BFF + CAS sullo stato + `op_key` univoci lato sync: replay → stessa risposta |
| Crash a metà accettazione | Stato `ACCEPTING` + job di recupero che rilascia e riporta a `PROPOSED`; ogni op è ripetibile |
| Proposta ignorata | `EXPIRED` via job schedulato su `due_at` (+7gg), promemoria a −24h; niente escrow da ripulire |
| Proposer ci ripensa / receiver rifiuta | `cancel` (solo PROPOSED) / `decline` con motivo opzionale |
| Uno dei due non spedisce mai | Promemoria; dopo N giorni ciascuno può chiedere assistenza → `DISPUTED`, risoluzione manuale (mai auto-assegnazione) |
| Annullo dopo l'accettazione | Solo consensuale (richiesta + conferma dell'altro) o via assistenza → ripristino esatto |
| Utente estraneo su scambio altrui | Ogni endpoint: chiamante ∈ {proposer, receiver} altrimenti **404** (anti-enumerazione) |
| Payload malevoli | Item riverificati su DB (offered=chiamante, requested=receiver, `source` tradabile); max 30 item/lato; crediti=0; rate limit; token interno per gli endpoint S2S |
| Scambio con se stessi | Rifiutato |
| Audit | `trade_status_history` + `inventory_ops`: ogni transizione e ogni mutazione inventario hanno attore, motivo, esito |

---

## 6. API

### Servizio auction — router `/trades` (JWT utente obbligatorio ovunque)
| Endpoint | Chi | Cosa |
|---|---|---|
| `POST /trades` | proposer | Crea proposta `{receiver_id, offered[], requested[], message?, delivery_method, ship_address}` + `Idempotency-Key` |
| `GET /trades?role=&status=` | partecipante | Liste paginate (richieste/inviate/conclusi) |
| `GET /trades/{id}` (+`/history`) | partecipante | Dettaglio (indirizzi solo da ACCEPTED) / storico |
| `POST /trades/{id}/accept` | receiver | Accettazione (body: indirizzo) — saga §4 |
| `POST /trades/{id}/decline` / `cancel` / `counter` | receiver / proposer / receiver | Rifiuto / ritiro (solo PROPOSED) / controproposta |
| `POST /trades/{id}/ship` / `confirm-receipt` | ciascuno | Spedito (+tracking) / ricevuto (alla 2ª → COMPLETED) |
| `POST /trades/{id}/request-cancel` / `confirm-cancel` / `assistance` | ciascuno | Annullo consensuale / segnalazione → DISPUTED |
| `POST /internal/expire-trades` / `recover-accepting` / `resolve-trade` | EventBridge / job / ops | Scadenze batch / recupero saghe / risoluzione DISPUTED |

Errori `{detail, code}` (catalogo `AppError` esistente) + codici `TRADE_*`.

### Servizio sync — nuovi endpoint interni (X-Internal-Token, mai esposti dal proxy pubblico)
| Endpoint | Cosa |
|---|---|
| `POST /internal/reservations` | Batch per utente: decrementi condizionali atomici + propagazione CT per righe `cardtrader` (pattern purchase v2), idempotente per `op_key` |
| `POST /internal/reservations/release` | Ripristino (increment CT+locale; fallback riga nuova se CT rifiuta), idempotente |
| `POST /internal/credit` | Accredito righe nuove `source='trade'`, idempotente |

### BFF (questo repo)
`app/api/trades/[...path]/route.ts` sul template di `app/api/auctions/[...path]`, ma **fail-closed anche sulle GET** (scambi privati). Rate limit 60/min, timeout 12s, `no-store`, forward `Idempotency-Key`/`X-Request-ID`, target `AUCTION_API_URL`. Test in `bff-security` (tutti 401 senza cookie). Gli endpoint `/internal/*` di auction e sync **non** passano dal BFF.

---

## 7. Modifiche frontend

1. `lib/api/trades-client.ts` (retry 401 via `tokenManager`) + `lib/hooks/use-trades.ts` (React Query: liste, dettaglio, mutazioni con invalidation).
2. **Tab reali** in `ScambiContent` (richieste/inviate/conclusi), senza mock.
3. **Dettaglio**: accetta (con form indirizzo), rifiuta, contro-proponi; sezione consegna (indirizzi, "ho spedito"+tracking, "ho ricevuto", stato altro lato).
4. **Composer unificato** (`TradeProposalPage`+`TradeComposer`, ritiro di `ScambiProponiModal`): lato "offro" = inventario reale filtrato per `source IN ('cardtrader','trade')` e qty>0; lato "chiedo" = collezione pubblica del receiver stesso filtro (l'endpoint pubblico dovrà esporre `source`). Entry-point da pagina prodotto → item pubblico del venditore; se non tradabile → "non scambiabile".
5. **Compose inventario account**: sostituire l'euristica "external NULL = test" col campo `source` esplicito (evoluzione già prevista) — le carte ricevute in scambio devono comparire.
6. **Crediti nascosti** dietro `scambiCreditsEnabled=false`; bilancia informativa sui `price_cents` reali o rimossa.
7. Notifiche `trade_*` in `types/notification.ts` + deep-link; i18n in **tutti e 6** i locale + `npm run i18n:keys`.

---

## 8. Fasi di lavoro

Ogni fase chiude con typecheck/lint/test verdi ed è testabile da sola.
Fase 0 nel repo `sync`; 1–3 nel repo `auction`; 4–5 in questo repo; estensione Ebartex-only in `brx-marketplace`; deploy col pattern ECR+compose (rollback tag come oggi).

### Fase 0 — Fondazioni inventario (repo sync) + verifiche
Colonna `source` (+backfill) e aggiornamento dei due ORM; tabella `inventory_ops`; endpoint interni `reservations`/`release`/`credit` con X-Internal-Token, riuso del pattern purchase v2 e del client CT; test d'integrazione su Postgres usa-e-getta (riuso harness), inclusi: doppia prenotazione concorrente, CT che fallisce a metà batch → compensazione, replay idempotente, reconciler che gira su inventario con prenotazioni attive senza toccare nulla.
**Verifiche lampo incluse**: (a) auction punta allo stesso db dell'inventario (`\dt` dalla connessione auction); (b) vincolo reale su `user_inventory_items.user_id` (`\d` — esistono 3 DDL storici divergenti: nessuna FK / FK→users / FK→user_sync_settings; se fosse l'ultima, l'accredito a utenti senza riga sync fallirebbe → adeguare l'insert).
**Criteri**: endpoint interni funzionanti e idempotenti su dev; reconciler-test verde; verifiche (a)(b) documentate in cima al file.

### Fase 1 — Fondamenta trades (repo auction)
Migrazione (4 tabelle), modelli, schemi, repository; create (validazioni: proprietà, `source`, limiti, indirizzo proposer), liste, dettaglio, history, decline, cancel; notifiche; job scadenza + promemoria; unit test.
**Criteri**: flusso proposta→rifiuto/ritiro/scadenza via curl su dev; storico per ogni transizione; estraneo → 404; crediti ≠0 → 422.

### Fase 2 — Accettazione (saga) + controproposta
Stato `ACCEPTING`, gambe A/B verso sync, compensazioni, job di recupero, counter con catena, idempotenza end-to-end; test di concorrenza su DB reale (modello: `test_bidding_concurrency_db_integration.py` di auction + harness sync).
**Criteri**: due accept simultanee su item sovrapposti → una sola vince; crash simulato a metà saga → recupero pulito; item CT decrementato anche su CT (mock client nei test, smoke reale in dev).

**Estensione Ebartex-only (2026-07-14)**: auction orchestra anche il provider marketplace; `brx-marketplace` espone snapshot/riserva/rilascio idempotenti e blocca le righe CardTrader-linked. **Criteri**: uno scambio misto sync + marketplace prenota e rilascia entrambi; una vendita concorrente non causa oversell.

### Fase 3 — Consegna e completamento
Ship/confirm-receipt; accredito via `/internal/credit`; annullo consensuale con release (incl. fallback CT-cancellato); assistenza → DISPUTED + `resolve-trade`.
**Criteri**: doppia conferma → un solo accredito anche con retry; ripristino esatto; somma carte invariata a fine scambio (test); accredito ok anche per utente senza riga `user_sync_settings` (esito verifica (b)).

### Fase 4 — BFF
Route handler, client TS, test bff-security.
**Criteri**: typecheck/lint/test verdi; senza cookie tutto 401; proxy funzionante contro dev.

### Fase 5 — Frontend
Hook, tab reali, dettaglio con azioni, composer unificato su inventari reali (filtro `source`), sezione consegna, compose account su `source`, crediti dietro flag, notifiche, i18n ×6.
**Criteri**: scambio completo end-to-end tra due utenti reali su dev **senza mock**; `i18n:keys` verde; mock file eliminati.

### Fase 6 — Hardening e ops
Metriche transizioni/escrow; schedule EventBridge (expire + recover); runbook DISPUTED; smoke staging; review sicurezza (authz, rate limit, input caps, token interni, log senza PII e senza indirizzi). Quick win già noto: l'healthcheck di `auction-api` è unhealthy probabilmente per lo stesso `curl` mancante fixato oggi sul sync — sistemarlo nel compose.
**Criteri**: checklist sicurezza firmata; runbook provato su un DISPUTED simulato; un giro di reconciler in produzione durante uno scambio attivo → zero mutazioni inattese.

---

## 9. Fuori scope v1 (esplicito)

- **Crediti/conguaglio** e compensazioni in denaro (D10) — dopo i pagamenti.
- **Intermediario Ebartex** (deposito e verifica centrale) — resta a schema.
- **Rubrica indirizzi** riusabile, corrieri/etichette, **chat** sullo scambio, dispute complete con chat (c'è l'assistenza minima), **valore di mercato reale** ed equità imposta dal server.

## 10. Rischi residui e note

1. **Race CT-side** (vendita su CT nei secondi tra availability-check e decremento): stessa classe di rischio già accettata dal purchase; esito = gamba fallita e compensata, mai duplicazione interna. Monitorare con le metriche di Fase 6.
2. **Doppia proprietà dei modelli** di `user_inventory_items` (ORM in sync **e** copia in auction): la colonna `source` va aggiunta in entrambi nello stesso giro di deploy — checklist in Fase 0.
3. **Verifiche (a)(b) di Fase 0** (db condiviso per auction, FK su user_id): se (a) fosse falsa, le letture di validazione in auction passano anch'esse dal sync (il disegno D2 regge comunque); se (b) è FK→user_sync_settings, adeguare l'insert dell'accredito.
4. Il **sorgente marketplace** è stato recuperato in `repos\brx-marketplace`; il nuovo escrow deve essere deployato prima dell'aggiornamento auction.
5. Migrazioni auction in produzione: gli host prod usano compose (non ECS) → eseguire `alembic upgrade head` come one-off nel container sull'host prima del restart, come già fa la CI in dev.

## 11. Criteri di accettazione complessivi

- [ ] Due utenti reali completano uno scambio end-to-end: uno con item CardTrader e uno con inserzione Ebartex-only → proposta → accettazione → doppia spedizione → doppia conferma → carte trasferite (`source='trade'`) e visibili.
- [x] In nessuno scenario testato (concorrenza, retry, crash a metà saga, annulli, dispute, giro di reconciler) l'inventario totale cambia se non per il trasferimento previsto; mai quantità negative, mai duplicazioni.
- [x] Ogni transizione in `trade_status_history` e ogni mutazione inventario in `inventory_ops`, con attore e motivo.
- [x] Un non partecipante non può né leggere né agire (404); gli endpoint `/internal/*` rifiutano chiamate senza token interno.
- [x] Crediti disattivati ovunque (server rifiuta ≠0, UI non li mostra).
- [x] Suite: pytest (unit + integrazione/concorrenza) verdi in `sync` e `auction`; typecheck/lint/test/i18n:keys verdi qui; bff-security aggiornata.

### Verifica locale aggiuntiva — 2026-07-14

- Aggiunto in `sync` il test PostgreSQL di trasferimento bidirezionale: riserva A/B, accredito A/B, replay idempotente, totale carte invariato, nessuna quantità negativa e nessuna duplicazione.
- Suite `sync`: **12 test passati**; `ruff` e `black --check` verdi sul file aggiunto. Il lint globale del repo segnala 17 violazioni preesistenti fuori dallo scope scambi.
- Smoke Next locale: `/scambi` compila e risponde 200 con sessione presente; `/scambi/nuova` reindirizza a `/scambi`; `/api/trades` senza cookie risponde 401 con `private, no-store`.
- Smoke integrato su stack Docker reale locale: auction → sync → PostgreSQL ha completato uno scambio A/B con doppia spedizione, doppia conferma, crediti e replay; estraneo `404`; totale inventario `5`, minimo `1`, 4 righe `trade` sicure.
- Runbook DISPUTED provato via HTTP: secondo scambio accettato, portato a `DISPUTED`, risolto `CANCELLED` dall'endpoint interno e rigiocato senza duplicare; 2 release `succeeded`, totale ancora `5`.
- BFF provato contro auction locale: GET autenticata `200`/`no-store`, create con idempotency key e cancel riusciti; senza cookie `401`.
- Lo smoke ha scoperto e corretto un rumore operativo: gli `AppError` attesi erano gestiti dal fallback generico e il `404` dell'estraneo produceva uno stacktrace. Ora hanno handler specifico e rollback a livello `DEBUG`; test dedicato verde, suite auction **76 passati / 2 skipped** includendo i 4 test PostgreSQL.
- Restano volutamente non spuntati lo smoke con due utenti reali/dev e la verifica del reconciler in produzione: richiedono ambiente e conferma esplicita.

### Deploy produzione — 2026-07-14

- Pubblicate immagini ECR immutabili per `sync`, `auction` e `auth`; rollback comune `rollback-pre-trades-20260714-134713`.
- `sync` migrato per primo: backfill `source` su 3513 righe, `inventory_ops` creato, API e worker sani.
- Lo schema auction era già materialmente aggiornato fino a `20260526_listing_photos`, ma `alembic_version` era fermo a `006`: verificati tabelle, colonne, indici, vincoli, tipi `NUMERIC(18,4)` e trigger append-only; aggiunti i due indici e il check mancanti, riallineato il baseline, quindi applicata `20260714_trades`.
- `auction` online con healthcheck sano, pool PostgreSQL limitato a 32 connessioni teoriche, zero `ERROR`/traceback allo startup e collegamento S2S verso sync verificato (`422` su payload vuoto autenticato).
- `auth` aggiornato senza riavviare Search/Meilisearch; `source` è esposto nell'inventario pubblico.
- Scheduler produzione attivi riusando il Lambda esistente: `expire-trades` ogni 15 minuti e `recover-accepting` ogni 5 minuti; entrambe le invocazioni manuali hanno risposto `200`.
- Frontend Amplify job `491` riuscito sul commit `5379c67`; `/build-info.json` espone quel commit, `/scambi` applica il redirect auth e `/api/trades` senza cookie risponde `401` con `private, no-store` sia sul dominio Amplify sia su `www.ebartex.com`.
- Resta solo il test funzionale con due utenti reali/CardTrader e, durante uno scambio attivo, il giro di reconciler senza mutazioni inattese.

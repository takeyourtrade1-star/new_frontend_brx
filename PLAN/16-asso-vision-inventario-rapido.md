# Piano 16 — Asso Vision: scansione continua e inventario rapido

> Destinatari: frontend, backend `brx-match`, backend inventario/sync, ML/data e DevOps.
> Scritto il 2026-07-14 dopo la lettura end-to-end del frontend e del servizio `brx-match` recuperato.
> Obiettivo: `passa carta → cattura → riconoscimento in background → ripeti → revisione → pubblicazione`.
> Vincolo economico: il costo backend mensile di Asso Vision non deve superare la baseline attuale, anche durante il rollout.

---

## Stato implementazione — 2026-07-14

Prima verticale completata nel frontend:

- browser spostato da `/brx-match/*` al BFF allowlisted `/api/scanner/*` con timeout, limiti payload, rate limit e `no-store`;
- contratto vettore corretto da `vector_b64` a `vector: number[]`;
- capability handshake e opt-in edge fail-closed: il modello pesante non viene più scaricato senza compatibilità esplicita e limite ≤15 MB;
- camera aperta subito, senza gate del modello;
- loop remoto sostituito da state machine locale movimento → stabilità/qualità → singola recognition → attesa rimozione;
- verifica ORB limitata matematicamente a ≤15% delle catture;
- crop 5:7 allineato alla cornice `object-cover` e condiviso tra quality gate, upload ed embedding;
- lotto persistente in IndexedDB, tray continua, review locale e nessun redirect dopo il match;
- rewrite diretto eliminato e modalità operativa `edge_only` disponibile come circuit breaker.

Restano bloccanti per la promozione reale nell'inventario:

- mapping backend atomico `scryfall_id → blueprint_id` CardTrader;
- API batch idempotente nel servizio inventario esistente;
- modello edge compatto ≤15 MB validato su holdout fisico;
- benchmark su telefoni/carte reali prima di alzare l'auto-accept.

---

## Riassunto esecutivo

Il margine di miglioramento è **netto**. Asso Vision oggi è uno scanner singolo che:

1. al primo utilizzo blocca la camera finché non ha scaricato e inizializzato un modello DINOv2 da circa **88 MB**;
2. analizza il centro del video a intervalli, ma non ha una vera macchina di auto-cattura basata su presenza, movimento, stabilità, qualità e rimozione della carta;
3. interrompe la scansione al primo match e reindirizza alla ricerca marketplace;
4. restituisce nome/set/URL di ricerca, non il `blueprint_id` necessario per creare inventario;
5. non ha sessioni batch, coda persistente, gestione duplicati, review o promozione nell'inventario;
6. usa nel percorso Turbo un preprocessing diverso da quello con cui è stato costruito l'indice V2;
7. presenta drift tra contratto frontend e backend recuperato (`vector_b64` contro `vector: number[]`, endpoint presigned richiesto ma assente);
8. vota per `card_name`, quindi può confermare il nome giusto ma una stampa sbagliata;
9. non possiede un benchmark rappresentativo di carte fisiche riprese da telefoni reali, né un circuito di feedback dalle correzioni utenti.

I benchmark locali recuperati confermano il limite: nell'ultima valutazione salvata il nome top-1 è corretto nell'87% dei casi clean e nell'86% degli augmented, ma la **stampa esatta** solo nel 63–64%. Tra i risultati accettati, la precisione sulla stampa è circa 72–74%. Sono appena 100 esempi per dataset e non rappresentano adeguatamente mani, sfondi, assenza carta, sleeve, foil, riflessi, dispositivi e rete reale.

La soluzione raccomandata separa quattro responsabilità:

1. **Capture lane sul telefono**: rileva carta, qualità e cambio carta; cattura un crop rettificato e torna subito pronta.
2. **Recognition lane in background**: retrieval top-K, OCR/metadati, reranking e confidenza calibrata.
3. **Sessione intake locale persistente**: conserva in IndexedDB ordine, quantità, candidati, crop temporanei e stato di revisione.
4. **Revisione e pubblicazione**: l'utente corregge stampa, lingua, finitura e condizione prima di creare inventario/listing.

Il cold start deve essere **capture-first ed edge-primary**: la camera si apre subito, il modello locale quantizzato viene caricato in background e le catture restano in coda locale. Il backend attuale resta stateless e fa al massimo una query FAISS per carta; crop/OCR/ORB server sono ammessi solo sui casi ambigui e dentro un budget rigido. Nessuna nuova GPU, coda, cache, database, vector DB, API AI/OCR a consumo o capacità minima sempre accesa.

---

## 1. Perimetro analizzato

### Frontend

- `app/scanner/page.tsx`
- `components/feature/scanner/*`
- `components/feature/aste/create/AuctionCreateCardPicker.tsx`
- `components/feature/aste/create/AuctionCreateGenericSearch.tsx`
- `hooks/useBrxScanner.ts`
- `hooks/scanner/useScanLoop.ts`
- `hooks/scanner/useOnnxSession.ts`
- `hooks/scanner/scanner-types.ts`
- `hooks/scannerEmbed.worker.ts`
- `hooks/resolveOnnxUrls.ts`
- `lib/scanner/preprocess.ts`
- `lib/scanner/balancedProfile.ts`
- `lib/scanner/onnx-loader.ts`
- `next.config.mjs`
- inventario/account, BFF search, catalogo Meilisearch e client sync correlati

### Backend riconoscimento recuperato

Workspace: `C:\Users\xheta\BRX\backend\brx-match`.

- `app/api/scan.py`
- `app/core/config.py`, `app/core/startup.py`
- `app/models/schemas.py`
- `app/scanner/preprocessor.py`
- `app/scanner/embedder.py`, `app/scanner/embedder_dinov2.py`
- `app/scanner/matcher.py`, `app/scanner/reranker.py`, `app/scanner/ref_cache.py`
- `app/services/search_url.py`
- modelli, indici, metadata e CSV di valutazione recuperati

### Inventario/sync

È stata verificata la superficie necessaria all'atterraggio del flusso:

- l'inventario usa `blueprint_id` CardTrader come identità catalogo;
- esistono GET, PUT e DELETE degli item utente, ma non un endpoint utente per creare un intake batch da Asso Vision;
- `user_inventory_items.source` non contempla una sorgente `vision`;
- il frontend fonde inventario sync e listing marketplace attive, quindi gli item scansionati non devono diventare listing pubbliche per effetto collaterale.

### Prerequisito operativo

`brx-match` è stato recuperato da un'immagine OCI e non dispone della repository Git originale. Prima di modifiche di produzione va creato un repository privato con Dockerfile riproducibile, dipendenze bloccate, test, CI e runbook. Non si deve sviluppare a lungo sopra una cartella ricostruita senza storia e senza build verificata.

---

## 2. Flusso attuale

```text
apertura /scanner
  → download/cache DINOv2 ONNX
  → inizializzazione worker ONNX
  → apertura camera
  → crop quadrato centrale 224×224
  → embedding nel browser
  → POST /brx-match/search-vector
  → opzionale POST /brx-match/verify sul solo top-1
  → voto su card_name
  → stop scanner
  → preview 3 secondi
  → redirect a /search?q=<nome+set>

fallback Standard:
  camera → JPEG 384 px → POST /brx-match/scan
  → detect/warp + embedding server + FAISS + ORB
  → stessa preview/redirect
```

Questa architettura è adatta a “trova una carta e apri la ricerca”, non a creare un inventario ad alta velocità.

---

## 3. Problemi trovati

| Priorità | Problema | Impatto |
|---|---|---|
| **P0** | Il frontend invia `vector_b64`, lo schema recuperato richiede `vector`; `/model/presigned` non esiste | Turbo può fallire con 422/404 anche se il modello è caricato |
| **P0** | Il client non negozia versione/dimensione indice; backend V1 usa 1280-d, DINOv2 client 384-d | Errore FAISS o percorso incompatibile |
| **P0** | Browser: crop quadrato raw. Indice V2: carta rettificata + CLAHE-LAB | Similarità non confrontabili e accuracy persa silenziosamente |
| **P0** | `/brx-match/*` passa da rewrite diretto, non da BFF | Mancano rate limit, timeout uniforme, validazione, auth/quote e `no-store` |
| **P0** | Il risultato non include un `blueprint_id` canonico | Non è sicuro creare inventario da nome/set o URL testuale |
| **P1** | Modello edge da 88.384.662 byte più circa 11 MB di WASM prima della camera | Cold start, memoria e consumo incompatibili con uso immediato |
| **P1** | Nessun vero auto-capture/cambio carta | Doppi scatti, frame mossi, catture perse e bassa cadenza |
| **P1** | Il loop si ferma al match e reindirizza | Nessuna scansione batch continua |
| **P1** | Voto/hint per `card_name`, non per printing ID | Reprint diverse convergono come se fossero la stessa carta |
| **P1** | `/verify` controlla solo top-1 e non riorganizza i candidati | Ambiguità non realmente risolta |
| **P1** | “confidence” mescola cosine e inlier ORB non calibrati | La percentuale UI non è una probabilità affidabile |
| **P1** | Nessun modello open-set/no-card | Possibili match su mani, sfondi, retro o carte non supportate |
| **P1** | Nessuna sessione, persistenza o idempotenza | Refresh, rete instabile e retry possono perdere/duplicare item |
| **P2** | Metadata recognition Scryfall, inventario CardTrader | Serve mapping atomico e versionato verso `blueprint_id` |
| **P2** | ORB scarica reference a richiesta; `ref_cache.py` non risulta collegato | Latenza cold-cache e dipendenza runtime da Scryfall |
| **P2** | Benchmark piccoli, clean/sintetici e con negativi insufficienti | Le soglie non garantiscono la produzione |
| **P2** | Nessun feedback strutturato da correzioni utente | Il sistema non migliora sui casi reali |
| **P2** | `CARD_SCANNER_SETUP.md` descrive componenti non più presenti | Documentazione tecnica non aderente al runtime |
| **P3** | UI/servizio Magic-only, mentre alcuni testi promettono più giochi | Aspettativa incoerente; multi-game da fare dopo Magic |

---

## 4. Baseline e target

| Dataset | N | Accettati | Top-1 stampa | Top-1 nome | Top-5 stampa | p50 | p95 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `eval_local_v5.csv` | 100 | 86 | 63% | 87% | 78% | 139 ms | 168 ms |
| `eval_local_v5_aug.csv` | 100 | 85 | 64% | 86% | 79% | 211 ms | 536 ms |

Tra i risultati accettati, la precisione sulla stampa è circa 72,1% clean e 74,1% augmented. Il percorso browser non è dimostrato equivalente al percorso server valutato.

### Target di prodotto

| Area | Target MVP | Target maturo |
|---|---:|---:|
| Camera utilizzabile, cold start | ≤ 1,5 s dopo permesso | ≤ 1,0 s |
| Feedback cattura dopo stabilità | p95 ≤ 450 ms | p95 ≤ 300 ms |
| Risultato in tray dopo cattura | p50 ≤ 800 ms, p95 ≤ 1,8 s | p50 ≤ 500 ms, p95 ≤ 1,2 s |
| Cadenza sostenuta | ≥ 25 carte/min | ≥ 35–40 carte/min |
| Top-1 nome, holdout reale | ≥ 97% | ≥ 98,5% |
| Top-3 nome, holdout reale | ≥ 99% | ≥ 99,7% |
| Precisione auto-accept stampa | ≥ 99% | ≥ 99,5% |
| Coverage auto-accept stampa | ≥ 60% | ≥ 85% |
| Doppie catture non volute | < 1% | < 0,3% |
| Catture perse | < 1% | < 0,3% |
| Crash-free scan sessions | ≥ 99,5% | ≥ 99,9% |
| Richieste recognition per carta | media ≤ 1,2 | media ≈ 1,0 |
| Verifica server con crop | ≤ 15% delle catture | ≤ 10% delle catture |
| Costo backend mensile | ≤ baseline Asso Vision attuale | ≤ baseline Asso Vision attuale |
| Nuovi servizi a costo fisso | 0 | 0 |

La metrica primaria deve essere la **precisione tra gli auto-accept**, non l'accuracy grezza. Se l'evidenza sulla stampa è insufficiente, l'item va in `needs_review`.

---

## 5. Esperienza desiderata

```text
Apri Asso Vision
  → camera pronta subito
  → inserisci carta
  → feedback “acquisita”
  → rimuovi/sostituisci carta
  → il risultato arriva nella tray in background
  → ripeti senza fermare la camera
  → termina lotto
  → rivedi item incerti o tutti
  → conferma stampa, lingua, finitura, condizione e quantità
  → aggiungi all'inventario
  → pubblica le carte selezionate in un secondo momento
```

---

## 6. Decisioni architetturali

| # | Decisione | Motivazione |
|---|---|---|
| **D1** | Capture-first, edge-primary e coda locale | La camera deve aprirsi subito senza dipendere da rete o modello |
| **D2** | Separare capture lane e recognition lane | Si cambia carta mentre la precedente viene elaborata |
| **D3** | Cattura solo dopo presenza + stabilità + qualità | Riduce upload inutili e mosso |
| **D4** | Dopo la cattura stato `await_removal` | Evita doppio scatto, ma accetta due copie fisiche uguali consecutive |
| **D5** | Identità per `capture_id` e `printing_id`, mai per nome | Nomi e reprint non sono chiavi |
| **D6** | Risultati con `scryfall_id` e `blueprint_id` | L'inventario non dipende dalla ricerca testuale |
| **D7** | Confidenze separate: identità, stampa, qualità e open-set | Una percentuale unica nasconde l'incertezza |
| **D8** | Retrieval top-K + reranker + OCR/metadati | Il solo embedding non distingue bene le stampe |
| **D9** | Preprocessing condiviso e versionato | Evita drift tra reference e query |
| **D10** | Sessione persistita in IndexedDB e promozione batch idempotente | Rete/refresh non perdono o duplicano carte senza introdurre storage backend |
| **D11** | Intake e inventario pubblicabile separati | Nessuna scansione diventa listing senza conferma |
| **D12** | Correzioni come feedback strutturato e campionato con quota | Miglioramento controllato senza crescita libera di storage/egress |
| **D13** | Browser → solo `app/api/scanner/*` | BFF, auth, quote, validazione, timeout e rate limit |
| **D14** | Chiudere bene Magic prima del multi-game | Dataset e cataloghi sono specifici per gioco |
| **D15** | Budget backend come invariant di rilascio | Se il tetto è vicino, si riduce il fallback e si manda in review; non si scala l'infrastruttura |
| **D16** | Nessuna persistenza backend di frame/crop | Le immagini restano locali e sono eliminate a fine review |

---

## 7. Architettura proposta

```text
┌──────────────── telefono ────────────────┐
│ camera → presence/motion → card quad     │
│ → quality gate → burst → rectified crop │
│ → IndexedDB queue → feedback acquisita  │
└──────────────────┬───────────────────────┘
                   │ BFF + idempotency
                   ▼
┌──────────────── recognition ─────────────┐
│ preprocess canonico → open-set/game      │
│ → embedding top-K → OCR/set/collector # │
│ → rerank → temporal fusion → calibration│
│ → accepted / needs_review / rejected     │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────── intake ──────────────────┐
│ session → captures → candidates → items │
│ → review → inventory draft → publish    │
└──────────────────────────────────────────┘
```

### 7.1 Capture lane

Macchina a stati:

```text
seeking_card → card_entering → stabilizing → quality_ready
→ captured → await_removal → seeking_card
```

- usare `requestVideoFrameCallback` con fallback;
- analizzare frame ridotti in worker/OffscreenCanvas;
- misurare copertura, blur, esposizione, glare, prospettiva e movimento;
- catturare 2–3 frame e scegliere il migliore;
- rettificare la prospettiva preservando la proporzione carta;
- feedback: “avvicina”, “ferma”, “troppo riflesso”, “acquisita”;
- fingerprint solo per retry, non per unire copie uguali;
- coda limitata con backpressure visibile.

### 7.2 Recognition lane

1. Quality/open-set gate.
2. Crop prospettico canonico.
3. Embedding addestrato/validato sul dominio camera e retrieval top-K.
4. OCR nome, set/collector number e classificazione simbolo set.
5. Reranking dei top-K e fusione dei frame del burst.
6. Decisione calibrata: `accepted_card`, `accepted_printing`, `needs_review`, `rejected`.

Il sistema non deve fingere di sapere ciò che il fronte non mostra. Foil, lingua, condizione e varianti visivamente identiche restano campi di review salvo evidenza dedicata.

### 7.3 Edge/server

Percorso primario:

- client: detection, qualità, crop, coda, embedding quantizzato e decisione su quando chiedere verifica;
- modello edge indicativamente ≤ 15 MB, servito come asset statico già ammortizzato e caricato dopo l'apertura camera;
- una sola richiesta stateless per carta con embedding compatto per il top-K FAISS sull'istanza attuale;
- upload di un singolo crop JPEG solo quando margine, OCR locale o quality gate indicano ambiguità;
- nessuna chiamata per ogni frame, voto remoto 3/5, polling, SSE o WebSocket;
- sessione, crop, tray e review restano in IndexedDB.

Fallback controllato:

- finché il modello edge compatto non supera golden test e holdout, è ammesso un singolo `/scan` server per carta, ma solo dietro quota e senza nuova capacità;
- un budget circuit breaker per giorno/mese riduce o disabilita verifica e fallback prima di superare la baseline;
- quando il budget non consente una verifica, l'item resta `needs_review`: il servizio degrada in precisione assistita, non aumenta la spesa;
- il rollout non può alzare autoscaling floor, istanze, RAM, GPU o storage; ogni incremento di traffico deve essere assorbito dalla riduzione del costo medio per carta e da quote esplicite.

---

## 8. Contratto API

Tutte le chiamate browser passano da `app/api/scanner/*`.

### Capability handshake

`GET /api/scanner/capabilities`

Restituisce almeno:

- `api_version`, giochi supportati e pipeline;
- `model_version`, `index_version`, `preprocess_version`;
- `embedding_dim`;
- edge enabled, URL asset statico, hash e byte del modello;
- modalità budget: `edge_primary`, `server_fallback_limited` o `edge_only`.

Il client rifiuta percorsi incompatibili invece di tentare comunque la search.

### Riconoscimento stateless

`POST /api/scanner/recognize`

Body compatto con:

- `capture_id` UUID idempotente;
- `model_version`, `index_version` e `preprocess_version`;
- embedding quantizzato/compresso e qualità client;
- crop JPEG opzionale solo quando il client richiede la verifica ambigua.

La risposta sincrona restituisce il top-K e la decisione. La capture lane continua indipendentemente tramite la coda locale; non esistono job, polling o sessioni remote da mantenere.

### Risultato

Campi minimi:

- `capture_id`, `status`, quality metrics;
- confidenze distinte per identità/stampa/open-set;
- candidato selezionato con game, `scryfall_id`, `blueprint_id`, nome, set, collector number e immagine;
- top-K candidati;
- versioni pipeline e latenza per stadio.

Senza `blueprint_id`, la stampa non è promuovibile automaticamente.

### Review

- modifiche, reject e stato `review-complete` sono locali;
- `POST /api/scanner/inventory-batch` invia una sola volta gli item confermati al servizio inventario esistente;
- ogni item usa un UUID locale come idempotency key e include prediction, scelta, versioni e reason code;
- nessuna immagine viene inclusa nel batch inventario.

---

## 9. Modello dati e inventario

### Store locale di intake

IndexedDB contiene store versionati per:

- `scan_sessions`: game, stato, timestamp, versioni e contatori;
- `scan_captures`: `capture_id`, sequence unique, stato, qualità, crop locale e retry;
- `scan_candidates`: rank, identità catalogo, score e versioni pipeline;
- `scan_items`: candidato selezionato, review, quantità, lingua, finish, condition, note e UUID idempotente.

I crop hanno TTL locale e vengono eliminati al termine della review. Non si introducono tabelle intake, object storage o code backend. L'unico dato persistito sul server è l'inventario già confermato, nel database esistente.

### Promozione inventario

La sessione crea prima item intake locali. Solo `review-complete` li promuove con un batch nel servizio esistente:

- sorgente esplicita `vision`, mai `internal_test`;
- nessun `external_stock_id` inventato;
- idempotency key UUID per item locale;
- nessuna pubblicazione automatica;
- merge quantità solo con regole esplicite su blueprint, lingua, finish e condition;
- listing marketplace/CardTrader da comando successivo.

---

## 10. Piano ML e dati

### Dataset reale

- 2.000 catture fisiche per il primo gate interno;
- 10.000–20.000 prima di dichiarare precisione generalizzabile;
- telefoni Android/iPhone, hardware e browser diversi;
- luce, ombre, glare, sleeve, sfondi, angoli, distanze e compressione;
- stesse carte in più edizioni e artwork condiviso;
- foil, borderless, showcase, promo, token e double-faced;
- negativi: nessuna carta, retro, mano, scatola, più carte, altro TCG.

Split per carta fisica/dispositivo/sessione, non per singolo frame, per evitare leakage.

### Mapping catalogo

- unire Scryfall e export CardTrader via `scryfall_id`;
- materializzare `blueprint_id`, set, collector number e proprietà disponibili;
- report di copertura/collisioni;
- niente auto-inventory senza mapping univoco;
- metadata e indice come artefatto atomico versionato.

### Bake-off modello

Confrontare in modo riproducibile:

- DINOv2 attuale con preprocessing corretto;
- encoder fine-tuned con metric learning sul dominio camera;
- encoder mobile quantizzato;
- reranker dedicato su top-K e hard negatives.

Le augmentations devono simulare prospettiva, blur, glare, sleeve, white balance, compressione e sfondi. Reprint omonime sono hard negatives prioritari.

### Calibration/open-set

- score grezzi separati da probabilità calibrate;
- calibrazione per gioco/layout;
- ECE/Brier oltre a top-k;
- soglie su precision/coverage;
- reject class e reason code;
- soglie/versioni lato server, non costanti sparse;
- nessun “99% match” UI senza calibrazione.

### Active learning

Con consenso, quota rigida e retention breve, campionare solo una piccola percentuale di correzioni, low margin, disagreement edge/server e nuovi dispositivi. Il campione deve riusare storage esistente entro budget oppure essere esportato in campagne manuali; non si crea un data lake e non si addestra automaticamente su ogni click.

---

## 11. Piano frontend

Il nuovo orchestratore compone:

- `useCameraCapture` — stream, torch, focus/zoom supportati;
- `useCardPresence` — entering/stable/removed;
- `useCaptureQuality` — blur/glare/exposure/coverage;
- `useCaptureQueue` — IndexedDB, retry, idempotenza, backpressure;
- `useLocalScanSession` — stato/recupero IndexedDB;
- `useRecognitionMutation` — React Query per la singola richiesta stateless;
- `useEdgeRecognizer` — percorso primario locale negoziato.

`useScanLoop.ts` non deve più mescolare capture, rete, ranking, voto, hint, countdown e redirect.

Nuova `/scanner`:

- camera sempre attiva durante il lotto;
- contatori catturate/riconosciute/da rivedere;
- tray degli ultimi risultati senza coprire il riquadro;
- feedback audio/haptic opzionale;
- pausa/fine lotto, nessun redirect;
- stato rete/coda e ripresa sessione;
- UI accessibile senza dipendere solo da colore/suono.

Review:

- ordine di scansione e filtri per incertezza;
- crop/reference e top-3 candidate;
- correzione rapida touch/tastiera;
- bulk lingua/condition/finish;
- quantità aggregabile mantenendo audit;
- conferma inventario e pubblicazione separate.

---

## 12. Piano backend

### `brx-match`

1. Creare repository privata, Dockerfile, lock, CI, test e runbook.
2. Unificare `vector_b64`/`vector` e implementare capability handshake.
3. Rimuovere o implementare correttamente `/model/presigned`.
4. Validare body, MIME, dimensione, norma e versioni.
5. Non usare attributi privati del matcher direttamente dalle route.
6. Creare specifica preprocessing con golden fixture e parità numerica.
7. Rerank di più candidati, non verifica binaria del solo top-1.
8. Reference locali/versionate o cache realmente pre-warm.
9. Aggiungere OCR, set-symbol, calibration e open-set.
10. Health distinta in liveness/readiness/capabilities.

### Inventario/sync

L'intake utente non appartiene a `brx-match`, che deve restare stateless rispetto all'utente. Non vengono aggiunti database, code, worker o object storage al servizio.

Il batch finale nel servizio inventario esistente:

1. verifica ownership;
2. rifiuta item non confermati/senza mapping;
3. crea/aggiorna inventario in transazione;
4. usa l'UUID locale dell'item come idempotency key;
5. registra audit;
6. non crea listing e non invia outbox CardTrader.

Evolvere il solo schema inventario esistente con sorgente `vision`, proprietà normalizzate, vincoli di merge e API batch per-item. Nessuna tabella di sessione scanner è richiesta.

---

## 13. Sicurezza, privacy e osservabilità

- BFF come unica superficie browser;
- auth cookie-first, ownership e rate limit per utente/IP/sessione;
- quote su catture/byte, timeout per stadio e backpressure;
- frame e crop non vengono persistiti dal backend e non finiscono in object storage o log;
- i payload immagine ammessi per verifica vivono solo in memoria per la durata della richiesta;
- metriche: camera open, quality/capture, queue, upload, latency per stadio, errori/versioni/fallback;
- metriche prodotto: carte/min, accepted/review/rejected, correction e duplicate/missed rate, promozione/publication rate;
- niente dati ad alta cardinalità o immagini nelle metriche ordinarie;
- esempi ML solo con consenso, accesso ristretto e retention.

### Budget guardrails non negoziabili

- fissare prima del rollout la baseline mensile reale di Asso Vision: compute, richieste, egress e storage;
- costo mensile post-rilascio ≤ baseline, senza spostare la spesa su nuovi servizi gestiti;
- misurare richieste/carta, byte/carta, CPU-ms/carta e quota di verifiche, non solo latenza;
- target operativo: media ≤ 1,2 richieste recognition/carta e crop server ≤ 15%;
- nessuna GPU, paid OCR/AI API, Redis/coda, vector DB, database o bucket dedicato;
- hard quota per utente e budget globale con feature flag `edge_only` prima del superamento del tetto;
- canary bloccato automaticamente se il costo proiettato supera la baseline o il CPU-ms/carta non scende rispetto al flusso attuale;
- la crescita d'uso viene servita solo se l'ottimizzazione edge compensa il traffico; altrimenti gli item ambigui passano a review manuale.

---

## 14. Milestone

### Fase 0 — Correttezza attuale (3–5 giorni)

- misurare baseline economica attuale, richieste/carta, byte/carta e CPU-ms/carta;
- repository/build riproducibile `brx-match`;
- handshake, contratto Turbo e dimensione indice;
- BFF scanner;
- disattivare Turbo se preprocessing/versioni incompatibili;
- voto per printing ID o Standard-only temporaneo;
- documentazione aggiornata.

**Gate:** zero 404/422/dimension mismatch; browser non usa più rewrite diretto; baseline di costo firmata e dashboard budget attiva.

### Fase 1 — Benchmark reale (1–2 settimane)

- harness replay, dataset reale/negative set;
- metriche nome/stampa/open-set;
- benchmark dispositivi/rete e dashboard.

**Gate:** baseline pubblicata; nessuna soglia prodotto basata solo sui CSV storici.

### Fase 2 — Continuous capture MVP (1–2 settimane)

- state machine presenza/stabilità/rimozione;
- quality gate/burst;
- IndexedDB queue;
- tray, contatori, pausa/fine lotto;
- capture-first, sessione locale riprendibile e massimo una richiesta per carta.

**Gate:** 100 carte senza redirect, nessuna perdita dopo refresh, ≥25 carte/min, doppie <1%.

### Fase 3 — Recognition V4 (2–4 settimane)

- mapping `scryfall_id → blueprint_id`;
- preprocessing canonico;
- bake-off/fine-tuning;
- reranker/OCR/set-symbol;
- calibration/open-set e cache reference;
- modello edge quantizzato e verifica server limitata ai casi ambigui.

**Gate:** auto-accept stampa ≥99% precisione su holdout reale, verifica crop ≤15% e CPU-ms/carta inferiore alla baseline. Se non raggiunto, aumentare `needs_review`.

### Fase 4 — Intake locale/inventario draft (1–2 settimane)

- schema IndexedDB e API batch auth/idempotente sul servizio inventario esistente;
- review-complete locale e promozione atomica;
- sorgente `vision`, zero side effect listing/CardTrader.

**Gate:** retry multipli producono un solo inventario; ownership e transazioni testate.

### Fase 5 — Review/pubblicazione (1–2 settimane)

- review mobile/desktop;
- top-3/crop/reference e bulk fields;
- promozione inventario;
- collegamento separato ai wizard listing/asta.

**Gate:** lotto completo scansionato, corretto, promosso e pubblicato in staging senza workaround.

### Fase 6 — Shadow/canary (almeno 1 settimana)

- feature flag, shadow V4, canary 5% → 25% → 100%;
- rollback per versioni artefatto;
- runbook, review privacy e circuit breaker di budget.

**Gate:** SLO verdi per 7 giorni, correction rate entro target e costo backend proiettato non superiore alla baseline.

### Fase 7 — Multi-game

Solo dopo Magic: indice, mapping, dataset, quality policy e gate separati per ogni TCG.

---

## 15. Mappa file prevista

### Frontend

- evolvere `hooks/useBrxScanner.ts`;
- dividere `hooks/scanner/useScanLoop.ts`;
- versionare `lib/scanner/preprocess.ts`;
- rendere opzionale `hooks/scanner/useOnnxSession.ts`;
- rimuovere il gate bloccante dal flusso primario;
- trasformare `app/scanner/page.tsx` in batch scanner;
- aggiungere sessione IndexedDB, mutation React Query e `app/api/scanner/*`;
- aggiungere pagine review;
- integrare inventario senza fondere item non confermati con listing live;
- aggiungere i18n in tutte le 6 lingue.

### `brx-match`

- versionare `app/api/scan.py` e `app/models/schemas.py`;
- evolvere `preprocessor.py`, `matcher.py`, `reranker.py`;
- collegare o rimuovere `ref_cache.py`;
- aggiungere quality/open-set/OCR/calibration;
- aggiungere build indice, test e manifest artefatti.

### Inventario/sync

- migration minima della sorgente `vision` sul modello esistente;
- route batch promote, senza route/sessioni scanner remote;
- service transazionale/idempotente;
- test auth/ownership/concorrenza/retry/outbox isolation.

---

## 16. Test minimi

### Capture

- carta lenta/veloce, ferma/mossa/inclinata/parziale;
- mano, nessuna carta, più carte;
- stessa copia ferma: un solo scatto;
- due copie identiche consecutive: due scatti;
- cambio carta mentre arriva il risultato precedente;
- coda piena, offline, reconnect, refresh/crash.

### Recognition

- stesso nome in set diversi e stesso artwork;
- set symbol/collector number piccoli;
- foil/sleeve/glare/lingue;
- token, promo, borderless, double-faced e retro;
- carta non indicizzata e altro TCG;
- top-1 errato ma top-3 corretto;
- mismatch esplicito di versioni.

### Inventario

- doppio POST idempotente;
- sessione di altro utente;
- item senza blueprint mapping;
- quantità/proprietà incompatibili;
- transazione parzialmente fallita;
- nessuna listing/outbox CardTrader;
- risultato tardivo durante review;
- TTL immagini senza perdita audit.
- budget esaurito: passaggio a `edge_only` senza perdita della sessione locale.

### Dispositivi

- iPhone Safari recente e device meno potente;
- Android Chrome fascia bassa/media/alta;
- background/foreground, low-memory e thermal throttling;
- 4G instabile, Wi-Fi lento e offline;
- permesso negato/revocato e camera senza torch.

---

## 17. Criteri di accettazione finali

- [ ] La camera non attende il modello pesante.
- [ ] Il costo backend mensile non supera la baseline pre-rilascio.
- [ ] Nessuna nuova GPU, istanza, coda, cache, database, bucket o API AI/OCR a consumo.
- [ ] Media ≤ 1,2 richieste recognition per carta e verifica crop ≤15%.
- [ ] Budget circuit breaker porta a `edge_only`/`needs_review`, non ad autoscaling o nuova spesa.
- [ ] Il browser parla solo con BFF `app/api/scanner/*`.
- [ ] Contratto con version handshake e ID canonici.
- [ ] Preprocessing build/runtime/edge con golden test.
- [ ] Auto-capture solo dopo qualità/stabilità e con rimozione carta.
- [ ] Almeno 100 carte senza fermare camera o aprire ricerca.
- [ ] Catture idempotenti e recuperabili dopo refresh/retry.
- [ ] Confidenze separate per nome/stampa/open-set.
- [ ] Top-3 e `needs_review` per gli item incerti.
- [ ] `blueprint_id` valido per ogni item inventariabile.
- [ ] Nessuna listing o stock esterno senza conferma.
- [ ] Promozione batch atomica, idempotente e con ownership.
- [ ] Target superati su holdout reale.
- [ ] Dashboard, feature flag, canary e rollback.
- [ ] Nessuna immagine persistita backend; feedback campionato con consenso, quota, retention e cleanup.
- [ ] Typecheck, lint, i18n keys, test e smoke mobile verdi.

---

## Raccomandazione finale

Non investire il prossimo ciclo nel solo tuning di `BALANCED`. Il salto di qualità arriva da:

1. cattura deterministica e continua;
2. preprocessing identico e versionato;
3. ID catalogo canonici;
4. retrieval più disambiguazione specifica per stampa;
5. confidenza calibrata con reject/needs-review;
6. sessione inventario persistente in locale e separata dalla pubblicazione;
7. dataset reale e feedback loop.

Priorità immediata: **Fase 0 + Fase 1**. La prima metrica da bloccare è la baseline economica: ogni fase successiva deve migliorare accuratezza e velocità riducendo il costo medio per carta abbastanza da mantenere invariato il costo backend mensile.

# Fase 0 — Audit dei punti di scrittura CardTrader

> Eseguito il 2026-07-14 su `C:\Users\xheta\repos\sync` (git main, ad99a05) e
> `C:\Users\xheta\repos\brx-marketplace` (sorgente recuperato dal container di
> produzione, baseline 7b1bdb0). Solo lettura, nessuna modifica.

## Matrice dei punti di scrittura

| # | Servizio | Trigger | Chiamata CardTrader | Gating modalità | Verdetto |
|---|---|---|---|---|---|
| 1 | sync | `PUT /sync/inventory/{u}/item/{id}` | Celery → `bulk_update_products` (`routes/sync.py:1493` → `tasks/sync_tasks.py:977`) | **Nessuno** (il sync non conosce le modalità) | Autorizzabile solo via gateway |
| 2 | sync | `DELETE /sync/inventory/{u}/item/{id}` | Celery → `delete_product` (`routes/sync.py:883` → `sync_tasks.py:1089`) | **Nessuno** | Autorizzabile solo via gateway |
| 3 | sync | `POST /sync/purchase/{u}/item/{id}` | **Inline, senza coda**: `increment_product_quantity(-q)` (`routes/sync.py:1140`), `delete_product` (`:1149`), rollback `+q` (`:1214`) | **Nessuno** + TOCTOU (lock rilasciato prima del decremento) | Da rifare (Fase 7 saga) |
| 4 | sync | Task `update_product_quantity` (`sync_tasks.py:551`) | `bulk_update_products` | **Nessuno** | Via gateway |
| 5 | marketplace | Creazione listing | `create_article` (`services/sync_service.py:86-102`) | Scrive in **PARTIAL e REAL** | **BUG**: partial non deve scrivere |
| 6 | marketplace | Cancellazione listing | `delete_article` (`services/listing_service.py:214-227`) | Scrive se `mode != DEMO` (**quindi anche PARTIAL**) | **BUG**: partial non deve scrivere |
| 7 | marketplace | Acquisto (saga) | `update_article_quantity` / `delete_article` (`services/order_service.py:97-101,188`) | Solo REAL (demo/partial → ordine mock, `sync_service.py:163-172`) | OK come gating, da spostare su outbox |
| 8 | marketplace | `register_webhook` (client) | POST webhook registration | Nessun call site trovato | Codice morto, rimuovere |

## Ingresso webhook (lato lettura, ma muta l'inventario locale)

- **sync**: `POST /sync/webhook/user/{id}` e legacy `/webhook/{id}`
  (`routes/sync.py:479,586`). Il validatore firma HMAC esiste
  (`core/webhook_validator.py`) ma **non è mai chiamato**: qualunque payload non
  firmato viene accettato. Il processor applica i delta **senza dedup, senza
  ledger, senza lock** (`services/webhook_processor.py:150-165`,
  `max(0, qty - n)`): un webhook duplicato decrementa due volte.
- **marketplace**: `api/routes/webhooks.py` — nessuna verifica firma rilevata.

## Conferme rispetto al piano

1. `brx_sync` non contiene alcun riferimento a demo/partial/shadow/real
   (grep su tutto `app/`): la barriera di modalità server-side non esiste (§3.1).
2. La modalità PARTIAL del marketplace **scrive davvero su CardTrader**
   (create + delete articolo): il testo UI corretto in Fase 8 era doveroso, ma
   la promessa "zero scritture" oggi è falsa lato backend.
3. Purchase del sync: scritture inline con TOCTOU (§Fase 7 del piano).
4. Firma webhook non enforced su entrambi i servizi (§3.3).

## Lista dei soli punti autorizzati a scrittura reale (post-Fase 1)

- Worker Celery sync #1/#2/#4 — dietro gateway + kill switch + modalità `real`.
- Saga acquisto marketplace #7 — dietro outbox verificata, solo `real`.
- Tutto il resto: bloccato fail-closed (demo/partial = zero mutazioni esterne).

## Ordine interventi proposto (Fase 1)

1. Marketplace: togliere PARTIAL da `sync_service.py:86` e `listing_service.py:214`
   (2 righe, effetto immediato: partial smette di scrivere).
2. sync: introdurre `execution_mode` + kill switch letti prima di ogni task
   Celery e nel purchase; default fail-closed se la config non è leggibile.
3. sync: attivare `validate_webhook_signature` sulle route webhook.
4. Dedup webhook minimo (chiave `webhook_id` in Redis/tabella) in attesa del
   ledger completo (Fase 5).

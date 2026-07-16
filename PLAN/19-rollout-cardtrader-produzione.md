# Piano 19 — Rollout sicuro CardTrader in produzione

> Stato: **in esecuzione, un passo alla volta**.
> Fasi 1, 2 e 3 completate. Fase 4 pronta ma non ancora avviata.

## Obiettivo

Portare in produzione il nuovo sync senza rischiare inventario, ordini o scambi.
Ogni fase ha un controllo finale: se non passa, ci si ferma e si torna allo stato sicuro.

## Regole di sicurezza

- Le scritture CardTrader restano disattivate fino al canary autorizzato.
- Nessuna migrazione distruttiva durante il rollout.
- Frontend, backend sync e backend marketplace hanno release e rollback separati.
- Le modifiche non collegate già presenti nei repository non vanno incluse nei commit.
- Un job con esito incerto non viene ripetuto alla cieca: prima si riconcilia l'inventario.
- Il database principale e i suoi snapshot non devono mai essere cancellati durante il rollout.

## Fase 1 — Preparare le release

- [x] Riesaminare i diff finali dei tre repository.
- [x] Separare le modifiche CardTrader da quelle non collegate.
- [x] Creare un commit dedicato per frontend, sync e marketplace.
- [x] Rieseguire tutte le suite, lint, typecheck e build sulle revisioni da rilasciare.
- [x] Salvare hash dei commit, tag immagini e versione precedente per il rollback.

**Gate:** tre revisioni pulite, riproducibili e tutte verdi.

### Esito locale del 2026-07-16

- Sync: commit `7bbbe2c`; 42 test verdi, Ruff e Compose verdi.
- Marketplace: commit base `f6e6455` e correzione deploy `c79abb3`; test, Ruff e Compose verdi.
- Frontend: commit `8aec798`; typecheck, lint, i18n, 285 test e build verdi.
- Tag immagine previsto sync: `cardtrader-sync-20260716-7bbbe2c`; rollback codice: `c0720c4`.
- Tag immagine previsto marketplace: `cardtrader-marketplace-20260716-c79abb3`; rollback codice: `3670068`.
- Frontend: release `8aec798`; rollback codice: `7cd6dba`.
- Migrazioni provate solo su PostgreSQL locale usa-e-getta: catena marketplace fino alla `011` e migrazione sync applicata due volte.
- Nessun push, deploy o scrittura reale verso CardTrader.

## Fase 2 — Backup e fotografia della produzione

- [x] Creare backup verificati dei database coinvolti.
- [x] Salvare le versioni correnti delle migrazioni e dei servizi.
- [x] Registrare code, outbox, webhook inbox, job `uncertain` e utenti abilitati.
- [x] Verificare il ripristino reale del backup su un'istanza temporanea isolata.
- [x] Confermare che i kill switch globale e per utente siano disponibili nella release candidata.

**Gate:** superato; backup ripristinabile e stato iniziale documentato.

### Fotografia di produzione del 2026-07-16

- Snapshot RDS manuale disponibile al 100%: `ebartex-cardtrader-pre-rollout-20260716-160626`.
- Copia cifrata disponibile al 100%: `ebartex-cardtrader-pre-rollout-20260716-160626-encrypted`.
- Database controllato: `ebartex_auth_db`, PostgreSQL `16.13`, migrazione marketplace `006_trade_visibility`.
- Le nuove tabelle e colonne CardTrader non sono ancora presenti: la base è quella prevista prima delle migrazioni.
- Controlli eseguiti in transazione `read-only`, sempre chiusa con rollback.
- Quantità listing negative: `0`.
- Prenotazioni terminali duplicate: `0`.
- Operazioni trade in stato `processing`: `0`.
- Code note sync e marketplace: tutte `0`.
- Configurazioni sync: `1 active`, `4 idle`; modalità marketplace: `5 demo`, `1 partial`, nessuna `real`.
- Inventario fotografato: `3513` righe CardTrader e `6` righe trade.
- Outbox, webhook inbox e job `uncertain` non esistono ancora perché saranno creati dalle nuove migrazioni.
- I servizi erano sani; il flag globale live era assente. Prima del deploy passivo deve essere impostato esplicitamente a `false`.
- Nessun dato è stato modificato o cancellato. Sono stati creati soltanto i due snapshot di sicurezza.

### Restore drill completato il 2026-07-16

- Creata la sola istanza privata `codex-cardtrader-restorecheck-20260716-01` dalla copia cifrata.
- Durante il test la copia era privata e protetta dalla cancellazione.
- Verificati in transazione `read-only`: database corretto, schema `006_trade_visibility`, 3519 righe inventario, 5 configurazioni sync, 6 configurazioni marketplace e 0 quantità negative.
- La copia temporanea è stata eliminata con un controllo rigido sul suo identificatore.
- Verifica finale: copia temporanea assente, produzione `available`, entrambi gli snapshot `available`.
- Nessun dato o snapshot del database reale è stato modificato o cancellato.

## Fase 3 — Provare migrazioni e deploy in staging

- [x] Applicare le migrazioni marketplace fino alla `011`.
- [x] Applicare dopo la migrazione del backend sync `20260716_cardtrader_execution_policy.sql`.
- [x] Verificare schema, constraint, indici e catena delle migrazioni.
- [x] Eseguire smoke test di collegamento, import, riconciliazione e modalità.
- [x] Provare il rollback applicativo senza eliminare le nuove tabelle.

**Gate:** superato; staging stabile, dati coerenti e rollback provato.

### Esito staging locale isolato del 2026-07-16

- Non esiste uno staging AWS dedicato: è stato usato un ambiente Docker locale isolato con soli dati sintetici.
- Migrazioni applicate nell'ordine previsto: baseline sync, marketplace fino alla `011`, poi migrazione sync; l'ultima è stata riapplicata senza errori.
- Tabelle, 18 colonne di policy e lifecycle, constraint e indici attesi risultano presenti.
- API sync, worker Celery, marketplace, PostgreSQL, MySQL e Redis sono risultati sani.
- DEMO e PARTIAL non hanno effettuato scritture; PARTIAL è passato alla versione 2.
- Il tentativo REAL è stato bloccato con HTTP 503 dal kill switch globale.
- Tutti i processi candidati avevano `CARDTRADER_WRITES_ENABLED=false`.
- Code REAL, outbox e inbox sono rimaste vuote; nessun listing pubblico o quantità negativa.
- Le vecchie immagini applicative sono ripartite sul nuovo schema senza rollback distruttivi del database.
- Trovato e corretto un errore nello script deploy marketplace: tentava di scaricare un worker ormai rimosso. Fix nel commit `c79abb3`, coperto da test.
- Tutti i container, la rete e le immagini temporanee di staging sono stati rimossi con nomi controllati.

## Fase 4 — Deploy passivo in produzione

- [ ] Impostare `CARDTRADER_WRITES_ENABLED=false`.
- [ ] Applicare le migrazioni nell'ordine già provato in staging.
- [ ] Rilasciare marketplace, sync, worker e frontend.
- [ ] Verificare healthcheck, code, log, endpoint e versione effettivamente attiva.
- [ ] Provare il kill switch senza effettuare scritture reali.

**Gate:** servizi sani e zero scritture verso CardTrader.

## Fase 5 — Collaudo in sola lettura

- [ ] Collegare un account interno controllato.
- [ ] Eseguire import completo e riconciliazione report-only.
- [ ] Verificare che snapshot incompleti non archivino articoli.
- [ ] Verificare inventario, paginazione, quantità e assenza di duplicati.
- [ ] Verificare DEMO e PARTIAL: nessuna scrittura CardTrader.
- [ ] Verificare REAL con kill switch attivo: scritture bloccate correttamente.

**Gate:** due export completi consecutivi coerenti e nessun drift inspiegato.

## Fase 6 — Canary reale controllato

- [ ] Abilitare le scritture solo per un account interno.
- [ ] Salvare una snapshot completa prima del test.
- [ ] Eseguire una piccola modifica reversibile su stock controllato.
- [ ] Verificare accettazione del job, polling, risultato per articolo e outbox.
- [ ] Provare un flusso controllato di acquisto/scambio e relativo escrow.
- [ ] Eseguire una nuova riconciliazione completa dopo ogni prova.
- [ ] Disabilitare subito le scritture se compare drift o un esito `uncertain`.

**Gate:** nessun doppio aggiornamento, overselling, perdita di stock o drift.

## Fase 7 — Apertura progressiva

- [ ] Account interni.
- [ ] Utenti selezionati manualmente.
- [ ] 1% degli utenti idonei.
- [ ] 10%.
- [ ] 25%.
- [ ] 50%.
- [ ] 100%.

Ogni aumento richiede una finestra stabile e una riconciliazione senza anomalie.
Per i primi scaglioni usare almeno 24 ore di osservazione.

## Fase 8 — Monitoraggio e chiusura

- [ ] Monitorare errori CardTrader, timeout e rate limit.
- [ ] Monitorare età e dimensione di code, outbox e webhook inbox.
- [ ] Monitorare job `uncertain`, dead letter e retry.
- [ ] Monitorare drift, articoli mancanti, duplicati e quantità negative.
- [ ] Monitorare acquisti, reservation escrow e recovery.
- [ ] Mantenere il 100% stabile per almeno 24 ore.
- [ ] Disattivare i percorsi legacy soltanto dopo la finestra stabile.
- [ ] Documentare esito finale, metriche e revisioni rilasciate.

**Gate finale:** sincronizzazione stabile, riconciliata e osservabile al 100%.

## Procedura rapida di emergenza

1. Impostare `CARDTRADER_WRITES_ENABLED=false`.
2. Disabilitare le scritture per gli utenti e fermare la coda REAL.
3. Conservare inbox, outbox, audit e snapshot.
4. Marcare i job in volo come `uncertain`, senza ripeterli automaticamente.
5. Eseguire una riconciliazione completa in sola lettura.
6. Se necessario, ripristinare la versione applicativa precedente.
7. Non fare rollback distruttivi del database.

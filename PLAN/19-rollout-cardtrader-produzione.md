# Piano 19 — Rollout sicuro CardTrader in produzione

> Stato: **da eseguire in futuro, un passo alla volta**.
> Il codice è stato verificato localmente, ma non sono stati eseguiti deploy,
> migrazioni in produzione o scritture reali verso CardTrader.

## Obiettivo

Portare in produzione il nuovo sync senza rischiare inventario, ordini o scambi.
Ogni fase ha un controllo finale: se non passa, ci si ferma e si torna allo stato sicuro.

## Regole di sicurezza

- Le scritture CardTrader restano disattivate fino al canary autorizzato.
- Nessuna migrazione distruttiva durante il rollout.
- Frontend, backend sync e backend marketplace hanno release e rollback separati.
- Le modifiche non collegate già presenti nei repository non vanno incluse nei commit.
- Un job con esito incerto non viene ripetuto alla cieca: prima si riconcilia l'inventario.

## Fase 1 — Preparare le release

- [ ] Riesaminare i diff finali dei tre repository.
- [ ] Separare le modifiche CardTrader da quelle non collegate.
- [ ] Creare un commit dedicato per frontend, sync e marketplace.
- [ ] Rieseguire tutte le suite, lint, typecheck e build sulle revisioni da rilasciare.
- [ ] Salvare hash dei commit, tag immagini e versione precedente per il rollback.

**Gate:** tre revisioni pulite, riproducibili e tutte verdi.

## Fase 2 — Backup e fotografia della produzione

- [ ] Creare backup verificati dei database coinvolti.
- [ ] Salvare le versioni correnti delle migrazioni e dei servizi.
- [ ] Registrare code, outbox, webhook inbox, job `uncertain` e utenti abilitati.
- [ ] Verificare che il backup sia leggibile e ripristinabile.
- [ ] Confermare che i kill switch globale e per utente siano disponibili.

**Gate:** backup valido e stato iniziale documentato.

## Fase 3 — Provare migrazioni e deploy in staging

- [ ] Applicare le migrazioni marketplace fino alla `011`.
- [ ] Applicare dopo la migrazione del backend sync `20260716_cardtrader_execution_policy.sql`.
- [ ] Verificare schema, constraint, indici e catena delle migrazioni.
- [ ] Eseguire smoke test di collegamento, import, riconciliazione e modalità.
- [ ] Provare il rollback applicativo senza eliminare le nuove tabelle.

**Gate:** staging stabile, dati coerenti e rollback provato.

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

# Come recuperare la chiave Meilisearch da AWS

La chiave Meilisearch **non** è salvata in AWS SSM/Secrets Manager (a differenza di JWT, DB password, ecc.). Viene passata al container Meilisearch tramite **variabile d’ambiente** sul server EC2.

## Dove si trova

Sul server **35.152.143.30** (o l’IP della tua istanza EC2), quando avvii i servizi con `docker-compose`, la chiave è nel file **`.env`** nella stessa cartella di `docker-compose.prod.yml` (o del compose che usi in produzione).

---

## Opzione 1 – Recuperarla via SSH (se hai accesso al server)

1. Connettiti all’EC2:
   ```bash
   ssh -i "tuo-key.pem" ubuntu@35.152.143.30
   ```
   (sostituisci `tuo-key.pem` e `ubuntu` se usi un altro utente)

2. Vai nella cartella dove gira docker-compose (es. dove c’è `docker-compose.prod.yml`):
   ```bash
   cd /home/ubuntu   # o il path che usi per il deploy
   # oppure
   cd /opt/ebartex
   ```

3. Cerca il file `.env`:
   ```bash
   ls -la .env
   cat .env | grep MEILISEARCH
   ```
   La riga che ti interessa è tipo:
   ```env
   MEILISEARCH_MASTER_KEY=xxxxxxxxxxxxxxxxxxxx
   ```

4. **Per il frontend** serve la **stessa** chiave. In locale, nel `.env` del frontend metti:
   ```env
   NEXT_PUBLIC_MEILISEARCH_API_KEY=xxxxxxxxxxxxxxxxxxxx
   ```
   (il valore copiato da `MEILISEARCH_MASTER_KEY`).

---

## Opzione 2 – Non hai accesso SSH

- Se il deploy lo fa un altro team, chiedi a loro il valore di **`MEILISEARCH_MASTER_KEY`** (o “chiave Meilisearch”) usato sul server.
- Se sei tu che deployi ma non ricordi dove l’hai messa: cerca sul PC dove tieni i file di deploy (clone del repo, script, backup del server) un file `.env` o uno script che imposta `MEILISEARCH_MASTER_KEY`.

---

## Opzione 3 – Generare una chiave nuova (se la vecchia è persa)

Se la chiave originale non si trova più:

1. **Genera una nuova master key** (es. 64 caratteri hex):
   ```bash
   openssl rand -hex 32
   ```

2. **Sul server EC2**:
   - Modifica il `.env` usato da docker-compose e imposta:
     ```env
     MEILISEARCH_MASTER_KEY=la_nuova_chiave_generata
     ```
   - Riavvia i container (almeno Meilisearch e search-service):
     ```bash
     docker-compose -f docker-compose.prod.yml down
     docker-compose -f docker-compose.prod.yml up -d
     ```

3. **In locale (frontend)** nel `.env`:
   ```env
   NEXT_PUBLIC_MEILISEARCH_API_KEY=la_nuova_chiave_generata
   ```

4. Riavvia il frontend: `npm run dev`.

**Nota:** con una chiave nuova, Meilisearch parte “pulito”; se avevi dati indicizzati prima, andranno re-indicizzati (es. tramite reindex del search-service).

---

## Riepilogo

| Dove | Cosa fare |
|------|-----------|
| **AWS SSM / Console** | La chiave Meilisearch **non** è lì. |
| **Server EC2 (SSH)** | Leggere `MEILISEARCH_MASTER_KEY` dal `.env` nella cartella del docker-compose. |
| **Frontend .env** | `NEXT_PUBLIC_MEILISEARCH_API_KEY` = stesso valore di `MEILISEARCH_MASTER_KEY` del server. |

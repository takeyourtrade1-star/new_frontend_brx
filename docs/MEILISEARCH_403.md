# Errore 403 "The provided API key is invalid"

## Perché succede

Nel file **`.env`** hai:
```env
NEXT_PUBLIC_MEILISEARCH_API_KEY=c6f42768c6b5dfae243b86bb87b586729a8728bfaee41df1236bc065e53a15d5
```

Questa chiave era del **vecchio** server Meilisearch. Il **nuovo** server (`35.152.143.30:7700`) è stato creato da Terraform e ha **chiavi diverse**. Quando il frontend invia la chiave vecchia, il nuovo server risponde **403 Forbidden**.

## Cosa fare

### Opzione A – Usare la chiave del nuovo server (consigliato)

1. Sul server dove gira Meilisearch (35.152.143.30), recupera la **Master Key** o una **Search API Key** del nuovo Meilisearch.
2. Nel `.env` del frontend **sostituisci** il valore di `NEXT_PUBLIC_MEILISEARCH_API_KEY` con quella nuova:
   ```env
   NEXT_PUBLIC_MEILISEARCH_API_KEY=la_nuova_chiave_qui
   ```
3. Riavvia il dev server: `npm run dev`.

### Opzione B – Provare senza chiave

Se sul nuovo Meilisearch la ricerca è consentita senza chiave (configurazione “no master key” o simile):

1. Nel `.env` **elimina** la riga:
   ```env
   NEXT_PUBLIC_MEILISEARCH_API_KEY=...
   ```
   oppure lasciala vuota:
   ```env
   NEXT_PUBLIC_MEILISEARCH_API_KEY=
   ```
2. Riavvia: `npm run dev`.

Se dopo aver rimosso la chiave vedi ancora 403, il server richiede una chiave: usa l’**Opzione A** e configura la chiave corretta nel `.env`.

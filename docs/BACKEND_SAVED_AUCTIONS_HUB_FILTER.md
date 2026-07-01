# Backend: tab "Salvate" nella home aste

Contesto: nella home `/aste` è stato aggiunto un quarto tab di navigazione
accanto a "In scadenza" / "Appena pubblicate" / "Scadute": **"Salvate"**.
Quando è attivo, la griglia/tabella mostra solo le aste che l'utente ha
salvato (bottone "salva per dopo" nel dettaglio asta).

Il microservizio aste (`AUCTION_API_URL`) non è in questo repo: questo
documento è il contratto da implementare lato backend. Il frontend è già
pronto e consuma l'endpoint esistente `GET /saved-auctions/me` tramite il
proxy BFF `app/api/saved-auctions/[...path]/route.ts` (cookie-first, 401
fail-closed, query string inoltrata as-is).

## Stato attuale (nessuna modifica bloccante)

`GET /saved-auctions/me?limit=&offset=` esiste già e restituisce l'intera
lista di aste salvate dell'utente (`AuctionAPI[]` completo, stessa shape di
`/auctions`). Il frontend lo consuma così com'è: nessuna modifica è
strettamente necessaria per far funzionare il tab.

## Miglioria proposta: filtro `status` server-side

Oggi il frontend richiede fino a `apiBatchCount * 20` risultati e poi
filtra/ordina in memoria (attive vs concluse, prezzo max, numero offerte
minimo). Va bene per liste piccole, ma se un utente salva centinaia di aste
diventa uno spreco di banda/CPU. Proposta: allineare `/saved-auctions/me`
allo stesso parametro `status` già supportato da `GET /auctions`.

### Contratto endpoint

```
GET /saved-auctions/me
Query params:
  limit    int, default 20, max 100 (invariato)
  offset   int, default 0            (invariato)
  status   string, opzionale — "ACTIVE" | "CLOSED"
           se assente: nessun filtro di stato (comportamento attuale)

Risposta (invariata):
{
  "success": true,
  "data": AuctionAPI[],
  "total": number,   // conteggio coerente con il filtro status applicato
  "limit": number,
  "offset": number
}
```

`AuctionAPI` è lo stesso schema già restituito da `/auctions` e
`/saved-auctions/me` oggi — nessun nuovo campo richiesto.

### Riferimento query (SQL, adattare al proprio ORM/stack)

```sql
SELECT a.*
FROM saved_auctions sa
JOIN auctions a ON a.id = sa.auction_id
WHERE sa.user_id = :current_user_id
  AND (:status IS NULL OR a.status = :status)
ORDER BY
  -- attive prima, ordinate per scadenza più vicina; concluse dopo,
  -- ordinate dalla più recente. Il frontend fa già questo ordinamento in
  -- memoria: spostarlo qui è opzionale, utile solo se si pagina davvero.
  (a.status = 'CLOSED'),
  CASE WHEN a.status != 'CLOSED' THEN a.ends_at END ASC,
  CASE WHEN a.status = 'CLOSED' THEN a.ends_at END DESC
LIMIT :limit OFFSET :offset;

SELECT COUNT(*)
FROM saved_auctions sa
JOIN auctions a ON a.id = sa.auction_id
WHERE sa.user_id = :current_user_id
  AND (:status IS NULL OR a.status = :status);
```

Indice utile se non già presente:
`saved_auctions (user_id, auction_id)` — dovrebbe già esistere per il
vincolo di unicità save/unsave; verificare che ci sia anche un indice su
`auctions.status` per la JOIN + filtro.

### Cosa NON cambia

- `POST /saved-auctions/{auctionId}` (save) — invariato.
- `DELETE /saved-auctions/{auctionId}` (unsave) — invariato.
- `GET /saved-auctions/me/{auctionId}` (stato salvato singola asta) — invariato.
- Nessuna nuova rotta: si estende solo `GET /saved-auctions/me` con un
  parametro opzionale, retrocompatibile (assente = comportamento attuale).

## Note per il frontend (già fatto, per riferimento)

- `components/feature/aste/AsteHubPage.tsx`: nuovo tab `'saved'` in
  `BrowseTab`; quando attivo, la query principale (`/auctions`) viene
  disabilitata e si usa `savedApi.listSaved(...)` al suo posto.
- Filtro prezzo/numero offerte/ricerca testuale restano client-side
  (invariati, si applicano sempre sopra la lista già ricevuta).
- Ordinamento saved: attive per scadenza crescente, poi concluse per data
  fine decrescente — lato client oggi, spostabile lato server se si
  implementa il parametro `status` sopra e si pagina sul serio.
- Tab visibile solo se l'utente è autenticato (`useAuthStore`).

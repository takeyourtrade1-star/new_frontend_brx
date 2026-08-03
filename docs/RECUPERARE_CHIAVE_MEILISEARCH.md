# Provisioning della chiave Meilisearch per il BFF

La chiave usata dal runtime Next.js non si “recupera” dalla master key: si crea
una credenziale distinta e revocabile, con privilegio minimo.

## Policy obbligatoria

Nel pannello/API amministrativa di Meilisearch, fuori dal frontend e usando un
canale operativo autorizzato, creare una key con:

```json
{
  "name": "brx-web-bff-search",
  "description": "Search-only key for the BRX web BFF",
  "actions": ["search"],
  "indexes": ["cards"]
}
```

Adattare `indexes` solo se il BFF interroga altri indici pubblici. Non ampliare
`actions`; per reindex e manutenzione esistono credenziali separate custodite
dal Search service, mai da pagine o bundle browser.

Salvare la chiave nel secret manager della piattaforma e iniettarla nel runtime
Next.js con il nome esatto:

```env
MEILISEARCH_SEARCH_API_KEY=<secret-manager-reference>
```

Configurare separatamente `MEILISEARCH_URL` e `MEILISEARCH_INDEX`. Non usare
alias generici come `MEILISEARCH_API_KEY`, `MEILI_API_KEY`, né variabili
`NEXT_PUBLIC_*`/`VITE_*`: il codice le rifiuta intenzionalmente.

## Rotazione e verifica pre-lancio

1. Revocare ogni vecchia key pubblicata o riutilizzata come admin/master.
2. Distribuire la nuova search-only key tramite secret manager.
3. Verificare che `/api/search` funzioni e che operazioni di scrittura,
   gestione indici e gestione chiavi siano negate con quella credenziale.
4. Controllare bundle, log e cronologia Git per identificare precedenti
   esposizioni; ruotare nuovamente se la key compare in uno di questi canali.
5. Documentare owner, indici consentiti, data di creazione e prossima rotazione.

La master key resta esclusivamente nel dominio operativo di Meilisearch e non
deve essere letta, copiata o memorizzata in questo repository.

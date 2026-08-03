# Autenticazione BFF → BRX Match

Le route browser `/api/scanner/*` sono l'unico ingresso supportato. Il BFF
autentica ogni richiesta upstream con entrambi gli header:

```text
X-Internal-Caller: web-bff
X-Internal-Token: <BRX_MATCH_SERVICE_TOKEN>
```

`BRX_MATCH_SERVICE_TOKEN` è server-only, dedicato a questo caller e lungo almeno
32 caratteri. Nel servizio BRX Match deve corrispondere a una entry della
configurazione `BRX_MATCH_CALLER_TOKENS`, per esempio il mapping del caller
`web-bff`. Non usare mai un nome `NEXT_PUBLIC_*`, non includere il valore in log,
risposte, bundle o screenshot diagnostici.

Quando il modello ONNX edge è abilitato, il deploy deve impostare anche
`SCANNER_EDGE_MODEL_BYTES` e `SCANNER_EDGE_MODEL_SHA256` con dimensione e
SHA-256 lowercase dell'artefatto immutabile approvato. Il digest va calcolato
sul file pubblicato (per esempio `sha256sum dinov2_small.onnx`), salvato nel
secret/config store della release e aggiornato solo insieme all'artefatto. In
produzione un digest assente/malformato o diverso dalla capability autenticata
disabilita edge fail-closed; il browser verifica nuovamente ogni byte prima di
passarlo al runtime ONNX.

In produzione il BFF fallisce chiuso se URL o token non sono configurati. Per la
rotazione: aggiungere temporaneamente il nuovo valore al secret store/backend,
distribuire il BFF con il nuovo token, verificare scanner e download modello,
quindi revocare il precedente e controllare i log 401/403. Effettuare la
rotazione anche dopo ogni sospetta esposizione.
In produzione `BRX_MATCH_API_URL` deve essere HTTPS. Solo una rete privata e
segmentata può usare HTTP, impostando esplicitamente
`BRX_MATCH_ALLOW_PRIVATE_HTTP=true`. Il target deve inoltre essere un IPv4
RFC1918/loopback oppure corrispondere esattamente a `BRX_MATCH_PRIVATE_HOST`.
La sua origine completa (schema, host e porta) deve comparire in
`BRX_MATCH_TRUSTED_ORIGINS`. In produzione l'allowlist è obbligatoria anche
per HTTPS, così una configurazione errata non può esfiltrare il token.
(per un nome DNS statico della rete container). Il solo flag non abilita
hostname arbitrari; URL con credenziali, path, query o fragment vengono
rifiutati.

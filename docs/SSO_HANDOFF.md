# Handoff SSO Ebartex -> Tornei

## Proprietà di sicurezza

- I cookie di Ebartex e Tornei restano `__Host-`, HttpOnly, Secure e host-only.
- Nessun access token o refresh token passa nella URL, nel client JavaScript o
  tra sottodomini.
- Il browser trasporta solo un authorization code opaco: 256 bit, 60 secondi,
  monouso, memorizzato da Auth soltanto come SHA-256.
- Il code è vincolato a client target, callback esatta, sessione sorgente,
  security stamp e challenge PKCE S256.
- `state` e PKCE verifier vivono in cookie transitori HttpOnly e host-only di
  Tornei per massimo 120 secondi; il verifier non è esposto a URL o JavaScript
  e viene inviato soltanto server-to-server da Tornei ad Auth.
- Authorize ed exchange sono chiamate server-to-server con due client secret
  diversi. Entrambe rifiutano redirect e risposte non bounded.
- Auth applica bucket Redis dedicati e fail-closed ai due endpoint SSO; le
  soglie aggregate dei BFF restano configurabili per ambiente.
- La sessione Tornei emessa è distinta da quella marketplace. Logout o revoca
  della sorgente impediscono lo scambio di code non ancora consumati.

## Flusso

1. Un link Ebartex apre
   `https://tornei.ebartex.com/auth/bridge/sso/start?next=...`.
2. Tornei genera `state`, verifier e challenge, salva solo i primi due nei suoi
   cookie HttpOnly e reindirizza al BFF Ebartex.
3. Il BFF Ebartex legge il proprio refresh cookie e chiede un code ad Auth con
   `SSO_MARKETPLACE_CLIENT_SECRET`.
4. Il browser torna al callback Tornei con `code` e `state`.
5. Tornei verifica `state`, manda code + verifier ad Auth con
   `SSO_TOURNAMENTS_CLIENT_SECRET`, poi imposta nuovi cookie locali.
6. Il callback elimina i cookie transitori e reindirizza soltanto a un path
   interno sanitizzato.

Il pulsante "Torna su Ebartex" non esegue un handoff inverso: apre l'origin
principale, dove il cookie Ebartex originale è ancora valido e non è mai stato
condiviso con Tornei.

## Configurazione

Auth:

- `SSO_ENABLED=false|true`
- `SSO_CODE_TTL_SECONDS=60`
- `SSO_AUTHORIZE_RATE_LIMIT_PER_MINUTE=600`
- `SSO_EXCHANGE_RATE_LIMIT_PER_MINUTE=600`
- `SSO_MARKETPLACE_ORIGIN=https://www.ebartex.com`
- `SSO_TOURNAMENTS_ORIGIN=https://tornei.ebartex.com`
- `SSO_MARKETPLACE_CLIENT_SECRET` oppure relativo parametro SSM
- `SSO_TOURNAMENTS_CLIENT_SECRET` oppure relativo parametro SSM

Marketplace:

- `SSO_HANDOFF_ENABLED=false|true`
- `SSO_MARKETPLACE_CLIENT_SECRET`, uguale solo al secret marketplace di Auth

Tornei:

- `SSO_HANDOFF_ENABLED=false|true`
- `SSO_TOURNAMENTS_CLIENT_SECRET`, uguale solo al secret Tornei di Auth

I due secret devono essere casuali URL-safe da almeno 32 caratteri, diversi tra
loro, server-only e iniettati a runtime. Auth rifiuta il broker se coincidono.
Non usare mai `NEXT_PUBLIC_*`.

## Rollout e rollback

1. Applicare la migrazione Auth `008_sso_authorization_codes`.
2. Distribuire Auth, marketplace e Tornei con i flag ancora `false`.
3. Iniettare e verificare i due secret distinti e la disponibilità Redis di Auth.
4. Abilitare prima Auth, poi marketplace, infine Tornei.
5. Eseguire smoke autenticato con due account e verificare anche: sessione
   assente, state manomesso, code scaduto, replay, callback diversa e logout.

Rollback: disabilitare `SSO_HANDOFF_ENABLED` sui due frontend e poi
`SSO_ENABLED` su Auth. I link ripiegano sul login locale; i code residui scadono
entro 60 secondi. La tabella può restare presente durante il rollback.

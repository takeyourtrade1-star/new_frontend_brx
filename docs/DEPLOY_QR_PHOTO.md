# Deploy: flusso QR foto (vendi + aste)

Build marker attuale sul telefono: `data-mobile-photo-build="20260528"`.

## 1. Auction backend (ECR)

```powershell
cd Main-app\backend\ebartex_auction
# build/push con il vostro script ECR esistente, poi sul server:
bash start_auction.sh
```

### Smoke test guest status

```bash
# Sessione attiva (sostituire TOKEN e SESSION_ID)
curl -s -H "X-Pairing-Upload-Token: TOKEN" \
  "https://auction-api.ebartex.com/auctions/photos/pairing-sessions/SESSION_ID"

# Atteso:
# {"success":true,"data":{"status":"active","photos_count":0,"max_photos":4,"expires_at":"...","context_type":"listing"}}

# Revoca da PC (JWT)
curl -s -X DELETE -H "Authorization: Bearer JWT" \
  "https://auction-api.ebartex.com/auctions/photos/pairing-sessions/SESSION_ID"

# Guest poll dopo revoke → HTTP 410
```

## 2. Frontend Amplify

1. Push branch `main` su GitHub
2. Amplify Console → **Redeploy** (forzato)
3. Verificare env: `AUCTION_API_URL`, `NEXT_PUBLIC_AUCTION_API_URL`

## 3. Verifica telefono

1. Cancella cache sito / dati per il dominio Amplify
2. Scansiona **QR nuovo** (non tab vecchio)
3. Ispeziona elemento root: `data-mobile-photo-build="20260528"`
4. Dopo "Invia al PC" → schermata "Foto inviata!" + "Sì, altra foto"

## 4. npm install (locale / CI)

Se `react-advanced-cropper` non è in node_modules:

```bash
cd Main-app/frontend && npm install
```

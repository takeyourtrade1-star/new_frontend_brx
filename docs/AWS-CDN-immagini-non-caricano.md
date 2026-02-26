# Immagini CDN: alcune caricano (es. brx_bg.png) e altre no (es. cart-icon.png)

Il frontend costruisce sempre URL nella forma:
`https://<tuo-cdn>.cloudfront.net/images/<path>`  
(es. `.../images/cart-icon.png`, `.../images/brx_bg.png`).

Se **brx_bg.png** carica e **cart-icon.png** no, il problema è **solo su AWS** (S3 + CloudFront). Di seguito cosa verificare.

---

## 1. S3 – Verificare che i file esistano nel bucket

1. Apri **AWS Console** → **S3** → bucket usato come **origin** della distribuzione CloudFront.
2. Controlla la **struttura delle cartelle**:
   - L’URL è `.../images/cart-icon.png` → in S3 deve esistere la **chiave** (path) `images/cart-icon.png` (o `images/cart-icon.PNG` se usi quella maiuscola).
3. **Case sensitivity**: S3 è **case-sensitive**.
   - Se in S3 hai `images/Cart-Icon.png` e il frontend chiede `images/cart-icon.png`, la richiesta fallisce.
   - Controlla che il nome del file in S3 sia **esattamente** `cart-icon.png` (minuscolo e con il trattino).
4. Controlla che esistano anche gli altri file che danno 404, ad esempio:
   - `images/cart-icon.png`
   - `images/user-icon.png`
   - `images/acquisti-icon.png`
   - `images/brx-icon.png`
   - `images/landing/...` (per le altre icone della landing)
   - ecc.

**Soluzione**: Caricare i file mancanti nel bucket con la chiave corretta (es. `images/cart-icon.png`) oppure rinominare in S3 per far coincidere esattamente l’URL usato dal frontend.

---

## 2. CloudFront – Origin e permessi

1. **AWS Console** → **CloudFront** → la tua distribuzione (quella il cui dominio è tipo `di0y87a9s8da9.cloudfront.net`).
2. Scheda **Origins**:
   - Verifica che l’origin sia il bucket S3 corretto.
   - Se usi **Origin Access Control (OAC)** o **Origin Access Identity (OAI)**:
     - Il **bucket policy** di S3 deve consentire esplicitamente a CloudFront di leggere gli oggetti (es. `s3:GetObject` per quell’origin).
     - La policy deve riferirsi all’OAC/OAI della distribuzione; se è stata creata una nuova distribuzione o un nuovo OAC, a volte la policy non è aggiornata.
3. **Cache behavior** per `/images/*` (o per `/*`):
   - **Allowed HTTP Methods**: almeno **GET, HEAD, OPTIONS**.
   - **Viewer Protocol Policy**: HTTP e HTTPS come ti serve.
   - Nessuna **restrizione** che blocchi certe estensioni (es. `.png`) o path.

Se **brx_bg.png** viene servita, di solito la configurazione generale di CloudFront e dell’origin è corretta; il problema è spesso che **l’oggetto non esiste** in S3 con quella chiave esatta.

---

## 3. Permessi sul bucket S3 (bucket policy)

1. S3 → bucket → **Permissions** → **Bucket policy**.
2. Se usi OAC/OAI, la policy deve contenere qualcosa di questo tipo (adatta ARN e bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::NOME-BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ID-ACCOUNT:distribution/DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

- `NOME-BUCKET`: nome del bucket.
- `DISTRIBUTION-ID`: ID della distribuzione CloudFront (es. `E1234ABCD5678`).
- `ID-ACCOUNT`: ID dell’account AWS.

Così CloudFront può leggere **tutti** gli oggetti nel bucket (`/*`). Se **brx_bg.png** è in `images/brx_bg.png` e funziona, i permessi generali vanno bene; il problema resta quasi sempre **file mancante o nome/path diverso** (es. `cart-icon.png` assente o con nome diverso).

---

## 4. Cache CloudFront (invalida se hai appena caricato i file)

Se hai caricato o rinominato i file **dopo** aver già aperto il sito:

1. CloudFront → la tua distribuzione → **Invalidations**.
2. Crea una **new invalidation** con path:
   - `/images/*`  
   oppure
   - `/images/cart-icon.png` (e gli altri che non si vedono).

Attendi che l’invalidazione sia completata e riprova.

---

## 5. Controllo rapido dall’esterno

- Apri in browser (o con `curl`):
  - `https://di0y87a9s8da9.cloudfront.net/images/brx_bg.png` → 200 OK.
  - `https://di0y87a9s8da9.cloudfront.net/images/cart-icon.png` → se vedi 403/404, il file non è raggiungibile (mancante in S3, path sbagliato, permessi o cache).

---

## Riepilogo – ordine consigliato

1. **S3**: Verificare che esista la chiave `images/cart-icon.png` (e gli altri file che non caricano), con **nome e path esatti** (incluso maiuscole/minuscole).
2. **S3**: Se mancano, caricare i file con la chiave corretta (es. `images/cart-icon.png`).
3. **CloudFront**: Creare un’invalidazione per `/images/*` (o per i path specifici) se hai appena modificato S3.
4. **CloudFront / S3**: Verificare bucket policy e OAC/OAI solo se anche **brx_bg.png** fosse in errore (nel tuo caso di solito non è il primo sospetto).

In sintesi: se una immagine sotto `/images/` funziona e un’altra no, nella maggior parte dei casi **l’immagine che non carica non è presente in S3 con quel path esatto** (o ha un nome leggermente diverso). Controllare prima l’esistenza e il nome in S3.

UNICA CARTELLA IMMAGINI DEL PROGETTO
====================================

Tutte le immagini UI (loghi, icone, illustrazioni, carousel, ecc.) stanno qui.
La cartella "images" alla root del progetto è stata rimossa e il contenuto unificato qui.

- In sviluppo: i file sono serviti come /images/nomefile.png (Next.js serve public/ dalla root).
- In produzione senza CDN: stesso path /images/...
- In produzione con CDN: configurare NEXT_PUBLIC_CDN_URL; le immagini vanno sul CDN.

Uso nel codice:
  import { getCdnImageUrl } from '@/lib/config';
  <img src={getCdnImageUrl('nomefile.png')} alt="..." />
  Per path con spazi: getCdnImageUrl('Logo%20Principale%20EBARTEX.png')
  Fallback locale: <img src="/images/nomefile.png" alt="..." />

CARICAMENTO SU AWS (CDN / S3)
-----------------------------
Carica il contenuto di QUESTA cartella (public/images) così com'è.

- Destinazione sul bucket CDN: prefisso "images/" (es. s3://bucket/images/).
- L'URL base deve essere: https://TUO-DOMAIN.cloudfront.net/images
  così che un file public/images/Logo Principale EBARTEX.png sia raggiungibile come
  https://TUO-DOMAIN.cloudfront.net/images/Logo%20Principale%20EBARTEX.png

Struttura da rispettare (sottocartelle usate dal codice):
  images/
  images/landing/          (sale 1.png, security-lock 1.png, swap 1.png, justice 1.png, sold-out 1.png, economic-growth 1.png)
  images/loghi-giochi/     (magic.png, yu-gi-oh.png, pokèmon.png, One_Piece_Card_Game_Logo 1.png, Disney_Lorcana_480x480 1.png)
  images/icone-credito/    (file con hash .png)
  images/carousel/         (slide1.jpg, slide2.jpg, slide3.jpg — hero home)
  images/card-3/           (card thumb per Compra/Vendi e Scambia)
  images/acquisti-frames/  (Frame 334.jpg, Frame 335.jpg, Frame 336.jpg)
  images/footers-images/   (immagini footer)

Imposta nel frontend: NEXT_PUBLIC_CDN_URL=https://TUO-DOMAIN.cloudfront.net (senza / finale).

SVUOTARE LA CACHE DEL CDN (CloudFront)
--------------------------------------
Dopo aver caricato nuove/aggiornate immagini su S3, CloudFront continua a servire la versione in cache.
Per far vedere subito le modifiche devi creare una invalidazione.

- Console AWS: CloudFront → la tua distribuzione → tab "Invalidations" → "Create invalidation".
  Path da invalidare:
    /images/*          (tutte le immagini)
  oppure solo un file: /images/carousel/slide1.jpg

- AWS CLI (es. dopo un deploy):
    aws cloudfront create-invalidation --distribution-id TUO_DISTRIBUTION_ID --paths "/images/*"

- Terraform (se gestisci CloudFront con Terraform): risorsa aws_cloudfront_cache_policy o
  invalidazione manuale come sopra; in alternativa usa versioning/query string sulle URL per evitare cache vecchie.

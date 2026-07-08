# Art direction — guardaroba Asso

Regole per disegnare item coerenti con la faccia della mascotte
("stesso tratto", non "foto stampate sopra"). Vale per ogni nuovo item.

## Griglia di ancoraggio (card 96×128)

Slot documentati in `manifest.ts` (`SLOT_FRAMES`). Disegna **dentro il viewBox
dello slot**: l'allineamento con la faccia è garantito per costruzione.
Riferimenti faccia: occhi ≈ y 38–46 (centri x 33/63 in coordinate card),
bocca ≈ y 78–84.

## Tratto

- Linea di contorno: `#4a5548` (identica alla faccia), `stroke-linecap/linejoin: round`.
- Pesi: **2** per silhouette (1.8 nei viewBox 96 di larghezza), **1.4–1.6** per dettagli.
- L'alone chiaro attorno all'item lo dà il CSS (`.asso-item-art` → drop-shadow
  `#faf9f6`), non va disegnato nell'SVG.
- Eccezione: montature occhiali usano il colore del materiale (nero/oro) come
  contorno, perché la montatura *è* la linea.

## Colore

Palette chiusa:
- Brand: `#FF7300` / `#FFA246` / `#E05F00` (ombra)
- Accent freddi: indigo `#6366F1`–`#4338CA`, teal `#10B981`
- Oro: `#FDE68A`–`#F59E0B` (solo premi)
- Neutri: `#faf9f6` (crema, come halo faccia), `#18181b`, `#3f3f46`, `#a1a1aa`

**Max 1 gradiente per item** (verticale, luce dall'alto). Niente stack di
gradient/radial multipli, niente filtri SVG.

## Forme

- Silhouette morbide e arrotondate (raggio generoso), coerenti col viso tondo.
- Dettagli pochi e leggibili a 96 px: se non si vede alla dimensione reale, via.
- Riflessi: 1–2 tratti crema con `opacity`, non gradient dedicati.

## Tecnica

- Componente React (`export default function <Nome>Art()`), JSX SVG puro,
  `aria-hidden="true"`, nessuna stringa `dangerouslySetInnerHTML`.
- ID dei gradient prefissati `asso<Item>…` (unici nel DOM).
- File registrato in `manifest.ts` (`WARDROBE_ITEMS` + `WARDROBE_ITEM_LOADERS`)
  e nome in tutte e 6 le lingue (`asso.item.<id>`).

# Card Scanner Setup Guide (Native)

## Panoramica

Il componente `CardScanner` usa una pipeline nativa browser (canvas + homography) per scansionare carte TCG in modo rapido e stabile, senza dipendenze OpenCV.

Funzionalita principali:
- Calibrazione manuale con 4 punti (angoli carta nel dock)
- Auto-capture con frame differencing
- Correzione prospettica nativa su canvas
- Batch continuo: scatti in sequenza senza click tra una carta e la successiva
- Gallery laterale per controllo ed eliminazione immagini

## Struttura Attuale

```text
components/
  CardScanner.tsx
hooks/
  useAutoCapture.ts
```

## Come Funziona

### 1. Calibrazione

L'utente sposta i 4 marker sugli angoli della carta nel dock e salva.
Le coordinate sono normalizzate e salvate in `localStorage` con chiave:
- `card-scanner-calibration`

### 2. Rilevazione Movimento

Il loop di scansione usa `requestAnimationFrame` e il hook `useAutoCapture`:
- riduce il frame a risoluzione di analisi
- converte in grayscale
- calcola differenza col frame precedente
- attende movimento e poi stabilizzazione
- quando stabile, genera uno scatto

### 3. Trasformazione Prospettica

Al trigger di cattura:
- legge il frame camera in canvas
- calcola una homography dai 4 punti calibrati
- warpa la quadrilatera della carta in rettangolo target
- exporta JPEG in base64

Dimensione output:
- `630 x 880`

### 4. Batch Continuo

Con `batchMode={true}`:
- non mostra review ad ogni scatto
- resta in scanning continuo
- aggiunge ogni immagine al batch
- applica lock breve anti-doppio scatto durante il cambio carta

## API Componente

`CardScanner` props:
- `onCapture?: (imageData: string) => void`
- `onBatchComplete?: (images: CapturedCard[]) => void`
- `onError?: (error: Error) => void`
- `batchMode?: boolean` default `true`
- `maxBatchSize?: number` default `50`

`CapturedCard`:
- `id: string`
- `imageData: string`
- `timestamp: number`

## Esempio Uso

```tsx
'use client';

import CardScanner from '@/components/CardScanner';

export default function ScanPage() {
  return (
    <CardScanner
      batchMode={true}
      maxBatchSize={80}
      onCapture={(img) => {
        console.log('Captured', img.slice(0, 40));
      }}
      onBatchComplete={(batch) => {
        console.log('Batch completo', batch.length);
      }}
      onError={(err) => {
        console.error('Scanner error', err);
      }}
    />
  );
}
```

## UX Operativa Consigliata

Per scansione veloce in dock:
1. Calibra una volta con luce stabile.
2. Inserisci carta.
3. Attendi auto-scatto.
4. Sostituisci carta subito dopo lo scatto.
5. Ripeti fino a fine lotto.
6. Apri gallery e completa batch.

## Tuning Rapido

Se vuoi piu velocita o piu robustezza, agisci in `useAutoCapture`:
- `changePercentageThreshold`
- `stabilityFramesRequired`
- `diffThreshold`

## Note di Migrazione

La pipeline OpenCV e stata rimossa dal runtime scanner.
I riferimenti legacy (loader OpenCV, worker placeholder, script download) non sono piu necessari.

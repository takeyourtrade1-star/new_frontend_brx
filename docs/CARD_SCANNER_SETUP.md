# Card Scanner Component - Setup Guide

## Overview

Il componente `CardScanner` implementa uno scanner automatico per carte collezionabili TCG con:
- **Calibrazione interattiva** con 4 punti trascinabili
- **Auto-capture** tramite frame differencing (60 FPS)
- **Correzione prospettica** con OpenCV.js
- **Performance ottimizzata** per dispositivi mobile
- **Lazy loading** - OpenCV.js si carica solo quando necessario
- **Progress indicator** - Barra di progresso visibile durante caricamento
- **Batch scanning** - Scannerizza multiple carte in sequenza rapida

## File Generati

```
components/
  └── CardScanner.tsx          # Componente principale
hooks/
  ├── useOpenCV.ts             # Hook caricamento WASM OpenCV (con lazy loading)
  └── useAutoCapture.ts        # Hook logica auto-capture
public/
  ├── opencv/
  │   └── opencv.js            # OpenCV.js WASM (~10 MB con WASM embedded)
  └── workers/
      └── card-scanner.worker.js # Web Worker (placeholder)
```

## Setup OpenCV.js

### 1. Download OpenCV.js

Scarica i file OpenCV.js WebAssembly:

```bash
# Crea la directory
mkdir -p public/opencv

# Scarica dalla release ufficiale (esempio con 4.8.0)
curl -L https://docs.opencv.org/4.8.0/opencv.js -o public/opencv/opencv.js
curl -L https://docs.opencv.org/4.8.0/opencv_js.wasm -o public/opencv/opencv_js.wasm
```

> **Nota**: Per produzione, considera di usare una CDN o di ottimizzare il build di OpenCV.js includendo solo i moduli necessari (imgproc, core).

### 2. Struttura Files Richiesta

```
public/
  └── opencv/
      ├── opencv.js           # ~2.5 MB (minified)
      └── opencv_js.wasm      # ~7 MB (WebAssembly binary)
```

### 3. Installa react-webcam

```bash
npm install react-webcam
# o
yarn add react-webcam
```

## Utilizzo del Componente

### Esempio Base

```tsx
'use client';

import CardScanner from '@/components/CardScanner';

export default function ScanPage() {
  const handleCapture = (imageData: string) => {
    // imageData è una stringa base64 JPEG
    console.log('Carta catturata:', imageData);
    
    // Salva sul server, invia a ML model, etc.
    // fetch('/api/cards', { method: 'POST', body: imageData })
  };

  const handleError = (error: Error) => {
    console.error('Errore scanner:', error);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">
        Scanner Carte
      </h1>
      <CardScanner 
        onCapture={handleCapture}
        onError={handleError}
      />
    </div>
  );
}
```

### In una Pagina Vendi

```tsx
// app/vendi/scanner/page.tsx
'use client';

import { useState } from 'react';
import CardScanner from '@/components/CardScanner';
import { useRouter } from 'next/navigation';

export default function CardScannerPage() {
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const router = useRouter();

  const handleCapture = async (imageData: string) => {
    setScannedImage(imageData);
    
    // Opzionale: salva in sessionStorage per la pagina vendi
    sessionStorage.setItem('scanned-card-image', imageData);
    
    // Redirect alla pagina vendi con l'immagine
    // router.push('/vendi?scanned=true');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {!scannedImage ? (
        <CardScanner onCapture={handleCapture} />
      ) : (
        <div className="text-center">
          <img 
            src={scannedImage} 
            alt="Carta scannerizzata"
            className="max-w-md mx-auto rounded-lg shadow-lg"
          />
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => setScannedImage(null)}
              className="px-4 py-2 bg-zinc-700 text-white rounded-lg"
            >
              Scannerizza un&apos;altra
            </button>
            <button
              onClick={() => router.push('/vendi/aggiungi')}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Usa questa immagine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Come Funziona

### Fase 1: Calibrazione (Setup una tantum)

1. L'utente posiziona 4 punti sugli angoli della carta fisica nel dock
2. I punti sono normalizzati (coordinate 0-1) per funzionare con qualsiasi risoluzione
3. La matrice di trasformazione viene calcolata con `cv.getPerspectiveTransform()`
4. I punti vengono salvati in `localStorage` per uso futuro

### Fase 2: Scansione Rapida (Auto-Capture)

1. **Frame Extraction**: `requestAnimationFrame` a ~60 FPS
2. **Frame Differencing**: confronto pixel-by-pixel tra frame consecutivi
3. **Hysteresis Trigger**: 
   - Rilevamento movimento (>8% pixel cambiati)
   - Stabilizzazione (5 frame stabili)
   - Scatto automatico
4. **Perspective Transform**: `cv.warpPerspective()` per estrarre la carta
5. **Output**: Immagine 630x880 pixel (rapporto carta TCG standard)

## Gestione Memoria

Il componente implementa cleanup aggressivo delle matrici OpenCV:

```typescript
// Esempio dal codice
let srcMat: any = null;
let dstMat: any = null;
let M: any = null;

try {
  srcMat = cv.matFromArray(...);
  dstMat = new cv.Mat();
  M = cv.getPerspectiveTransform(...);
  cv.warpPerspective(srcMat, dstMat, M, dsize);
  // ... process output
} finally {
  // CRITICAL: sempre liberare la memoria
  safeDeleteMat(srcMat);
  safeDeleteMat(dstMat);
  safeDeleteMat(M);
}
```

## Performance Considerations

### Risoluzione di Processing
- Frame analysis a **480p** (non full resolution)
- Mantiene 60 FPS anche su dispositivi mid-range
- Output finale a **630x880** (alta qualità)

### Ottimizzazioni Implementate
- `willReadFrequently: true` su canvas context
- `requestAnimationFrame` per sync con refresh rate
- Focus lock continuo sui dispositivi che lo supportano
- Singleton pattern per OpenCV.js (evita reload)

### Limitazioni Web Worker
OpenCV.js WASM ha dipendenze DOM che impediscono l'uso in Web Workers. 
Per processing pesante, considerare:
- **OffscreenCanvas** (Chrome 69+, Edge 79+)
- **WebGL** per image processing GPU-accelerated
- **TensorFlow.js** per ML-based detection

## Batch Scanning Mode

Il componente supporta la scansione in batch per catturare multiple carte in sequenza rapida.

### Attivare Batch Mode

```tsx
<CardScanner 
  batchMode={true}           // Abilita batch scanning
  maxBatchSize={50}          // Max carte nel batch (default: 50)
  onCapture={(img) => console.log('Singola:', img)}
  onBatchComplete={(batch) => {
    // Ricevi tutte le carte alla fine
    console.log(`Batch completato: ${batch.length} carte`);
    batch.forEach((card, i) => {
      console.log(`Carta ${i + 1}:`, card.id, card.timestamp);
      // Upload to server, etc.
    });
  }}
/>
```

### Interfaccia Batch

Quando il batch mode è attivo (`batchMode={true}`):

1. **Modalità Scanning**: Scannerizza automaticamente le carte
2. **Modalità Review**: Dopo ogni scansione, mostra l'anteprima con opzioni:
   - **Riprova** - Scannerizza di nuovo la stessa carta
   - **Scansiona Altra** - Continua con la prossima carta
   - **Gallery** - Apri la sidebar con tutte le carte catturate
   - **Completa Batch** - Finisci e invia tutto il batch

3. **Gallery Sidebar**: Mostra tutte le carte in grid:
   - Visualizza thumbnails 2 colonne
   - Elimina singole carte (hover → trash icon)
   - Counter progressivo (#1, #2, #3...)
   - Bottone "Completa Batch" nel footer

### Flusso Batch

```
Scanning → Captured → Review → [Scansiona Altra] → Scanning...
                              ↓
                         [Completa Batch]
                              ↓
                    onBatchComplete(cards[])
```

### Dati Batch

```typescript
interface CapturedCard {
  id: string;           // UUID univoco
  imageData: string;    // Base64 JPEG
  timestamp: number;    // Unix timestamp
}
```

### Disabilitare Batch Mode

Per scansione singola (comportamento originale):

```tsx
<CardScanner batchMode={false} onCapture={handleSingle} />
```

In questo modo:
- Dopo ogni scansione l'anteprima rimane fissa
- L'utente deve manualmente cliccare per continuare
- Nessuna raccolta batch

## API Reference

### CardScanner Props

| Prop | Type | Default | Descrizione |
|------|------|---------|-------------|
| `onCapture` | `(imageData: string) => void` | - | Callback con immagine base64 JPEG (ogni scansione) |
| `onBatchComplete` | `(images: CapturedCard[]) => void` | - | Callback quando il batch è completato |
| `onError` | `(error: Error) => void` | - | Callback errori OpenCV/camera |
| `batchMode` | `boolean` | `true` | Abilita modalità batch scanning |
| `maxBatchSize` | `number` | `50` | Max numero di carte nel batch |

### useOpenCV Hook

```typescript
const { cv, status, error, progress, load } = useOpenCV({
  lazy: true,              // true = carica manualmente con load()
  jsPath: '/opencv/opencv.js',  // path al file JS
  wasmPath: null,          // null = WASM embedded, oppure '/opencv/opencv_js.wasm'
  onProgress: (p) => console.log(`${p}%`)  // callback progresso
});

// status: 'idle' | 'loading' | 'initializing' | 'ready' | 'error'
// cv: OpenCV instance (null until ready)
// progress: 0-100 loading progress
// load: () => Promise<OpenCV | null> - trigger manual loading
```

#### Lazy Loading Pattern

```typescript
// 1. Inizializza con lazy: true
const { cv, status, progress, load } = useOpenCV({ lazy: true });

// 2. Stati iniziali
// status: 'idle', progress: 0

// 3. Trigger caricamento quando serve
const handleStart = async () => {
  const opencv = await load();
  // ora opencv è pronto
};

// 4. Mostra progresso durante caricamento
if (status === 'loading') {
  return <ProgressBar value={progress} />; // 0-30% download
}
if (status === 'initializing') {
  return <ProgressBar value={progress} />; // 30-100% WASM compile
}
```

#### External WASM per Better Caching

```typescript
// Per usare WASM file separato (meglio per caching)
const { cv, status } = useOpenCV({
  wasmPath: '/opencv/opencv_js.wasm', // WASM separato
  // jsPath: '/opencv/opencv.js',     // JS più piccolo senza WASM embedded
});
```

**Vantaggi WASM esterno:**
- JS più piccolo (~3 MB vs ~10 MB)
- WASM può essere cached separatamente dal browser
- Aggiornamenti più granulari

**Svantaggi:**
- Richiede 2 download (JS + WASM)
- Configurazione più complessa

### useAutoCapture Hook

```typescript
const { 
  status,           // 'idle' | 'detecting' | 'stabilizing' | 'captured'
  stabilityProgress, // 0-1 progress bar
  processFrame,     // (video, canvas) => boolean
  resetCapture,     // () => void
  isStable          // boolean
} = useAutoCapture({
  diffThreshold: 30,              // Soglia differenza pixel (0-255)
  changePercentageThreshold: 0.08, // % pixel che devono cambiare
  stabilityFramesRequired: 5,      // Frame stabili prima dello scatto
  roi: null                         // Region of interest opzionale
});
```

## UI States (CardScanner)

Il componente mostra diverse UI in base allo stato di OpenCV:

### 1. Idle State (Default)
- **Trigger**: Componente montato, OpenCV non caricato
- **UI**: Schermata promozionale con pulsante "Avvia Scanner"
- **Azione**: L'utente deve cliccare per caricare OpenCV.js (~10 MB)

```
┌─────────────────────────────────────┐
│         [Icona Scanner]              │
│     Scanner Carte TCG              │
│                                    │
│  Richiede OpenCV.js (~10 MB)       │
│  Carica una sola volta             │
│                                    │
│  [▶ Avvia Scanner]                 │
└─────────────────────────────────────┘
```

### 2. Loading State (Download)
- **Trigger**: Cliccato "Avvia Scanner", download in corso
- **Progress**: 0% → 30% (download JS file)
- **UI**: Spinner + progress bar + percentuale

### 3. Initializing State (WASM Compile)
- **Trigger**: JS scaricato, compilazione WASM in corso
- **Progress**: 30% → 100% (WASM compilation)
- **Tempo**: 2-5 secondi su desktop, 5-10 su mobile
- **UI**: Spinner + progress bar + "Inizializzazione..."

### 4. Ready State
- **Trigger**: OpenCV pronto
- **UI**: Calibrazione o Scansione attiva
- **Status bar**: Indicatore verde "OpenCV Pronto"

### 5. Error State
- **Trigger**: Errore di caricamento
- **UI**: Messaggio errore + pulsante "Riprova"
- **Causa comune**: Connessione lenta, file mancanti

## Troubleshooting

### OpenCV non si carica
1. Verifica che i file siano in `public/opencv/`
2. Controlla la console per errori 404
3. Prova a usare una versione minified più piccola
4. Verifica che `lazy: true` sia settato correttamente

### Camera non funziona
1. Verifica i permessi del browser
2. Usa `facingMode: 'environment'` per camera posteriore
3. Su iOS, richiede HTTPS o localhost

### Progress bar stuck
- **0-30%**: Problema di rete/download
- **30-80%**: WASM compilation lenta (normale su mobile)
- **80-100%**: Finalizzazione (dovrebbe essere veloce)

### Performance lenta
1. Riduci `diffThreshold` per meno calcoli
2. Aumenta `changePercentageThreshold` per meno falsi positivi
3. Considera di usare WebGL per processing
4. Su mobile, la prima inizializzazione può richiedere 10+ secondi

### Memory leaks
- Il componente già implementa `mat.delete()` automatico
- Se crasha su iOS, riduci la frequenza di processing
- Aggiungi debounce al frame processing se necessario

## Future Enhancements

1. **ML Detection**: Usare TensorFlow.js per rilevare carte senza calibrazione
2. **Multi-card**: Supporto per scanning di più carte contemporaneamente
3. **Edge Detection**: Implementare Canny edge detection per angoli precisi
4. **OCR**: Integrare Tesseract.js per lettura testo carta
5. **Barcode**: Rilevamento codici a barre/set symbols

## Browser Support

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari iOS**: ✅ Support (richiede HTTPS)
- **Chrome Android**: ✅ Full support

Requisiti:
- WebAssembly support
- getUserMedia API
- Canvas 2D context

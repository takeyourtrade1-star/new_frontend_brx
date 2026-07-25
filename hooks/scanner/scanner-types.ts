// Tipi condivisi del pipeline scanner, estratti da useBrxScanner per evitare
// import circolari tra il hook orchestratore e useScanLoop.

export type ScannerState =
  | 'idle'
  | 'requesting_camera'
  | 'scanning'
  | 'stabilizing'
  | 'processing'
  | 'matched'
  | 'awaiting_removal'
  | 'no_match'
  | 'error';

export interface ScanResult {
  capture_id?: string;
  captured_at_ms?: number;
  card_name: string;
  set_name: string;
  set_code: string;
  image_uri: string | null;
  confidence: number;
  method: string;
  search_url: string;
  search_query: string;
  latency_ms: number;
  scryfall_id?: string;
  blueprint_id?: number;
  collector_number?: string;
  /** Top-K grezzo del riconoscimento: aiuta la review senza altre chiamate al matcher. */
  candidates?: ScanRecognitionCandidate[];
  /** Crop reale della carta, conservato solo in IndexedDB sul dispositivo. */
  capture_blob?: Blob;
}

export interface ScanRecognitionCandidate {
  card_name: string;
  set_name: string;
  set_code: string;
  image_uri: string | null;
  confidence: number;
  scryfall_id?: string;
  blueprint_id?: number;
  collector_number?: string;
}

/** Carta ufficiale del catalogo scelta dal venditore durante la review. */
export interface ScanCatalogCard {
  cardId: string;
  blueprintId: number | null;
  name: string;
  setName: string;
  setCode: string | null;
  collectorNumber: string | null;
  image: string | null;
  availableLanguages: string[];
  marketPrice: number | null;
  foilPrice: number | null;
}

export type ScanPublishStatus = 'draft' | 'publishing' | 'published' | 'failed';

export interface ScanSaleDraft {
  selectedCard: ScanCatalogCard | null;
  language: string;
  condition: string;
  price: string;
  priceTouched: boolean;
  publishStatus: ScanPublishStatus;
  listingId?: string;
  publishError?: string;
}

export interface ScanSessionItem {
  id: string;
  capturedAt: string;
  status: 'recognized' | 'needs_review' | 'confirmed' | 'rejected';
  quantity: number;
  result: ScanResult;
  /** Immagine della carta fisica: mai inviata o pubblicata automaticamente. */
  captureBlob?: Blob;
  sale: ScanSaleDraft;
}

export interface ScanSession {
  version: 2;
  id: string;
  createdAt: string;
  updatedAt: string;
  items: ScanSessionItem[];
}

export interface DebugInfo {
  framesSent: number;
  lastStatus: string | null;
  /** Tempo end-to-end nel browser, dalla cattura al risultato disponibile. */
  lastLatencyMs: number;
  /** Tempo dichiarato dal matcher, esclusi upload e BFF. */
  lastBackendLatencyMs: number;
  /** Tempo totale trascorso nel BFF, letto da Server-Timing. */
  lastBffLatencyMs: number;
  /** Tempo di estrazione/compressione JPEG sul dispositivo. */
  lastEncodeLatencyMs: number;
  lastError: string | null;
  lastOutcome: 'matched' | 'not_matched' | 'pending' | null;
  lastMethod: string | null;
}

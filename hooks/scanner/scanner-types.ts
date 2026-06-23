// Tipi condivisi del pipeline scanner, estratti da useBrxScanner per evitare
// import circolari tra il hook orchestratore e useScanLoop.

export type ScannerState =
  | 'idle'
  | 'requesting_camera'
  | 'scanning'
  | 'processing'
  | 'matched'
  | 'no_match'
  | 'error';

export interface ScanResult {
  card_name: string;
  set_name: string;
  set_code: string;
  image_uri: string | null;
  confidence: number;
  method: string;
  search_url: string;
  search_query: string;
  latency_ms: number;
}

export interface DebugInfo {
  framesSent: number;
  lastStatus: string | null;
  lastLatencyMs: number;
  lastError: string | null;
  lastOutcome: 'matched' | 'not_matched' | 'pending' | null;
  lastMethod: string | null;
}

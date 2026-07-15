export type ScannerBudgetMode = 'edge_primary' | 'server_fallback_limited' | 'edge_only';

const FALLBACK_BRX_MATCH_URL = 'http://15.160.8.178:8005';
export const MAX_EDGE_MODEL_BYTES = 15 * 1024 * 1024;

export function getBrxMatchBaseUrl(): string {
  return (process.env.BRX_MATCH_API_URL || FALLBACK_BRX_MATCH_URL).replace(/\/+$/, '');
}

export function getScannerBudgetMode(): ScannerBudgetMode {
  const value = process.env.SCANNER_BUDGET_MODE;
  if (value === 'edge_primary' || value === 'edge_only') return value;
  return 'server_fallback_limited';
}

export function isScannerEdgeEnabled(): boolean {
  const bytes = getScannerEdgeModelBytes();
  return process.env.SCANNER_EDGE_ENABLED === 'true' && bytes > 0 && bytes <= MAX_EDGE_MODEL_BYTES;
}

export function getScannerEdgeModelBytes(): number {
  const bytes = Number(process.env.SCANNER_EDGE_MODEL_BYTES);
  return Number.isFinite(bytes) && bytes > 0 ? Math.floor(bytes) : 0;
}

export const SCANNER_LIMITS = {
  requestsPerMinute: 45,
  maxVectorBytes: 32 * 1024,
  maxVerifyBytes: 512 * 1024,
  maxScanBytes: 1024 * 1024,
} as const;

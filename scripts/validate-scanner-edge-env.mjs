const enabled = process.env.SCANNER_EDGE_ENABLED === 'true';

if (enabled) {
  const bytes = Number(process.env.SCANNER_EDGE_MODEL_BYTES);
  const sha256 = process.env.SCANNER_EDGE_MODEL_SHA256 || '';
  const maxBytes = 128 * 1024 * 1024;
  if (!Number.isSafeInteger(bytes) || bytes < 100_000 || bytes > maxBytes) {
    throw new Error('SCANNER_EDGE_MODEL_BYTES must pin the exact ONNX artifact size');
  }
  if (!/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error('SCANNER_EDGE_MODEL_SHA256 must be 64 lowercase hex characters');
  }
}

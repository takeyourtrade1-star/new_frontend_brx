import 'server-only';

const MAX_SCREENSHOT_BYTES = 1 * 1024 * 1024;
const MAX_SCREENSHOT_DIMENSION = 8_192;
const MAX_SCREENSHOT_PIXELS = 16_000_000;

export function canonicalEbartexPageUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      host !== 'ebartex.com' &&
      host !== 'www.ebartex.com'
    ) {
      return null;
    }
    return `https://${host}${url.pathname}`;
  } catch {
    return null;
  }
}

/** Screenshots require a real decode/re-encode pipeline before launch. */
export function screenshotUploadsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function jpegDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (
    bytes.length < 16 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    return null;
  }

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  return null;
}

export function isValidScreenshotDataUrl(value: string): boolean {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[1].length % 4 !== 0) return false;
  const bytes = Buffer.from(match[1], 'base64');
  if (
    bytes.length < 16 ||
    bytes.length > MAX_SCREENSHOT_BYTES ||
    bytes.toString('base64') !== match[1]
  ) {
    return false;
  }
  const dimensions = jpegDimensions(bytes);
  return Boolean(
    dimensions &&
      dimensions.width > 0 &&
      dimensions.height > 0 &&
      dimensions.width <= MAX_SCREENSHOT_DIMENSION &&
      dimensions.height <= MAX_SCREENSHOT_DIMENSION &&
      dimensions.width * dimensions.height <= MAX_SCREENSHOT_PIXELS,
  );
}

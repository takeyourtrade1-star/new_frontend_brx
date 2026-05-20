/**
 * Resolve ONNX download URLs in priority order.
 * Never uses public S3 URLs (403 on private bucket).
 */

const ONNX_S3_PUBLIC_BLOCKED =
  'https://ebartex-brx-match-data.s3.eu-south-1.amazonaws.com/dinov2_small.onnx';

export async function resolveOnnxDownloadUrls(apiBaseUrl: string): Promise<string[]> {
  const base = apiBaseUrl.replace(/\/$/, '');
  const urls: string[] = [];

  // S3 presigned first — avoids Amplify proxy timeout on ~25 MB static files.
  try {
    const resp = await fetch(`${base}/model/presigned`, { cache: 'no-store' });
    if (resp.ok) {
      const data = (await resp.json()) as { url?: string };
      if (data.url && data.url.startsWith('https://') && data.url !== ONNX_S3_PUBLIC_BLOCKED) {
        urls.push(data.url);
      }
    }
  } catch {
    // presign optional until backend redeployed
  }

  urls.push(`${base}/static/dinov2_small.onnx`);
  return urls;
}

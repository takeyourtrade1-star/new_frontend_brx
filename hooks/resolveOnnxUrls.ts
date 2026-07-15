export async function resolveOnnxDownloadUrls(apiBaseUrl: string): Promise<string[]> {
  const base = apiBaseUrl.replace(/\/$/, '');
  return [`${base}/static/dinov2_small.onnx`];
}

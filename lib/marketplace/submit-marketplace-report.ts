import type { MarketplaceReportPayload } from '@/lib/marketplace/report-reasons';

export class MarketplaceReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketplaceReportError';
  }
}

export async function submitMarketplaceReport(payload: MarketplaceReportPayload): Promise<void> {
  const res = await fetch('/api/marketplace/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (res.status === 401) {
    throw new MarketplaceReportError('Accedi per inviare una segnalazione.');
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new MarketplaceReportError(data.detail ?? 'Invio segnalazione non riuscito.');
  }
}

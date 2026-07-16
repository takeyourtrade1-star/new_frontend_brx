'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { ScannerCatalogCandidatesResponse } from '@/app/api/search/scanner-candidates/route';
import type { ScanSessionItem } from '@/hooks/scanner/scanner-types';

async function fetchScannerCatalogCandidates(
  items: Array<{
    id: string;
    cardName: string;
    setName: string;
    setCode: string;
    collectorNumber: string;
  }>,
): Promise<ScannerCatalogCandidatesResponse> {
  const response = await fetch('/api/search/scanner-candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = (await response.json().catch(() => ({}))) as
    | ScannerCatalogCandidatesResponse
    | { error?: string };
  if (!response.ok || !('results' in data)) {
    throw new Error('error' in data && data.error ? data.error : `HTTP ${response.status}`);
  }
  return data;
}

export function useScannerCatalogCandidates(items: ScanSessionItem[], enabled = true) {
  const descriptors = useMemo(
    () =>
      items.slice(0, 100).map((item) => ({
        id: item.id,
        cardName: item.result.card_name,
        setName: item.result.set_name,
        setCode: item.result.set_code,
        collectorNumber: item.result.collector_number ?? '',
      })),
    [items],
  );

  return useQuery({
    queryKey: ['scanner', 'catalog-candidates', descriptors],
    queryFn: () => fetchScannerCatalogCandidates(descriptors),
    enabled: enabled && descriptors.length > 0,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';

import { useSetPageCards } from '@/lib/hooks/use-search';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSetPageCards', () => {
  it('propaga gli errori delle pagine successive invece di troncare i risultati', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input), 'http://localhost');
      const page = Number(url.searchParams.get('page'));

      if (page === 1) {
        return Response.json({
          hits: [{ id: 'mtg_1', name: 'Prima carta' }],
          totalPages: 3,
        });
      }

      if (page === 2) {
        return Response.json({ error: 'Search unavailable' }, { status: 503 });
      }

      return Response.json({
        hits: [{ id: 'mtg_3', name: 'Terza carta' }],
        totalPages: 3,
      });
    });

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(
      () => useSetPageCards('mtg', 'Alpha', '', { retry: false }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('page=2'));

    queryClient.clear();
  });
});

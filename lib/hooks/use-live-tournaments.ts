import { useQuery } from '@tanstack/react-query';

export type LiveTournament = {
  id: string;
  format: string;
  mode: string;
  bestOf: string;
  participantsCount: number;
  maxPlayers: number;
  createdAt: string;
};

type LiveTournamentsResponse = { data: { items: LiveTournament[] } };

async function fetchLiveTournaments(): Promise<LiveTournament[]> {
  const response = await fetch('/api/tournaments/live', { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('Impossibile caricare i tornei live') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (body as LiveTournamentsResponse).data?.items ?? [];
}

export function useLiveTournaments() {
  return useQuery({
    queryKey: ['tournaments', 'live'],
    queryFn: fetchLiveTournaments,
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: false,
  });
}

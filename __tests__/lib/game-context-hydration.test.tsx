import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import {
  GameProvider,
  useGame,
  useHydrationSafeGame,
  type GameSlug,
} from '@/lib/contexts/GameContext';

vi.mock('@/lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({ selectedLang: 'it' }),
}));

const renderHistory: Array<GameSlug | null> = [];

function HydrationSafeConsumer() {
  const { selectedGame } = useHydrationSafeGame();
  renderHistory.push(selectedGame);
  return <span data-testid="selected-game">{selectedGame}</span>;
}

function LateMountHarness() {
  const { setSelectedGame } = useGame();
  const [showConsumer, setShowConsumer] = useState(false);

  useEffect(() => {
    setSelectedGame('pokemon');
    setShowConsumer(true);
  }, [setSelectedGame]);

  return showConsumer ? <HydrationSafeConsumer /> : null;
}

describe('useHydrationSafeGame', () => {
  beforeEach(() => {
    renderHistory.length = 0;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('usa MTG al primo render di un consumer tardivo e poi applica la preferenza corrente', async () => {
    render(
      <GameProvider>
        <LateMountHarness />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-game')).toHaveTextContent('pokemon');
    });

    expect(renderHistory[0]).toBe('mtg');
    expect(renderHistory.at(-1)).toBe('pokemon');
  });
});

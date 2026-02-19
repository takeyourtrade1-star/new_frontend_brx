'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type GameSlug = 'mtg' | 'pk' | 'op';

export const GAME_OPTIONS: { value: GameSlug; label: string; color: string }[] = [
  { value: 'mtg', label: 'Magic', color: 'violet' },
  { value: 'pk', label: 'Pokémon', color: 'yellow' },
  { value: 'op', label: 'One Piece', color: 'red' },
];

interface GameContextValue {
  selectedGame: GameSlug | null;
  setSelectedGame: (game: GameSlug | null) => void;
  setGame: (game: GameSlug | null) => void;
  gameDisplayName: (slug: GameSlug | null) => string;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const GAME_STORAGE_KEY = 'ebartex_selected_game';

function getStoredGame(): GameSlug | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(GAME_STORAGE_KEY);
    if (stored && (stored === 'mtg' || stored === 'pk' || stored === 'op')) {
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [selectedGame, setSelectedGameState] = useState<GameSlug | null>(null);

  const setSelectedGame = useCallback((game: GameSlug | null) => {
    setSelectedGameState(game);
    try {
      if (typeof window !== 'undefined') {
        if (game) {
          localStorage.setItem(GAME_STORAGE_KEY, game);
        } else {
          localStorage.removeItem(GAME_STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const gameDisplayName = useCallback((slug: GameSlug | null): string => {
    if (!slug) return '';
    return GAME_OPTIONS.find((o) => o.value === slug)?.label ?? slug.toUpperCase();
  }, []);

  React.useEffect(() => {
    setSelectedGameState(getStoredGame());
  }, []);

  return (
    <GameContext.Provider
      value={{
        selectedGame,
        setSelectedGame,
        setGame: setSelectedGame,
        gameDisplayName,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (ctx === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}

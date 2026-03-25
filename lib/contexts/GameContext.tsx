'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getMessage } from '@/lib/i18n/getMessage';
import type { MessageKey } from '@/lib/i18n/messages/en';

export type GameSlug = 'mtg' | 'pokemon' | 'op';

export const GAME_OPTIONS: { value: GameSlug; label: string; color: string }[] = [
  { value: 'mtg', label: 'Magic', color: 'violet' },
  { value: 'pokemon', label: 'Pokémon', color: 'yellow' },
  { value: 'op', label: 'One Piece', color: 'red' },
];

const GAME_HEADER_KEY: Record<GameSlug, MessageKey> = {
  mtg: 'games.header.mtg',
  pokemon: 'games.header.pokemon',
  op: 'games.header.op',
};

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
    if (stored && (stored === 'mtg' || stored === 'pokemon' || stored === 'op')) {
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
}

const DEFAULT_GAME: GameSlug = 'mtg';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { selectedLang } = useLanguage();
  const [selectedGame, setSelectedGameState] = useState<GameSlug | null>(DEFAULT_GAME);

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

  const gameDisplayName = useCallback(
    (slug: GameSlug | null): string => {
      if (!slug) return '';
      const key = GAME_HEADER_KEY[slug];
      return key ? getMessage(selectedLang, key) : slug.toUpperCase();
    },
    [selectedLang]
  );

  React.useEffect(() => {
    setSelectedGameState(getStoredGame() ?? DEFAULT_GAME);
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

/** Path delle home gioco → slug (allineato a TopBar GAME_HOME_PATH). */
export function gameSlugFromPathname(pathname: string | null): GameSlug | null {
  if (!pathname) return null;
  if (pathname === '/home/magic' || pathname.startsWith('/home/magic/')) return 'mtg';
  if (pathname === '/home/pokemon' || pathname.startsWith('/home/pokemon/')) return 'pokemon';
  if (pathname === '/home/one-piece' || pathname.startsWith('/home/one-piece/')) return 'op';
  /** Hub `/home`: non forza un gioco; resta la selezione corrente (default MTG). */
  if (pathname === '/home') return null;
  return null;
}

/**
 * Mantiene header + barra ricerca allineati alla home gioco corrente (URL).
 * Così un click dalla landing su Magic/Pokémon/One Piece aggiorna subito il contesto.
 */
export function GameFromRouteSync() {
  const pathname = usePathname();
  const { setSelectedGame } = useGame();

  useEffect(() => {
    const slug = gameSlugFromPathname(pathname);
    if (slug !== null) {
      setSelectedGame(slug);
    }
  }, [pathname, setSelectedGame]);

  return null;
}

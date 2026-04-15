'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useP2PRoom, GameState } from '@/hooks/useP2PRoom';

type GamePhase = 'lobby' | 'betting' | 'reveal' | 'resolution' | 'finished';
type PlayerNumber = 1 | 2;

interface Card {
  id: string;
  value: number;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  name: string;
}

interface PlayerState {
  score: number;
  hand: Card[];
  selectedCard: Card | null;
  bet: number;
  coins: number;
}

interface P2PGameContextType {
  // Connection
  isConnected: boolean;
  isHost: boolean;
  latency: number;
  
  // Game state
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  
  // Players
  player1: PlayerState;
  player2: PlayerState;
  localPlayer: PlayerNumber;
  remotePlayer: PlayerNumber;
  
  // Actions
  selectCard: (cardId: string) => void;
  placeBet: (amount: number) => void;
  confirmBet: () => void;
  revealCards: () => void;
  nextRound: () => void;
  resetGame: () => void;
  
  // Lobby
  startLobby: () => void;
  disconnect: () => void;
}

const P2PGameContext = createContext<P2PGameContextType | null>(null);

export function useP2PGame() {
  const context = useContext(P2PGameContext);
  if (!context) {
    throw new Error('useP2PGame must be used within P2PGameProvider');
  }
  return context;
}

interface P2PGameProviderProps {
  children: ReactNode;
}

export function P2PGameProvider({ children }: P2PGameProviderProps) {
  // Game state
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [currentRound, setCurrentRound] = useState(1);
  const maxRounds = 5;
  
  const [player1, setPlayer1] = useState<PlayerState>({
    score: 0,
    hand: [],
    selectedCard: null,
    bet: 0,
    coins: 1000,
  });
  
  const [player2, setPlayer2] = useState<PlayerState>({
    score: 0,
    hand: [],
    selectedCard: null,
    bet: 0,
    coins: 1000,
  });

  // Handle incoming game state from remote
  const handleGameState = useCallback((state: GameState) => {
    setCurrentRound(state.currentRound);
    
    setPlayer1(prev => ({
      ...prev,
      score: state.player1Score,
      selectedCard: state.player1Card ? JSON.parse(state.player1Card) : null,
    }));
    
    setPlayer2(prev => ({
      ...prev,
      score: state.player2Score,
      selectedCard: state.player2Card ? JSON.parse(state.player2Card) : null,
    }));

    // Sync phase
    setPhase(state.phase as GamePhase);
  }, []);

  // P2P Hook
  const [room, actions] = useP2PRoom(handleGameState);
  
  const isConnected = room.state === 'connected';
  const isHost = room.isHost;
  const localPlayer: PlayerNumber = isHost ? 1 : 2;
  const remotePlayer: PlayerNumber = isHost ? 2 : 1;

  // Send game state to remote
  const syncGameState = useCallback(() => {
    if (!isConnected) return;
    
    actions.sendGameState({
      player1Score: player1.score,
      player2Score: player2.score,
      currentRound,
      player1Card: player1.selectedCard ? JSON.stringify(player1.selectedCard) : undefined,
      player2Card: player2.selectedCard ? JSON.stringify(player2.selectedCard) : undefined,
      phase: phase as 'betting' | 'reveal' | 'resolution',
    });
  }, [isConnected, actions, player1, player2, currentRound, phase]);

  // Local actions
  const selectCard = useCallback((cardId: string) => {
    const player = localPlayer === 1 ? player1 : player2;
    const setPlayer = localPlayer === 1 ? setPlayer1 : setPlayer2;
    
    const card = player.hand.find(c => c.id === cardId);
    if (!card || phase !== 'betting') return;

    setPlayer(prev => ({ ...prev, selectedCard: card }));
  }, [localPlayer, player1, player2, phase]);

  const placeBet = useCallback((amount: number) => {
    const player = localPlayer === 1 ? player1 : player2;
    const setPlayer = localPlayer === 1 ? setPlayer1 : setPlayer2;
    
    if (amount > player.coins || phase !== 'betting') return;

    setPlayer(prev => ({ ...prev, bet: amount }));
  }, [localPlayer, player1, phase]);

  const confirmBet = useCallback(() => {
    const player = localPlayer === 1 ? player1 : player2;
    if (!player.selectedCard || player.bet <= 0 || phase !== 'betting') return;

    // Sync and move to reveal if both players ready
    syncGameState();
    
    // Check if both players have bet (simplified - in real impl, track remote state)
    setPhase('reveal');
  }, [localPlayer, player1, player2, phase, syncGameState]);

  const revealCards = useCallback(() => {
    if (phase !== 'reveal') return;
    
    // Determine winner
    const p1Card = player1.selectedCard;
    const p2Card = player2.selectedCard;
    
    if (p1Card && p2Card) {
      const p1Wins = p1Card.value > p2Card.value;
      
      setPlayer1(prev => ({
        ...prev,
        score: p1Wins ? prev.score + 1 : prev.score,
        coins: p1Wins ? prev.coins + player2.bet : prev.coins - prev.bet,
      }));
      
      setPlayer2(prev => ({
        ...prev,
        score: !p1Wins ? prev.score + 1 : prev.score,
        coins: !p1Wins ? prev.coins + player1.bet : prev.coins - prev.bet,
      }));
    }

    setPhase('resolution');
    syncGameState();
  }, [phase, player1, player2, syncGameState]);

  const nextRound = useCallback(() => {
    if (currentRound >= maxRounds) {
      setPhase('finished');
      return;
    }

    setCurrentRound(prev => prev + 1);
    setPhase('betting');
    
    // Reset round state
    setPlayer1(prev => ({
      ...prev,
      selectedCard: null,
      bet: 0,
    }));
    setPlayer2(prev => ({
      ...prev,
      selectedCard: null,
      bet: 0,
    }));
    
    syncGameState();
  }, [currentRound, syncGameState]);

  const resetGame = useCallback(() => {
    setPhase('lobby');
    setCurrentRound(1);
    setPlayer1({
      score: 0,
      hand: [],
      selectedCard: null,
      bet: 0,
      coins: 1000,
    });
    setPlayer2({
      score: 0,
      hand: [],
      selectedCard: null,
      bet: 0,
      coins: 1000,
    });
    actions.disconnect();
  }, [actions]);

  const startLobby = useCallback(() => {
    setPhase('lobby');
  }, []);

  const value: P2PGameContextType = {
    isConnected,
    isHost,
    latency: room.latency,
    phase,
    currentRound,
    maxRounds,
    player1,
    player2,
    localPlayer,
    remotePlayer,
    selectCard,
    placeBet,
    confirmBet,
    revealCards,
    nextRound,
    resetGame,
    startLobby,
    disconnect: actions.disconnect,
  };

  return (
    <P2PGameContext.Provider value={value}>
      {children}
    </P2PGameContext.Provider>
  );
}

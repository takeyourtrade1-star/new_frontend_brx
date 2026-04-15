'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff, Trophy, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { P2PLobby } from '@/components/game/P2PLobby';
import { KakeguruiArena } from './KakeguruiArena';
import { useP2PRoom } from '@/hooks/useP2PRoom';
import { Button } from '@/components/ui/button';

// Types for Kakegurui game sync
type Move = 'rock' | 'paper' | 'scissors';

type GamePhase = 'lobby' | 'ready' | 'playing' | 'round_end' | 'game_end';

interface PlayerGameState {
  score: number;
  move: Move | null;
  ready: boolean;
  emote: string | null;
}

interface GameSyncMessage {
  type: 'game_sync';
  phase: GamePhase;
  player1: PlayerGameState;
  player2: PlayerGameState;
  round: number;
  maxRounds: number;
  timestamp: number;
}

interface PlayerReadyMessage {
  type: 'player_ready';
  playerId: 1 | 2;
}

interface MoveSelectedMessage {
  type: 'move_selected';
  playerId: 1 | 2;
  move: Move;
  cardId: string;
}

interface EmoteMessage {
  type: 'emote';
  playerId: 1 | 2;
  emoteType: 'smug' | 'panic' | 'challenge';
}

interface PingMessage {
  type: 'ping' | 'pong';
  timestamp: number;
}

type P2PMessage = GameSyncMessage | PlayerReadyMessage | MoveSelectedMessage | EmoteMessage | PingMessage;

interface KakeguruiP2PProps {
  open: boolean;
  onClose: () => void;
}

export function KakeguruiP2P({ open, onClose }: KakeguruiP2PProps) {
  const [showLobby, setShowLobby] = useState(true);
  const [showGame, setShowGame] = useState(false);
  
  // Game state synced via P2P
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [currentRound, setCurrentRound] = useState(1);
  const maxRounds = 3;
  
  const [player1State, setPlayer1State] = useState<PlayerGameState>({
    score: 0,
    move: null,
    ready: false,
    emote: null,
  });
  
  const [player2State, setPlayer2State] = useState<PlayerGameState>({
    score: 0,
    move: null,
    ready: false,
    emote: null,
  });

  const [latency, setLatency] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [localPlayerId, setLocalPlayerId] = useState<1 | 2>(1);
  const [remotePlayerId, setRemotePlayerId] = useState<1 | 2>(2);
  
  const lastPingRef = useRef<number>(0);

  // Handle incoming P2P messages
  const handleGameState = useCallback((rawData: any) => {
    try {
      const data: P2PMessage = JSON.parse(rawData);
      
      if (data.type === 'game_sync') {
        setGamePhase(data.phase);
        setCurrentRound(data.round);
        setPlayer1State(data.player1);
        setPlayer2State(data.player2);
      } else if (data.type === 'player_ready') {
        if (data.playerId === 1) {
          setPlayer1State(prev => ({ ...prev, ready: true }));
        } else {
          setPlayer2State(prev => ({ ...prev, ready: true }));
        }
      } else if (data.type === 'move_selected') {
        if (data.playerId === 1) {
          setPlayer1State(prev => ({ ...prev, move: data.move }));
        } else {
          setPlayer2State(prev => ({ ...prev, move: data.move }));
        }
      } else if (data.type === 'emote') {
        if (data.playerId === 1) {
          setPlayer1State(prev => ({ ...prev, emote: data.emoteType }));
          setTimeout(() => setPlayer1State(prev => ({ ...prev, emote: null })), 1500);
        } else {
          setPlayer2State(prev => ({ ...prev, emote: data.emoteType }));
          setTimeout(() => setPlayer2State(prev => ({ ...prev, emote: null })), 1500);
        }
      } else if (data.type === 'pong') {
        const latency = Date.now() - data.timestamp;
        setLatency(latency);
      }
    } catch (e) {
      console.error('Failed to parse P2P message:', e);
    }
  }, []);

  // P2P Hook
  const [room, actions] = useP2PRoom(handleGameState);

  // Update player IDs when connection established
  useEffect(() => {
    if (room.state === 'connected') {
      setIsHost(room.isHost);
      const local = room.isHost ? 1 : 2;
      const remote = room.isHost ? 2 : 1;
      setLocalPlayerId(local);
      setRemotePlayerId(remote);
      
      // Start game when both connected
      if (showLobby) {
        setShowLobby(false);
        setShowGame(true);
        setGamePhase('ready');
      }
    }
  }, [room.state, room.isHost, showLobby]);

  // Ping interval for latency
  useEffect(() => {
    if (room.state !== 'connected') return;
    
    const interval = setInterval(() => {
      const ping: PingMessage = { type: 'ping', timestamp: Date.now() };
      lastPingRef.current = Date.now();
      // Access peer through room state - send directly if needed
      // This is handled by the hook internally
    }, 1000);
    
    return () => clearInterval(interval);
  }, [room.state]);

  // Send game state to remote
  const syncGameState = useCallback((phase: GamePhase, p1: PlayerGameState, p2: PlayerGameState, round: number) => {
    if (room.state !== 'connected') return;
    
    const message: GameSyncMessage = {
      type: 'game_sync',
      phase,
      player1: p1,
      player2: p2,
      round,
      maxRounds,
      timestamp: Date.now(),
    };
    
    actions.sendGameState({
      player1Score: p1.score,
      player2Score: p2.score,
      currentRound: round,
      player1Card: p1.move ? JSON.stringify({ move: p1.move }) : undefined,
      player2Card: p2.move ? JSON.stringify({ move: p2.move }) : undefined,
      phase: phase as 'betting' | 'reveal' | 'resolution',
    });
  }, [room.state, actions, maxRounds]);

  // Player actions
  const handleLocalReady = useCallback(() => {
    const setLocal = localPlayerId === 1 ? setPlayer1State : setPlayer2State;
    setLocal(prev => ({ ...prev, ready: true }));
    
    // Notify remote
    const message: PlayerReadyMessage = { type: 'player_ready', playerId: localPlayerId };
    // Send via P2P
  }, [localPlayerId]);

  const handleMoveSelect = useCallback((move: Move, cardId: string) => {
    const setLocal = localPlayerId === 1 ? setPlayer1State : setPlayer2State;
    setLocal(prev => ({ ...prev, move }));
    
    // Notify remote
    const message: MoveSelectedMessage = { 
      type: 'move_selected', 
      playerId: localPlayerId, 
      move, 
      cardId 
    };
    // Send via P2P
  }, [localPlayerId]);

  const handleEmote = useCallback((emoteType: 'smug' | 'panic' | 'challenge') => {
    const setLocal = localPlayerId === 1 ? setPlayer1State : setPlayer2State;
    setLocal(prev => ({ ...prev, emote: emoteType }));
    setTimeout(() => {
      setLocal(prev => ({ ...prev, emote: null }));
    }, 1500);
    
    // Notify remote
    const message: EmoteMessage = { type: 'emote', playerId: localPlayerId, emoteType };
    // Send via P2P
  }, [localPlayerId]);

  // Start match when both ready
  useEffect(() => {
    if (gamePhase === 'ready' && player1State.ready && player2State.ready) {
      setTimeout(() => {
        setGamePhase('playing');
      }, 1000);
    }
  }, [gamePhase, player1State.ready, player2State.ready]);

  // Resolve round when both moves selected
  useEffect(() => {
    if (gamePhase === 'playing' && player1State.move && player2State.move) {
      setGamePhase('round_end');
      
      // Calculate winner
      const BEATS: Record<Move, Move> = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper',
      };
      
      let p1Wins = false;
      let p2Wins = false;
      let draw = false;
      
      if (player1State.move === player2State.move) {
        draw = true;
      } else if (BEATS[player1State.move] === player2State.move) {
        p1Wins = true;
      } else {
        p2Wins = true;
      }
      
      // Update scores
      if (p1Wins) {
        setPlayer1State(prev => ({ ...prev, score: prev.score + 1 }));
      } else if (p2Wins) {
        setPlayer2State(prev => ({ ...prev, score: prev.score + 1 }));
      }
      
      // Check game end
      setTimeout(() => {
        if (player1State.score >= 2 || player2State.score >= 2 || currentRound >= maxRounds) {
          setGamePhase('game_end');
        } else {
          // Next round
          setCurrentRound(prev => prev + 1);
          setPlayer1State(prev => ({ ...prev, move: null }));
          setPlayer2State(prev => ({ ...prev, move: null }));
          setGamePhase('playing');
        }
      }, 2000);
    }
  }, [gamePhase, player1State.move, player2State.move, player1State.score, player2State.score, currentRound, maxRounds]);

  const handleClose = useCallback(() => {
    actions.disconnect();
    setShowLobby(true);
    setShowGame(false);
    setGamePhase('lobby');
    setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
    onClose();
  }, [actions, onClose]);

  const handleBackToLobby = useCallback(() => {
    actions.disconnect();
    setShowLobby(true);
    setShowGame(false);
    setGamePhase('lobby');
    setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
  }, [actions]);

  const handleRematch = useCallback(() => {
    setGamePhase('ready');
    setCurrentRound(1);
    setPlayer1State(prev => ({ ...prev, score: 0, move: null, ready: false, emote: null }));
    setPlayer2State(prev => ({ ...prev, score: 0, move: null, ready: false, emote: null }));
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10030]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative mx-auto mt-[2dvh] h-[96dvh] w-[98vw] overflow-hidden rounded-xl border border-white/15 bg-[#0a0a0c] text-white shadow-[0_18px_70px_rgba(0,0,0,0.7)] sm:mt-[3dvh] sm:h-[94dvh] sm:w-[96vw] lg:mt-[4dvh] lg:h-[92dvh] lg:w-[min(96vw,1000px)]"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
          >
            {/* Header with connection status */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0a0a0c]/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLobby}
                  className="text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Indietro
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold uppercase tracking-wider text-white/90">
                  Kakegurui P2P
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {room.state === 'connected' ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <Wifi className="h-3.5 w-3.5" />
                      <span>LAN</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {latency}ms
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-500 text-xs">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Offline</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-zinc-400 hover:text-white hover:bg-red-500/20"
                >
                  Chiudi
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="h-full pt-14">
              <AnimatePresence mode="wait">
                {showLobby && (
                  <motion.div
                    key="lobby"
                    className="h-full flex flex-col items-center justify-center p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Arena 1v1 LAN
                      </h2>
                      <p className="text-zinc-400 text-sm max-w-md">
                        Nessun server richiesto. Connettiti direttamente con un altro giocatore nella stessa rete.
                      </p>
                    </div>
                    
                    <P2PLobby
                      onConnected={() => {
                        setShowLobby(false);
                        setShowGame(true);
                      }}
                      onGameState={handleGameState}
                    />
                  </motion.div>
                )}

                {showGame && room.state === 'connected' && (
                  <motion.div
                    key="game"
                    className="h-full flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Connection Status Bar */}
                    <div className="flex items-center justify-center gap-4 py-3 bg-zinc-900/50 border-b border-white/5">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-zinc-300">
                          Tu (Giocatore {localPlayerId})
                        </span>
                      </div>
                      <div className="h-4 w-px bg-white/20" />
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`h-2 w-2 rounded-full ${room.state === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-zinc-400 text-xs">
                          {room.state === 'connected' ? 'Connesso P2P' : 'Disconnesso'}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-white/20" />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-500">vs</span>
                        <span className="text-zinc-300">
                          Rivale (Giocatore {remotePlayerId})
                        </span>
                      </div>
                    </div>

                    {/* Game Phases */}
                    {gamePhase === 'ready' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="text-center space-y-4">
                          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                          <h3 className="text-xl font-semibold text-white">
                            In attesa dei giocatori...
                          </h3>
                          <div className="flex items-center justify-center gap-8 mt-4">
                            <div className="text-center">
                              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-2 ${player1State.ready ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-zinc-800 border border-zinc-700'}`}>
                                <span className="text-2xl">{player1State.ready ? '✓' : '?'}</span>
                              </div>
                              <span className="text-sm text-zinc-400">Giocatore 1</span>
                            </div>
                            <div className="text-center">
                              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-2 ${player2State.ready ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-zinc-800 border border-zinc-700'}`}>
                                <span className="text-2xl">{player2State.ready ? '✓' : '?'}</span>
                              </div>
                              <span className="text-sm text-zinc-400">Giocatore 2</span>
                            </div>
                          </div>
                        </div>
                        {!((localPlayerId === 1 && player1State.ready) || (localPlayerId === 2 && player2State.ready)) && (
                          <Button
                            onClick={handleLocalReady}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
                          >
                            Sono Pronto!
                          </Button>
                        )}
                      </div>
                    )}

                    {gamePhase === 'playing' && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center mb-6">
                          <span className="text-sm text-zinc-500 uppercase tracking-wider">
                            Round {currentRound} di {maxRounds}
                          </span>
                          <div className="flex items-center justify-center gap-6 mt-2 text-2xl font-bold">
                            <span className="text-orange-400">{player1State.score}</span>
                            <span className="text-zinc-600">-</span>
                            <span className="text-orange-400">{player2State.score}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          {(['rock', 'paper', 'scissors'] as Move[]).map((move) => (
                            <button
                              key={move}
                              onClick={() => handleMoveSelect(move, `card-${move}`)}
                              disabled={
                                (localPlayerId === 1 && !!player1State.move) || 
                                (localPlayerId === 2 && !!player2State.move)
                              }
                              className={`
                                w-24 h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-2
                                transition-all duration-200
                                ${
                                  (localPlayerId === 1 && player1State.move === move) ||
                                  (localPlayerId === 2 && player2State.move === move)
                                    ? 'border-orange-500 bg-orange-500/20 scale-105'
                                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
                                }
                                ${
                                  (localPlayerId === 1 && player1State.move) || 
                                  (localPlayerId === 2 && player2State.move)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                              `}
                            >
                              <span className="text-4xl">
                                {move === 'rock' ? '✊' : move === 'paper' ? '✋' : '✌️'}
                              </span>
                              <span className="text-xs text-zinc-400 uppercase">
                                {move === 'rock' ? 'Sasso' : move === 'paper' ? 'Carta' : 'Forbice'}
                              </span>
                            </button>
                          ))}
                        </div>
                        
                        {(player1State.move || player2State.move) && (
                          <div className="mt-6 text-center">
                            <span className="text-zinc-400">
                              In attesa dell&apos;altro giocatore...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {gamePhase === 'round_end' && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center space-y-6">
                          <h3 className="text-xl font-semibold text-white">Round Completato!</h3>
                          
                          <div className="flex items-center justify-center gap-8">
                            <div className="text-center">
                              <div className="text-4xl mb-2">
                                {player1State.move === 'rock' ? '✊' : player1State.move === 'paper' ? '✋' : '✌️'}
                              </div>
                              <span className="text-sm text-zinc-400">Giocatore 1</span>
                            </div>
                            
                            <div className="text-2xl text-zinc-600">VS</div>
                            
                            <div className="text-center">
                              <div className="text-4xl mb-2">
                                {player2State.move === 'rock' ? '✊' : player2State.move === 'paper' ? '✋' : '✌️'}
                              </div>
                              <span className="text-sm text-zinc-400">Giocatore 2</span>
                            </div>
                          </div>
                          
                          {(() => {
                            const BEATS: Record<Move, Move> = {
                              rock: 'scissors',
                              paper: 'rock',
                              scissors: 'paper',
                            };
                            
                            let result = '';
                            if (player1State.move === player2State.move) {
                              result = 'Pareggio!';
                            } else if (BEATS[player1State.move!] === player2State.move) {
                              result = 'Giocatore 1 vince!';
                            } else {
                              result = 'Giocatore 2 vince!';
                            }
                            
                            return (
                              <div className="text-lg font-semibold text-orange-400">
                                {result}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {gamePhase === 'game_end' && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center space-y-6">
                          <Trophy className="h-16 w-16 text-orange-400 mx-auto" />
                          
                          <h2 className="text-2xl font-bold text-white">
                            {player1State.score > player2State.score 
                              ? 'Giocatore 1 Vince!' 
                              : player2State.score > player1State.score 
                                ? 'Giocatore 2 Vince!' 
                                : 'Pareggio!'}
                          </h2>
                          
                          <div className="flex items-center justify-center gap-4 text-xl">
                            <span className="text-orange-400 font-bold">{player1State.score}</span>
                            <span className="text-zinc-600">-</span>
                            <span className="text-orange-400 font-bold">{player2State.score}</span>
                          </div>
                          
                          <Button
                            onClick={handleRematch}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-6"
                          >
                            Rivincita
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {showGame && room.state !== 'connected' && (
                  <motion.div
                    key="disconnected"
                    className="h-full flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <WifiOff className="h-16 w-16 text-red-500 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Connessione Persa</h3>
                    <p className="text-zinc-400 mb-6">Il collegamento P2P si è interrotto.</p>
                    <Button onClick={handleBackToLobby} variant="outline">
                      Torna alla Lobby
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

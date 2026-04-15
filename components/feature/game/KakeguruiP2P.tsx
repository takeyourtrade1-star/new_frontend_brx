'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff, Trophy, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { P2PLobby } from '@/components/game/P2PLobby';
import { useP2PRoom, GameState } from '@/hooks/useP2PRoom';
import { Button } from '@/components/ui/button';
import { HandMoveCard, DuelCard, ArenaCardBack, type HandCard, type Move } from './KakeguruiArena';

// Types for Kakegurui game sync
type GamePhase = 'lobby' | 'dealing' | 'ready' | 'playing' | 'round_end' | 'game_end';
type EmoteType = 'smug' | 'panic' | 'challenge';

const DEALING_MS = 1500;

const P2P_HAND_CARDS: HandCard[] = [
  { id: 'card-rock', move: 'rock' },
  { id: 'card-paper', move: 'paper' },
  { id: 'card-scissors', move: 'scissors' },
];

function getRoundOutcome(playerMove: Move | null, opponentMove: Move | null): 'player' | 'opponent' | 'draw' | null {
  if (!playerMove || !opponentMove) return null;
  if (playerMove === opponentMove) return 'draw';

  if (
    (playerMove === 'rock' && opponentMove === 'scissors') ||
    (playerMove === 'paper' && opponentMove === 'rock') ||
    (playerMove === 'scissors' && opponentMove === 'paper')
  ) {
    return 'player';
  }

  return 'opponent';
}

interface PlayerGameState {
  score: number;
  move: Move | null;
  ready: boolean;
  emote: EmoteType | null;
}

interface PingMessage {
  type: 'ping' | 'pong';
  timestamp: number;
}

interface EncodedPlayerState {
  move?: Move | null;
  ready?: boolean;
  emote?: EmoteType | null;
}

const EMOTE_UI: Record<EmoteType, { label: string; toneClass: string }> = {
  smug: {
    label: 'SMUG',
    toneClass: 'from-fuchsia-500/30 to-pink-500/15 border-fuchsia-400/55',
  },
  panic: {
    label: 'PANIC',
    toneClass: 'from-cyan-500/30 to-blue-500/15 border-cyan-400/55',
  },
  challenge: {
    label: 'CHALLENGE',
    toneClass: 'from-orange-500/30 to-rose-500/15 border-orange-400/55',
  },
};

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
  const [duelReveal, setDuelReveal] = useState(false);
  const [impactFlash, setImpactFlash] = useState(false);
  const [shatterPulse, setShatterPulse] = useState(0);

  const localMove = localPlayerId === 1 ? player1State.move : player2State.move;
  const remoteMove = localPlayerId === 1 ? player2State.move : player1State.move;
  const localEmote = localPlayerId === 1 ? player1State.emote : player2State.emote;
  const remoteEmote = localPlayerId === 1 ? player2State.emote : player1State.emote;

  const lastPingRef = useRef<number>(0);
  const dealingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundAnimTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);

  const clearDealingTimer = useCallback(() => {
    if (dealingTimerRef.current) {
      clearTimeout(dealingTimerRef.current);
      dealingTimerRef.current = null;
    }
  }, []);

  const clearRoundAnimTimers = useCallback(() => {
    roundAnimTimersRef.current.forEach(timer => clearTimeout(timer));
    roundAnimTimersRef.current = [];
  }, []);

  const startDealingSequence = useCallback((nextPhase: 'ready' | 'playing', resetReadiness: boolean) => {
    clearDealingTimer();

    setGamePhase('dealing');
    setPlayer1State(prev => ({
      ...prev,
      move: null,
      ready: resetReadiness ? false : prev.ready,
    }));
    setPlayer2State(prev => ({
      ...prev,
      move: null,
      ready: resetReadiness ? false : prev.ready,
    }));

    dealingTimerRef.current = setTimeout(() => {
      setGamePhase(nextPhase);
      dealingTimerRef.current = null;
    }, DEALING_MS);
  }, [clearDealingTimer]);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        audioUnlockedRef.current = true;
      }).catch(() => undefined);
      return;
    }
    audioUnlockedRef.current = true;
  }, [getAudioContext]);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType, gain = 0.11, delay = 0) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const trigger = () => {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.02, duration * 0.3));
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(amp);
      amp.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    };

    if (ctx.state === 'suspended') {
      void ctx.resume().then(trigger).catch(() => undefined);
      return;
    }

    trigger();
  }, [getAudioContext]);

  const playImpactSnap = useCallback(() => {
    playTone(170, 0.16, 'square', 0.16);
    playTone(88, 0.23, 'triangle', 0.13, 0.02);
  }, [playTone]);

  const playCardPickTick = useCallback((move: Move) => {
    if (move === 'rock') {
      playTone(210, 0.08, 'square', 0.11);
      return;
    }
    if (move === 'paper') {
      playTone(420, 0.08, 'triangle', 0.1);
      return;
    }
    playTone(560, 0.07, 'sine', 0.1);
  }, [playTone]);

  const playShuffleRiff = useCallback(() => {
    playTone(290, 0.08, 'triangle', 0.09);
    playTone(360, 0.08, 'triangle', 0.09, 0.075);
    playTone(440, 0.09, 'sine', 0.1, 0.15);
  }, [playTone]);

  const playRevealChord = useCallback(() => {
    playTone(520, 0.12, 'triangle', 0.1);
    playTone(650, 0.12, 'sine', 0.09, 0.03);
    playTone(780, 0.12, 'sine', 0.08, 0.06);
  }, [playTone]);

  const playCardDestroyCrash = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    master.connect(ctx.destination);

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(170, now);
    thud.frequency.exponentialRampToValueAtTime(58, now + 0.2);
    thudGain.gain.setValueAtTime(0.0001, now);
    thudGain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    thud.connect(thudGain);
    thudGain.connect(master);
    thud.start(now);
    thud.stop(now + 0.28);

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(900, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.1, now + 0.018);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now + 0.015);
    noise.stop(now + 0.23);
  }, [getAudioContext]);

  const playRevealSpark = useCallback(() => {
    playTone(520, 0.08, 'triangle', 0.03);
    playTone(790, 0.11, 'sine', 0.028, 0.035);
  }, [playTone]);

  const playEmotePing = useCallback((emote: EmoteType) => {
    if (emote === 'smug') {
      playTone(510, 0.09, 'triangle', 0.03);
      playTone(700, 0.08, 'sine', 0.026, 0.05);
      return;
    }
    if (emote === 'panic') {
      playTone(340, 0.09, 'square', 0.03);
      playTone(290, 0.08, 'triangle', 0.028, 0.05);
      return;
    }
    playTone(260, 0.08, 'square', 0.032);
    playTone(390, 0.09, 'triangle', 0.028, 0.045);
  }, [playTone]);

  // Handle incoming game state synced through the P2P hook.
  const handleGameState = useCallback((state: GameState) => {
    const parsePlayerState = (raw?: string): EncodedPlayerState => {
      if (!raw) {
        return {};
      }

      try {
        const parsed = JSON.parse(raw) as Partial<EncodedPlayerState>;
        const next: EncodedPlayerState = {};

        if (parsed.move === null || parsed.move === 'rock' || parsed.move === 'paper' || parsed.move === 'scissors') {
          next.move = parsed.move;
        }

        if (typeof parsed.ready === 'boolean') {
          next.ready = parsed.ready;
        }

        if (parsed.emote === null || parsed.emote === 'smug' || parsed.emote === 'panic' || parsed.emote === 'challenge') {
          next.emote = parsed.emote;
        }

        return next;
      } catch {
        return {};
      }
    };

    const remoteP1 = parsePlayerState(state.player1Card);
    const remoteP2 = parsePlayerState(state.player2Card);

    setCurrentRound(state.currentRound);
    setPlayer1State(prev => ({
      ...prev,
      score: state.player1Score,
      move: remoteP1.move === undefined ? prev.move : remoteP1.move,
      // Ready should be monotonic within a round: avoid stale false overrides.
      ready: remoteP1.ready === undefined ? prev.ready : prev.ready || remoteP1.ready,
      emote: remoteP1.emote === undefined ? prev.emote : remoteP1.emote,
    }));
    setPlayer2State(prev => ({
      ...prev,
      score: state.player2Score,
      move: remoteP2.move === undefined ? prev.move : remoteP2.move,
      // Ready should be monotonic within a round: avoid stale false overrides.
      ready: remoteP2.ready === undefined ? prev.ready : prev.ready || remoteP2.ready,
      emote: remoteP2.emote === undefined ? prev.emote : remoteP2.emote,
    }));

    setGamePhase(state.phase as GamePhase);
  }, []);

  // P2P Hook (single shared instance for lobby and game)
  const [room, actions] = useP2PRoom(handleGameState);

  // Send game state to remote
  const syncGameState = useCallback((phase: GamePhase, p1: PlayerGameState, p2: PlayerGameState, round: number) => {
    if (room.state !== 'connected') return;

    actions.sendGameState({
      player1Score: p1.score,
      player2Score: p2.score,
      currentRound: round,
      player1Card: JSON.stringify({ move: p1.move, ready: p1.ready, emote: p1.emote }),
      player2Card: JSON.stringify({ move: p2.move, ready: p2.ready, emote: p2.emote }),
      phase: phase as 'betting' | 'reveal' | 'resolution',
    });
  }, [room.state, actions]);

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
        startDealingSequence('ready', true);
      }
    }
  }, [room.state, room.isHost, showLobby, startDealingSequence]);

  useEffect(() => {
    return () => {
      clearDealingTimer();
      clearRoundAnimTimers();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [clearDealingTimer, clearRoundAnimTimers]);

  // Ping interval for latency
  useEffect(() => {
    if (room.state !== 'connected') return;

    const interval = setInterval(() => {
      const ping: PingMessage = { type: 'ping', timestamp: Date.now() };
      lastPingRef.current = Date.now();
      // This ping is handled by useP2PRoom internally.
      void ping;
    }, 1000);

    return () => clearInterval(interval);
  }, [room.state]);

  useEffect(() => {
    if (room.latency > 0) {
      setLatency(room.latency);
    }
  }, [room.latency]);

  useEffect(() => {
    if (room.state !== 'connected') return;
    unlockAudio();
  }, [room.state, unlockAudio]);

  useEffect(() => {
    if (gamePhase !== 'dealing') return;
    playShuffleRiff();
  }, [gamePhase, playShuffleRiff]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = () => {
      if (!audioUnlockedRef.current) {
        unlockAudio();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open, unlockAudio]);

  useEffect(() => {
    if (!remoteEmote) return;

    playEmotePing(remoteEmote);
    const timer = setTimeout(() => {
      if (localPlayerId === 1) {
        setPlayer2State(prev => (prev.emote === remoteEmote ? { ...prev, emote: null } : prev));
      } else {
        setPlayer1State(prev => (prev.emote === remoteEmote ? { ...prev, emote: null } : prev));
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [remoteEmote, localPlayerId, playEmotePing]);

  // Player actions
  const handleLocalReady = useCallback(() => {
    unlockAudio();

    const nextPlayer1 = localPlayerId === 1 ? { ...player1State, ready: true } : player1State;
    const nextPlayer2 = localPlayerId === 2 ? { ...player2State, ready: true } : player2State;

    if (localPlayerId === 1) {
      setPlayer1State(nextPlayer1);
    } else {
      setPlayer2State(nextPlayer2);
    }

    syncGameState('ready', nextPlayer1, nextPlayer2, currentRound);
  }, [localPlayerId, player1State, player2State, currentRound, syncGameState, unlockAudio]);

  const handleMoveSelect = useCallback((move: Move, cardId: string) => {
    unlockAudio();
    playCardPickTick(move);

    const nextPlayer1 = localPlayerId === 1 ? { ...player1State, move } : player1State;
    const nextPlayer2 = localPlayerId === 2 ? { ...player2State, move } : player2State;

    if (localPlayerId === 1) {
      setPlayer1State(nextPlayer1);
    } else {
      setPlayer2State(nextPlayer2);
    }

    syncGameState('playing', nextPlayer1, nextPlayer2, currentRound);
    void cardId;
  }, [localPlayerId, player1State, player2State, currentRound, syncGameState, playCardPickTick, unlockAudio]);

  const handleEmote = useCallback((emoteType: EmoteType) => {
    unlockAudio();

    const nextPlayer1 = localPlayerId === 1 ? { ...player1State, emote: emoteType } : player1State;
    const nextPlayer2 = localPlayerId === 2 ? { ...player2State, emote: emoteType } : player2State;

    if (localPlayerId === 1) {
      setPlayer1State(nextPlayer1);
    } else {
      setPlayer2State(nextPlayer2);
    }

    playEmotePing(emoteType);
    syncGameState(gamePhase, nextPlayer1, nextPlayer2, currentRound);

    setTimeout(() => {
      const clearedPlayer1 = localPlayerId === 1 ? { ...nextPlayer1, emote: null } : nextPlayer1;
      const clearedPlayer2 = localPlayerId === 2 ? { ...nextPlayer2, emote: null } : nextPlayer2;

      if (localPlayerId === 1) {
        setPlayer1State(clearedPlayer1);
      } else {
        setPlayer2State(clearedPlayer2);
      }

      syncGameState(gamePhase, clearedPlayer1, clearedPlayer2, currentRound);
    }, 1500);
  }, [localPlayerId, player1State, player2State, currentRound, gamePhase, syncGameState, playEmotePing, unlockAudio]);

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

      if (player1State.move === player2State.move) {
        // Draw
      } else if (BEATS[player1State.move] === player2State.move) {
        p1Wins = true;
      } else {
        p2Wins = true;
      }

      if (p1Wins) {
        setPlayer1State(prev => ({ ...prev, score: prev.score + 1 }));
      } else if (p2Wins) {
        setPlayer2State(prev => ({ ...prev, score: prev.score + 1 }));
      }

      setTimeout(() => {
        if (player1State.score >= 2 || player2State.score >= 2 || currentRound >= maxRounds) {
          setGamePhase('game_end');
        } else {
          setCurrentRound(prev => prev + 1);
          startDealingSequence('playing', false);
        }
      }, 2000);
    }
  }, [gamePhase, player1State.move, player2State.move, player1State.score, player2State.score, currentRound, maxRounds, startDealingSequence]);

  useEffect(() => {
    if (gamePhase !== 'round_end') {
      setDuelReveal(false);
      setImpactFlash(false);
      clearRoundAnimTimers();
      return;
    }

    setDuelReveal(false);
    setImpactFlash(false);
    clearRoundAnimTimers();

    const impactStart = setTimeout(() => setImpactFlash(true), 260);
    const revealStart = setTimeout(() => setDuelReveal(true), 520);
    const impactEnd = setTimeout(() => setImpactFlash(false), 980);

    roundAnimTimersRef.current.push(impactStart, revealStart, impactEnd);

    return () => {
      clearRoundAnimTimers();
    };
  }, [gamePhase, clearRoundAnimTimers]);

  useEffect(() => {
    if (impactFlash) {
      playImpactSnap();
      playCardDestroyCrash();
      setShatterPulse(prev => prev + 1);
    }
  }, [impactFlash, playCardDestroyCrash, playImpactSnap]);

  useEffect(() => {
    if (duelReveal) {
      playRevealSpark();
      playRevealChord();
    }
  }, [duelReveal, playRevealSpark, playRevealChord]);

  const handleClose = useCallback(() => {
    clearDealingTimer();
    clearRoundAnimTimers();
    actions.disconnect();
    setShowLobby(true);
    setShowGame(false);
    setGamePhase('lobby');
    setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
    onClose();
  }, [actions, onClose, clearDealingTimer, clearRoundAnimTimers]);

  const handleBackToLobby = useCallback(() => {
    clearDealingTimer();
    clearRoundAnimTimers();
    actions.disconnect();
    setShowLobby(true);
    setShowGame(false);
    setGamePhase('lobby');
    setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
  }, [actions, clearDealingTimer, clearRoundAnimTimers]);

  const handleRematch = useCallback(() => {
    clearDealingTimer();
    clearRoundAnimTimers();
    setCurrentRound(1);
    setPlayer1State(prev => ({ ...prev, score: 0, move: null, ready: false, emote: null }));
    setPlayer2State(prev => ({ ...prev, score: 0, move: null, ready: false, emote: null }));
    startDealingSequence('ready', true);
  }, [startDealingSequence, clearDealingTimer, clearRoundAnimTimers]);

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
                    <div className="text-xs text-zinc-500">{latency}ms</div>
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
                      <h2 className="text-2xl font-bold text-white mb-2">Arena 1v1 LAN</h2>
                      <p className="text-zinc-400 text-sm max-w-md">
                        Nessun server richiesto. Connettiti direttamente con un altro giocatore nella stessa rete.
                      </p>
                    </div>

                    <P2PLobby
                      onConnected={() => {
                        setShowLobby(false);
                        setShowGame(true);
                      }}
                      room={room}
                      actions={actions}
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
                        <span className="text-zinc-300">Tu (Giocatore {localPlayerId})</span>
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
                        <span className="text-zinc-300">Rivale (Giocatore {remotePlayerId})</span>
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                      <motion.div
                        className="pointer-events-none absolute -left-28 top-12 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl"
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.12, 1] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="pointer-events-none absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"
                        animate={{ opacity: [0.4, 0.75, 0.4], scale: [1.02, 0.92, 1.02] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 py-8">
                        {/* Game Phases */}
                        {gamePhase === 'dealing' && (
                          <motion.div
                            className="w-full max-w-4xl"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="text-center mb-6">
                              <span className="text-sm text-zinc-400 uppercase tracking-[0.2em]">Round {currentRound} di {maxRounds}</span>
                              <h3 className="mt-2 text-2xl font-semibold text-white">Mischio il deck e distribuisco le carte...</h3>
                            </div>

                            <div className="relative mx-auto h-80 max-w-4xl overflow-hidden rounded-[42px] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,115,0,0.2),transparent_58%),radial-gradient(circle_at_50%_85%,rgba(56,189,248,0.15),transparent_62%),linear-gradient(180deg,rgba(14,14,18,0.96),rgba(10,10,13,0.96))]">
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_46%,transparent_100%)]" />
                              <motion.div
                                className="pointer-events-none absolute inset-0"
                                animate={{ opacity: [0.2, 0.55, 0.2] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                <div className="absolute left-[46%] top-[34%] h-24 w-24 rounded-full bg-orange-400/20 blur-2xl" />
                                <div className="absolute left-[52%] top-[47%] h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl" />
                              </motion.div>

                              {[0, 1, 2, 3, 4].map((idx) => {
                                const radius = 36 + idx * 5;
                                return (
                                  <motion.div
                                    key={`shuffle-${idx}`}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                    animate={{
                                      x: [0, radius, 0, -radius, 0],
                                      y: [-radius * 0.25, 0, radius * 0.25, 0, -radius * 0.25],
                                      rotate: [idx * 14, idx * 14 + 70, idx * 14 + 160, idx * 14 + 250, idx * 14 + 340],
                                      opacity: [0.25, 0.85, 0.75, 0.85, 0.25],
                                    }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: idx * 0.07 }}
                                  >
                                    <div className="h-20 w-16">
                                      <ArenaCardBack />
                                    </div>
                                  </motion.div>
                                );
                              })}

                              <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                animate={{ rotate: [0, -7, 7, -5, 5, 0], scale: [1, 1.07, 1] }}
                                transition={{ duration: 0.88, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                <div className="h-28 w-20">
                                  <ArenaCardBack />
                                </div>
                              </motion.div>

                              <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                animate={{ rotate: [0, 9, -9, 6, -6, 0], scale: [1, 1.04, 1] }}
                                transition={{ duration: 0.96, repeat: Infinity, ease: 'easeInOut', delay: 0.07 }}
                              >
                                <div className="h-28 w-20 opacity-85">
                                  <ArenaCardBack />
                                </div>
                              </motion.div>

                              <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 rounded-full border border-orange-300/30 bg-orange-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-orange-200/90">
                                Shuffle Sequence
                              </div>

                              {/* Cards dealt to player 1 (left) */}
                              {P2P_HAND_CARDS.map((card, idx) => (
                                <motion.div
                                  key={`deal-left-${card.id}`}
                                  className="absolute left-1/2 top-1/2"
                                  initial={{ x: -8, y: -8, rotate: 0, opacity: 0 }}
                                  animate={{
                                    x: -260 + idx * 58,
                                    y: -80 + idx * 12,
                                    rotate: -18 + idx * 9,
                                    opacity: [0, 1, 1],
                                  }}
                                  transition={{ duration: 0.58, delay: idx * 0.14, ease: 'easeOut' }}
                                >
                                  <HandMoveCard card={card} hidden={true} />
                                </motion.div>
                              ))}

                              {/* Cards dealt to player 2 (right) */}
                              {P2P_HAND_CARDS.map((card, idx) => (
                                <motion.div
                                  key={`deal-right-${card.id}`}
                                  className="absolute left-1/2 top-1/2"
                                  initial={{ x: 8, y: -8, rotate: 0, opacity: 0 }}
                                  animate={{
                                    x: 130 + idx * 58,
                                    y: -80 + idx * 12,
                                    rotate: 8 + idx * 9,
                                    opacity: [0, 1, 1],
                                  }}
                                  transition={{ duration: 0.58, delay: 0.05 + idx * 0.14, ease: 'easeOut' }}
                                >
                                  <HandMoveCard card={card} hidden={true} />
                                </motion.div>
                              ))}

                              <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-zinc-900/70 px-3 py-1 text-xs uppercase tracking-[0.16em] text-zinc-300">
                                Giocatore 1
                              </div>
                              <div className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-zinc-900/70 px-3 py-1 text-xs uppercase tracking-[0.16em] text-zinc-300">
                                Giocatore 2
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {gamePhase === 'ready' && (
                          <motion.div
                            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/70 to-zinc-950/70 p-8 shadow-[0_25px_90px_rgba(0,0,0,0.45)]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="text-center space-y-6">
                              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                              <h3 className="text-2xl font-semibold text-white">In attesa dei giocatori...</h3>
                              <div className="mx-auto h-px w-40 bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />

                              <div className="flex items-center justify-center gap-8 mt-2">
                                <motion.div
                                  className="text-center"
                                  animate={player1State.ready ? { scale: [1, 1.06, 1] } : { opacity: [0.8, 1, 0.8] }}
                                  transition={{ duration: 1.8, repeat: Infinity }}
                                >
                                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 ${player1State.ready ? 'bg-emerald-500/20 border border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.35)]' : 'bg-zinc-800/80 border border-zinc-700'}`}>
                                    <span className="text-xl font-black tracking-wider">{player1State.ready ? 'READY' : '...'}</span>
                                  </div>
                                  <span className="text-sm text-zinc-300">Giocatore 1</span>
                                </motion.div>

                                <motion.div
                                  className="text-center"
                                  animate={player2State.ready ? { scale: [1, 1.06, 1] } : { opacity: [0.8, 1, 0.8] }}
                                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }}
                                >
                                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 ${player2State.ready ? 'bg-emerald-500/20 border border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.35)]' : 'bg-zinc-800/80 border border-zinc-700'}`}>
                                    <span className="text-xl font-black tracking-wider">{player2State.ready ? 'READY' : '...'}</span>
                                  </div>
                                  <span className="text-sm text-zinc-300">Giocatore 2</span>
                                </motion.div>
                              </div>
                            </div>

                            {!((localPlayerId === 1 && player1State.ready) || (localPlayerId === 2 && player2State.ready)) && (
                              <div className="mt-8 flex justify-center">
                                <Button
                                  onClick={handleLocalReady}
                                  className="bg-primary hover:bg-primary/90 text-white px-9 py-6 text-lg shadow-[0_12px_36px_rgba(255,115,0,0.35)]"
                                >
                                  Sono Pronto!
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {gamePhase === 'playing' && (
                          <motion.div
                            className="w-full max-w-4xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="text-center mb-6">
                              <span className="text-sm text-zinc-400 uppercase tracking-[0.2em]">Round {currentRound} di {maxRounds}</span>
                              <div className="flex items-center justify-center gap-6 mt-2 text-3xl font-black">
                                <span className="text-orange-400">{player1State.score}</span>
                                <span className="text-zinc-600">-</span>
                                <span className="text-orange-400">{player2State.score}</span>
                              </div>
                            </div>

                            <div className="relative mx-auto max-w-4xl rounded-[48px] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,115,0,0.3),transparent_58%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.2),transparent_58%),linear-gradient(180deg,rgba(10,10,14,0.97),rgba(6,6,10,0.97))] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_30px_95px_rgba(0,0,0,0.62)]">
                              <div className="space-y-7">
                                <div className="text-center">
                                  <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-400">Mano avversario</p>
                                  <div className="flex items-center justify-center gap-4">
                                    {P2P_HAND_CARDS.map((card, idx) => (
                                      <motion.div
                                        key={`remote-${card.id}`}
                                        initial={{ opacity: 0, y: -10, rotate: -6 + idx * 3 }}
                                        animate={{ opacity: 1, y: 0, rotate: -8 + idx * 8, scale: 1.15 }}
                                        transition={{ duration: 0.35, delay: idx * 0.08 }}
                                      >
                                        <HandMoveCard card={card} hidden={true} />
                                      </motion.div>
                                    ))}
                                  </div>
                                  {remoteMove && (
                                    <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-emerald-300">
                                      Avversario pronto al lancio
                                    </div>
                                  )}

                                  <AnimatePresence>
                                    {remoteEmote && (
                                      <motion.div
                                        className={`mx-auto mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-white bg-gradient-to-r ${EMOTE_UI[remoteEmote].toneClass}`}
                                        initial={{ opacity: 0, y: -6, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.94 }}
                                      >
                                        {EMOTE_UI[remoteEmote].label}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                <motion.div
                                  className="relative mx-auto h-32 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/45"
                                  animate={localMove && remoteMove ? { x: [0, -4, 4, -3, 3, 0], y: [0, 1, -1, 1, -1, 0] } : { x: 0, y: 0 }}
                                  transition={{ duration: 0.38, ease: 'easeOut' }}
                                >
                                  <motion.div
                                    className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/25 blur-2xl"
                                    animate={localMove || remoteMove ? { scale: [0.85, 1.35, 0.95], opacity: [0.36, 0.76, 0.4] } : { scale: [0.8, 1, 0.8], opacity: [0.15, 0.3, 0.15] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                                  />

                                  {(localMove || remoteMove) && Array.from({ length: 7 }).map((_, idx) => (
                                    <motion.div
                                      key={`streak-${idx}`}
                                      className="pointer-events-none absolute h-[2px] w-16 rounded-full bg-gradient-to-r from-transparent via-orange-300/70 to-transparent"
                                      style={{ top: `${20 + idx * 9}%`, left: `${8 + idx * 11}%`, transform: `rotate(${-18 + idx * 6}deg)` }}
                                      animate={{ x: [-12, 14, -6, 0], opacity: [0, 0.7, 0.18, 0] }}
                                      transition={{ duration: 0.62, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.06 }}
                                    />
                                  ))}

                                  {remoteMove && (
                                    <motion.div
                                      className="absolute left-1/2 top-1/2"
                                      initial={{ x: -180, y: -80, rotate: -18, opacity: 0.2 }}
                                      animate={{ x: -52, y: -16, rotate: -8, opacity: 1 }}
                                      transition={{ duration: 0.35, ease: 'easeOut' }}
                                    >
                                      <HandMoveCard card={{ id: 'remote-preview', move: remoteMove }} hidden={true} />
                                    </motion.div>
                                  )}

                                  {localMove && (
                                    <motion.div
                                      className="absolute left-1/2 top-1/2"
                                      initial={{ x: 180, y: 80, rotate: 18, opacity: 0.2 }}
                                      animate={{ x: 52, y: -4, rotate: 8, opacity: 1 }}
                                      transition={{ duration: 0.35, ease: 'easeOut' }}
                                    >
                                      <HandMoveCard card={{ id: 'local-preview', move: localMove }} hidden={true} />
                                    </motion.div>
                                  )}
                                </motion.div>

                                <div className="text-center">
                                  <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-400">La tua mano</p>
                                  <div className="mx-auto mb-3 inline-flex items-center rounded-full border border-orange-300/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-200/90">
                                    BRX Neon Deck
                                  </div>
                                  <div className="relative mx-auto max-w-xl rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_36px_rgba(0,0,0,0.42)]">
                                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_10%,rgba(255,115,0,0.16),transparent_46%),radial-gradient(circle_at_80%_85%,rgba(56,189,248,0.14),transparent_44%)]" />
                                    <div className="relative flex items-center justify-center gap-5">
                                    {P2P_HAND_CARDS.map((card) => {
                                      const selected = localMove === card.move;
                                      const disabled = !!localMove;

                                      return (
                                        <motion.div
                                          key={card.id}
                                          animate={selected ? { scale: 1.24, y: -8 } : { scale: 1.16, y: 0 }}
                                          transition={{ duration: 0.2, ease: 'easeOut' }}
                                        >
                                          <HandMoveCard
                                            card={card}
                                            hidden={false}
                                            disabled={disabled}
                                            selected={selected}
                                            onPick={() => handleMoveSelect(card.move, card.id)}
                                          />
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                  </div>

                                  <AnimatePresence>
                                    {localEmote && (
                                      <motion.div
                                        className={`mx-auto mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-white bg-gradient-to-r ${EMOTE_UI[localEmote].toneClass}`}
                                        initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.94 }}
                                      >
                                        {EMOTE_UI[localEmote].label}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                    {(['smug', 'panic', 'challenge'] as EmoteType[]).map((emote) => {
                                      const active = localEmote === emote;
                                      return (
                                        <Button
                                          key={emote}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEmote(emote)}
                                          className={`border-white/20 bg-zinc-900/55 text-zinc-200 hover:bg-zinc-800/70 ${active ? 'border-orange-300/70 text-orange-200 shadow-[0_0_18px_rgba(251,146,60,0.32)]' : ''}`}
                                        >
                                          {EMOTE_UI[emote].label}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {(localMove || remoteMove) && (
                                <div className="mt-6 text-center text-zinc-300/90 uppercase tracking-[0.16em] text-xs">
                                  Carte in traiettoria verso il centro...
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {gamePhase === 'round_end' && (
                          <motion.div
                            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/75 to-zinc-950/75 p-8"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="text-center space-y-7">
                              <h3 className="text-2xl font-semibold text-white">Round Completato</h3>

                              <div className="relative flex items-center justify-center gap-8 min-h-[280px]">
                                <motion.div
                                  className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/25 blur-2xl"
                                  animate={impactFlash ? { scale: [0.4, 1.35], opacity: [0.8, 0] } : { scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.45, ease: 'easeOut' }}
                                />
                                <motion.div
                                  className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/35"
                                  animate={impactFlash ? { scale: [0.6, 1.15], opacity: [0.8, 0] } : { scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.55, ease: 'easeOut' }}
                                />

                                <AnimatePresence mode="wait">
                                  {impactFlash && (
                                    <motion.div
                                      key={`shatter-${shatterPulse}`}
                                      className="pointer-events-none absolute inset-0"
                                      initial={{ opacity: 1 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                    >
                                      {Array.from({ length: 14 }).map((_, idx) => {
                                        const angle = (idx / 14) * Math.PI * 2;
                                        const distance = 66 + (idx % 4) * 14;
                                        const targetX = Math.cos(angle) * distance;
                                        const targetY = Math.sin(angle) * distance;
                                        return (
                                          <motion.div
                                            key={`fragment-${idx}`}
                                            className="absolute left-1/2 top-1/2 h-2.5 w-6 rounded-[4px] border border-orange-100/70 bg-gradient-to-r from-orange-200/80 to-cyan-200/70"
                                            initial={{ x: 0, y: 0, rotate: 0, opacity: 0.95, scale: 1 }}
                                            animate={{
                                              x: targetX,
                                              y: targetY,
                                              rotate: idx % 2 === 0 ? 140 : -140,
                                              opacity: 0,
                                              scale: 0.28,
                                            }}
                                            transition={{ duration: 0.42, ease: 'easeOut', delay: idx * 0.014 }}
                                          />
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {(() => {
                                  const outcome = getRoundOutcome(player1State.move, player2State.move);
                                  const localOutcome =
                                    outcome === 'draw'
                                      ? 'draw'
                                      : localPlayerId === 1
                                        ? outcome
                                        : outcome === 'player'
                                          ? 'opponent'
                                          : 'player';

                                  const localState = localOutcome === 'player' ? 'winner' : localOutcome === 'opponent' ? 'loser' : 'draw';
                                  const remoteState = localOutcome === 'opponent' ? 'winner' : localOutcome === 'player' ? 'loser' : 'draw';

                                  const localCardMove = localMove ?? 'rock';
                                  const remoteCardMove = remoteMove ?? 'rock';

                                  return (
                                    <>
                                      <motion.div
                                        initial={{ x: -170, y: 190, rotate: 20, scale: 0.86, opacity: 0 }}
                                        animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                                      >
                                        <DuelCard
                                          move={localCardMove}
                                          reveal={duelReveal}
                                          state={localState}
                                          title="Tu"
                                        />
                                      </motion.div>

                                      <span className="text-zinc-500 text-2xl font-black">VS</span>

                                      <motion.div
                                        initial={{ x: 170, y: -190, rotate: -20, scale: 0.86, opacity: 0 }}
                                        animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                                      >
                                        <DuelCard
                                          move={remoteCardMove}
                                          reveal={duelReveal}
                                          state={remoteState}
                                          title="Rivale"
                                        />
                                      </motion.div>
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="text-lg font-semibold text-orange-300">
                                {(() => {
                                  const outcome = getRoundOutcome(player1State.move, player2State.move);
                                  const localOutcome =
                                    outcome === 'draw'
                                      ? 'draw'
                                      : localPlayerId === 1
                                        ? outcome
                                        : outcome === 'player'
                                          ? 'opponent'
                                          : 'player';

                                  if (localOutcome === 'draw') return 'Pareggio!';
                                  if (localOutcome === 'player') return 'Hai vinto il round!';
                                  if (localOutcome === 'opponent') return 'Round al rivale';
                                  return 'Round in corso';
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {gamePhase === 'game_end' && (
                          <motion.div
                            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/75 to-zinc-950/75 p-8 text-center"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <motion.div
                              animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
                              transition={{ duration: 2.4, repeat: Infinity }}
                            >
                              <Trophy className="h-16 w-16 text-orange-400 mx-auto" />
                            </motion.div>

                            <h2 className="mt-4 text-3xl font-bold text-white">
                              {player1State.score > player2State.score
                                ? 'Giocatore 1 Vince!'
                                : player2State.score > player1State.score
                                  ? 'Giocatore 2 Vince!'
                                  : 'Pareggio!'}
                            </h2>

                            <div className="mt-4 flex items-center justify-center gap-4 text-2xl font-black">
                              <span className="text-orange-400">{player1State.score}</span>
                              <span className="text-zinc-600">-</span>
                              <span className="text-orange-400">{player2State.score}</span>
                            </div>

                            <Button
                              onClick={handleRematch}
                              className="mt-6 bg-primary hover:bg-primary/90 text-white px-10 py-6 text-lg"
                            >
                              Rivincita
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
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
                    <p className="text-zinc-400 mb-6">Il collegamento P2P si e interrotto.</p>
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

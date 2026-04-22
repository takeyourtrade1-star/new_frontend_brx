'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff, Trophy, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { P2PLobby } from '@/components/game/P2PLobby';
import { useP2PRoom, GameState } from '@/hooks/useP2PRoom';
import { Button } from '@/components/ui/button';
import { HandMoveCard, DuelCard, ArenaCardBack, type HandCard, type Move } from './KakeguruiArena';

type GamePhase = 'lobby' | 'dealing' | 'ready' | 'playing' | 'round_end' | 'game_end';
type EmoteType = 'smug' | 'panic' | 'challenge' | 'taunt';

const DEALING_MS = 2200;
const MAX_ROUNDS = 3;

/* ── Random hand generation (Kakegurui-style) ───────────────────────── */
function generateRandomHand(): HandCard[] {
  const moves: Move[] = ['rock', 'paper', 'scissors'];
  return Array.from({ length: 3 }, (_, i) => ({
    id: `p2p-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    move: moves[Math.floor(Math.random() * moves.length)],
  }));
}

function getRoundOutcome(playerMove: Move | null, opponentMove: Move | null): 'player' | 'opponent' | 'draw' | null {
  if (!playerMove || !opponentMove) return null;
  if (playerMove === opponentMove) return 'draw';
  if (
    (playerMove === 'rock' && opponentMove === 'scissors') ||
    (playerMove === 'paper' && opponentMove === 'rock') ||
    (playerMove === 'scissors' && opponentMove === 'paper')
  ) return 'player';
  return 'opponent';
}

interface PlayerGameState {
  score: number;
  move: Move | null;
  ready: boolean;
  emote: EmoteType | null;
}

interface EncodedPlayerState {
  move?: Move | null;
  ready?: boolean;
  emote?: EmoteType | null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Emote Sticker SVG Faces
   ═══════════════════════════════════════════════════════════════════════ */
const EMOTE_CFG: Record<EmoteType, {
  label: string;
  tone: string;
  glow: string;
  border: string;
}> = {
  smug: { label: 'Ghigno', tone: 'from-fuchsia-500/30 to-purple-600/20', glow: 'rgba(217,70,239,0.35)', border: 'border-fuchsia-400/50' },
  panic: { label: 'Panico', tone: 'from-cyan-400/30 to-blue-500/20', glow: 'rgba(34,211,238,0.35)', border: 'border-cyan-400/50' },
  challenge: { label: 'Sfida', tone: 'from-orange-500/30 to-red-500/20', glow: 'rgba(249,115,22,0.35)', border: 'border-orange-400/50' },
  taunt: { label: 'Derisione', tone: 'from-lime-400/30 to-emerald-500/20', glow: 'rgba(132,204,22,0.35)', border: 'border-lime-400/50' },
};

function StickerFace({ emote, size = 56 }: { emote: EmoteType; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" fill="rgba(14,14,20,0.95)" stroke="rgba(255,255,255,0.18)" strokeWidth="2.2" />
      <circle cx="50" cy="50" r="40" fill="rgba(8,8,14,0.92)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />

      {emote === 'smug' && (
        <>
          {/* Raised eyebrow */}
          <path d="M 25 32 Q 34 26 44 32" stroke="rgba(248,250,252,0.85)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Normal brow */}
          <path d="M 56 34 L 76 33" stroke="rgba(248,250,252,0.7)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Narrowed eyes */}
          <ellipse cx="35" cy="40" rx="10" ry="7" fill="none" stroke="rgba(248,250,252,0.88)" strokeWidth="2.5" />
          <ellipse cx="65" cy="40" rx="10" ry="7" fill="none" stroke="rgba(248,250,252,0.88)" strokeWidth="2.5" />
          {/* Side-glancing pupils */}
          <circle cx="32" cy="40" r="4" fill="rgba(240,244,248,0.95)" />
          <circle cx="62" cy="40" r="4" fill="rgba(240,244,248,0.95)" />
          <circle cx="30.5" cy="39" r="1.4" fill="rgba(10,10,18,0.95)" />
          <circle cx="60.5" cy="39" r="1.4" fill="rgba(10,10,18,0.95)" />
          {/* Smirk */}
          <path d="M 36 64 Q 52 74 68 61" stroke="rgba(248,250,252,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <ellipse cx="25" cy="52" rx="5" ry="3" fill="rgba(232,121,249,0.22)" />
        </>
      )}

      {emote === 'panic' && (
        <>
          {/* Raised brows */}
          <path d="M 22 28 L 44 33" stroke="rgba(248,250,252,0.8)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 56 33 L 78 28" stroke="rgba(248,250,252,0.8)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Wide eyes */}
          <circle cx="35" cy="41" r="12" fill="none" stroke="rgba(248,250,252,0.9)" strokeWidth="2.6" />
          <circle cx="65" cy="41" r="12" fill="none" stroke="rgba(248,250,252,0.9)" strokeWidth="2.6" />
          {/* Tiny pupils (scared) */}
          <circle cx="35" cy="43" r="3" fill="rgba(240,244,248,0.96)" />
          <circle cx="65" cy="43" r="3" fill="rgba(240,244,248,0.96)" />
          <circle cx="34" cy="42" r="1.2" fill="rgba(10,10,18,0.95)" />
          <circle cx="64" cy="42" r="1.2" fill="rgba(10,10,18,0.95)" />
          {/* O mouth */}
          <ellipse cx="50" cy="67" rx="7" ry="9" fill="rgba(248,250,252,0.12)" stroke="rgba(248,250,252,0.88)" strokeWidth="2.5" />
          {/* Sweat drops */}
          <path d="M 80 33 Q 82 38 80 42" stroke="rgba(56,189,248,0.6)" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="83" cy="40" r="1.5" fill="rgba(56,189,248,0.45)" />
        </>
      )}

      {emote === 'challenge' && (
        <>
          {/* V-brows (determined) */}
          <path d="M 22 36 L 44 30" stroke="rgba(248,250,252,0.88)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 56 30 L 78 36" stroke="rgba(248,250,252,0.88)" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Focused eyes */}
          <circle cx="35" cy="41" r="10" fill="none" stroke="rgba(248,250,252,0.88)" strokeWidth="2.6" />
          <circle cx="65" cy="41" r="10" fill="none" stroke="rgba(248,250,252,0.88)" strokeWidth="2.6" />
          <circle cx="36" cy="41" r="5" fill="rgba(240,244,248,0.96)" />
          <circle cx="66" cy="41" r="5" fill="rgba(240,244,248,0.96)" />
          <circle cx="35" cy="40" r="1.8" fill="rgba(10,10,18,0.95)" />
          <circle cx="65" cy="40" r="1.8" fill="rgba(10,10,18,0.95)" />
          {/* Determined mouth */}
          <path d="M 36 66 Q 50 60 64 66" stroke="rgba(248,250,252,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Fire accents */}
          <path d="M 18 24 Q 22 18 20 12" stroke="rgba(249,115,22,0.55)" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M 80 24 Q 78 18 82 12" stroke="rgba(249,115,22,0.55)" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      )}

      {emote === 'taunt' && (
        <>
          {/* Squeezed laughing eyes */}
          <path d="M 23 39 Q 35 30 45 39" stroke="rgba(248,250,252,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M 55 39 Q 65 30 77 39" stroke="rgba(248,250,252,0.88)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Laugh lines under eyes */}
          <path d="M 25 43 Q 34 46 43 43" stroke="rgba(248,250,252,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M 57 43 Q 66 46 75 43" stroke="rgba(248,250,252,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Tears of laughter */}
          <path d="M 20 41 Q 17 48 19 53" stroke="rgba(56,189,248,0.55)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 80 41 Q 83 48 81 53" stroke="rgba(56,189,248,0.55)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Wide open laughing mouth with teeth */}
          <path d="M 30 62 Q 36 56 50 55 Q 64 56 70 62 Q 64 74 50 76 Q 36 74 30 62 Z" fill="rgba(248,250,252,0.12)" stroke="rgba(248,250,252,0.85)" strokeWidth="2.2" />
          {/* Teeth line */}
          <path d="M 34 62 L 66 62" stroke="rgba(248,250,252,0.6)" strokeWidth="1.5" />
          {/* Tongue */}
          <ellipse cx="50" cy="70" rx="8" ry="5" fill="rgba(255,107,138,0.7)" stroke="rgba(255,107,138,0.3)" strokeWidth="1" />
          {/* Pointing hand gesture */}
          <path d="M 82 58 L 88 54 L 92 56" stroke="rgba(248,250,252,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="92" cy="54" r="1.5" fill="rgba(248,250,252,0.4)" />
        </>
      )}
    </svg>
  );
}

/* ── Confetti burst ─────────────────────────────────────────────────── */
function ConfettiBurst({ active }: { active: boolean }) {
  const particles = useMemo(() => {
    if (!active) return [];
    const colors = ['#FF7300', '#818CF8', '#34D399', '#F43F5E', '#FBBF24', '#A78BFA', '#22D3EE'];
    return Array.from({ length: 50 }, (_, idx) => ({
      id: idx,
      color: colors[idx % colors.length],
      left: 8 + Math.random() * 84,
      delay: Math.random() * 0.8,
      dur: 2 + Math.random() * 1.5,
      size: 4 + Math.random() * 7,
      aspect: Math.random() > 0.5 ? 2.5 : 1,
      round: Math.random() > 0.5,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 100,
    }));
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={`confetti-${p.id}`}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: '-5%',
            width: p.size,
            height: p.size * p.aspect,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
          }}
          initial={{ y: 0, opacity: 1, rotate: p.rotation }}
          animate={{
            y: ['0vh', '115vh'],
            opacity: [1, 1, 0.5],
            rotate: [p.rotation, p.rotation + (p.id % 2 === 0 ? 420 : -420)],
            x: [0, p.drift],
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

interface KakeguruiP2PProps {
  open: boolean;
  onClose: () => void;
}

export function KakeguruiP2P({ open, onClose }: KakeguruiP2PProps) {
  const [showLobby, setShowLobby] = useState(true);
  const [showGame, setShowGame] = useState(false);

  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [currentRound, setCurrentRound] = useState(1);

  const [player1State, setPlayer1State] = useState<PlayerGameState>({ score: 0, move: null, ready: false, emote: null });
  const [player2State, setPlayer2State] = useState<PlayerGameState>({ score: 0, move: null, ready: false, emote: null });

  /* ── Random hand state (Kakegurui-style) ──────────────────────────── */
  const [localHand, setLocalHand] = useState<HandCard[]>([]);
  const [opponentCardCount, setOpponentCardCount] = useState(3);
  const selectedCardIdRef = useRef<string | null>(null);
  const roundResolvingRef = useRef(false);

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

  const dealingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundAnimTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);

  const clearDealingTimer = useCallback(() => {
    if (dealingTimerRef.current) { clearTimeout(dealingTimerRef.current); dealingTimerRef.current = null; }
  }, []);

  const clearRoundAnimTimers = useCallback(() => {
    roundAnimTimersRef.current.forEach(t => clearTimeout(t));
    roundAnimTimersRef.current = [];
  }, []);

  /* ─── Audio ───────────────────────────────────────────────────────── */
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') { void ctx.resume().then(() => { audioUnlockedRef.current = true; }).catch(() => undefined); return; }
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
      osc.connect(amp); amp.connect(ctx.destination);
      osc.start(now); osc.stop(now + duration + 0.02);
    };
    if (ctx.state === 'suspended') { void ctx.resume().then(trigger).catch(() => undefined); return; }
    trigger();
  }, [getAudioContext]);

  const playImpactSnap = useCallback(() => { playTone(170, 0.16, 'square', 0.14); playTone(88, 0.23, 'triangle', 0.12, 0.02); }, [playTone]);
  const playCardPickTick = useCallback((move: Move) => {
    const f = move === 'rock' ? 210 : move === 'paper' ? 420 : 560;
    playTone(f, 0.08, move === 'rock' ? 'square' : 'triangle', 0.1);
    playTone(f + 100, 0.06, 'sine', 0.06, 0.04);
  }, [playTone]);
  const playShuffleRiff = useCallback(() => {
    [290, 360, 440, 520, 600].forEach((f, i) => playTone(f, 0.08, i < 3 ? 'triangle' : 'sine', 0.08 - i * 0.005, i * 0.075));
  }, [playTone]);
  const playRevealChord = useCallback(() => {
    [520, 650, 780, 1040].forEach((f, i) => playTone(f, 0.15 - i * 0.01, i % 2 === 0 ? 'triangle' : 'sine', 0.09 - i * 0.01, i * 0.03));
  }, [playTone]);
  const playCardDealWhip = useCallback((idx: number) => {
    playTone(380 + idx * 80, 0.06, 'sawtooth', 0.06);
    playTone(520 + idx * 60, 0.04, 'sine', 0.04, 0.03);
  }, [playTone]);

  const playCrash = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const m = ctx.createGain(); m.gain.setValueAtTime(0.0001, now); m.gain.exponentialRampToValueAtTime(0.12, now + 0.02); m.gain.exponentialRampToValueAtTime(0.0001, now + 0.38); m.connect(ctx.destination);
    const t = ctx.createOscillator(); const tg = ctx.createGain(); t.type = 'triangle'; t.frequency.setValueAtTime(160, now); t.frequency.exponentialRampToValueAtTime(55, now + 0.2); tg.gain.setValueAtTime(0.0001, now); tg.gain.exponentialRampToValueAtTime(0.11, now + 0.01); tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.22); t.connect(tg); tg.connect(m); t.start(now); t.stop(now + 0.26);
    const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate); const ch = nb.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const ns = ctx.createBufferSource(); ns.buffer = nb; const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.setValueAtTime(900, now); const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, now); ng.gain.exponentialRampToValueAtTime(0.09, now + 0.015); ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.18); ns.connect(hf); hf.connect(ng); ng.connect(m); ns.start(now + 0.012); ns.stop(now + 0.2);
  }, [getAudioContext]);

  const playEmotePing = useCallback((e: EmoteType) => {
    const freqs: Record<EmoteType, number[]> = { smug: [510, 700, 880], panic: [340, 290, 400], challenge: [260, 390, 520], taunt: [440, 560, 700] };
    freqs[e].forEach((f, i) => playTone(f, 0.08, i === 0 ? 'triangle' : 'sine', 0.035, i * 0.05));
  }, [playTone]);

  const playReadyDing = useCallback(() => { playTone(880, 0.12, 'sine', 0.1); playTone(1100, 0.1, 'triangle', 0.07, 0.06); }, [playTone]);
  const playVictory = useCallback(() => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => playTone(f, i === 5 ? 0.3 : 0.15, i > 3 ? 'triangle' : 'sine', 0.1, i * 0.12)); }, [playTone]);
  const playDefeat = useCallback(() => { [440, 370, 330, 294].forEach((f, i) => playTone(f, 0.2 + i * 0.04, 'triangle', 0.07 - i * 0.005, i * 0.15)); }, [playTone]);

  /* ─── P2P State Sync (LOGIC UNTOUCHED) ────────────────────────────── */
  const handleGameState = useCallback((state: GameState) => {
    const parsePlayerState = (raw?: string): EncodedPlayerState => {
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw) as Partial<EncodedPlayerState>;
        const next: EncodedPlayerState = {};
        if (parsed.move === null || parsed.move === 'rock' || parsed.move === 'paper' || parsed.move === 'scissors') next.move = parsed.move;
        if (typeof parsed.ready === 'boolean') next.ready = parsed.ready;
        if (parsed.emote === null || parsed.emote === 'smug' || parsed.emote === 'panic' || parsed.emote === 'challenge' || parsed.emote === 'taunt') next.emote = parsed.emote;
        return next;
      } catch { return {}; }
    };

    const remoteP1 = parsePlayerState(state.player1Card);
    const remoteP2 = parsePlayerState(state.player2Card);

    setCurrentRound(state.currentRound);
    setPlayer1State(prev => ({
      ...prev, score: state.player1Score,
      move: remoteP1.move === undefined ? prev.move : remoteP1.move,
      ready: remoteP1.ready === undefined ? prev.ready : prev.ready || remoteP1.ready,
      emote: remoteP1.emote === undefined ? prev.emote : remoteP1.emote,
    }));
    setPlayer2State(prev => ({
      ...prev, score: state.player2Score,
      move: remoteP2.move === undefined ? prev.move : remoteP2.move,
      ready: remoteP2.ready === undefined ? prev.ready : prev.ready || remoteP2.ready,
      emote: remoteP2.emote === undefined ? prev.emote : remoteP2.emote,
    }));
    setGamePhase(state.phase as GamePhase);
  }, []);

  const [room, actions] = useP2PRoom(handleGameState);

  const syncGameState = useCallback((phase: GamePhase, p1: PlayerGameState, p2: PlayerGameState, round: number) => {
    if (room.state !== 'connected') return;
    actions.sendGameState({
      player1Score: p1.score, player2Score: p2.score, currentRound: round,
      player1Card: JSON.stringify({ move: p1.move, ready: p1.ready, emote: p1.emote }),
      player2Card: JSON.stringify({ move: p2.move, ready: p2.ready, emote: p2.emote }),
      phase: phase as 'betting' | 'reveal' | 'resolution',
    });
  }, [room.state, actions]);

  /* ─── Match Initialization ────────────────────────────────────────── */
  const initializeMatch = useCallback(() => {
    setLocalHand(generateRandomHand());
    setOpponentCardCount(3);
    selectedCardIdRef.current = null;
    roundResolvingRef.current = false;
    setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
    setDuelReveal(false);
    setImpactFlash(false);
    setGamePhase('dealing');

    dealingTimerRef.current = setTimeout(() => {
      setGamePhase('ready');
      dealingTimerRef.current = null;
    }, DEALING_MS);
  }, []);

  const advanceToNextRound = useCallback(() => {
    roundResolvingRef.current = false;
    // Remove used card from local hand
    if (selectedCardIdRef.current) {
      setLocalHand(prev => prev.filter(c => c.id !== selectedCardIdRef.current));
      selectedCardIdRef.current = null;
    }
    setOpponentCardCount(prev => Math.max(0, prev - 1));

    // Clear moves
    setPlayer1State(prev => ({ ...prev, move: null }));
    setPlayer2State(prev => ({ ...prev, move: null }));
    setDuelReveal(false);
    setImpactFlash(false);

    setCurrentRound(prev => prev + 1);
    setGamePhase('playing');
  }, []);

  /* ─── Effects (CONNECTION, AUDIO, GAME FLOW — logic untouched) ──── */
  useEffect(() => {
    if (room.state === 'connected') {
      setIsHost(room.isHost);
      setLocalPlayerId(room.isHost ? 1 : 2);
      setRemotePlayerId(room.isHost ? 2 : 1);
      if (showLobby) {
        setShowLobby(false);
        setShowGame(true);
        initializeMatch();
      }
    }
  }, [room.state, room.isHost, showLobby, initializeMatch]);

  useEffect(() => () => { clearDealingTimer(); clearRoundAnimTimers(); if (audioCtxRef.current) { void audioCtxRef.current.close(); audioCtxRef.current = null; } }, [clearDealingTimer, clearRoundAnimTimers]);

  useEffect(() => { if (room.latency > 0) setLatency(room.latency); }, [room.latency]);
  useEffect(() => { if (room.state === 'connected') unlockAudio(); }, [room.state, unlockAudio]);
  useEffect(() => { if (gamePhase === 'dealing') playShuffleRiff(); }, [gamePhase, playShuffleRiff]);

  useEffect(() => {
    if (!open) return;
    const handler = () => { if (!audioUnlockedRef.current) unlockAudio(); };
    window.addEventListener('pointerdown', handler, { passive: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, [open, unlockAudio]);

  useEffect(() => {
    if (!remoteEmote) return;
    playEmotePing(remoteEmote);
    const t = setTimeout(() => {
      if (localPlayerId === 1) setPlayer2State(prev => (prev.emote === remoteEmote ? { ...prev, emote: null } : prev));
      else setPlayer1State(prev => (prev.emote === remoteEmote ? { ...prev, emote: null } : prev));
    }, 1800);
    return () => clearTimeout(t);
  }, [remoteEmote, localPlayerId, playEmotePing]);

  // Both ready → play
  useEffect(() => {
    if (gamePhase === 'ready' && player1State.ready && player2State.ready) {
      const t = setTimeout(() => setGamePhase('playing'), 1000);
      return () => clearTimeout(t);
    }
  }, [gamePhase, player1State.ready, player2State.ready]);

  // Both moves → resolve (ref guard prevents re-entry when score updates change deps)
  useEffect(() => {
    if (gamePhase !== 'playing' || !player1State.move || !player2State.move) return;
    if (roundResolvingRef.current) return;
    roundResolvingRef.current = true;

    setGamePhase('round_end');

    const BEATS: Record<Move, Move> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    let p1Win = false, p2Win = false;
    if (player1State.move !== player2State.move) {
      if (BEATS[player1State.move] === player2State.move) p1Win = true; else p2Win = true;
    }
    if (p1Win) setPlayer1State(prev => ({ ...prev, score: prev.score + 1 }));
    if (p2Win) setPlayer2State(prev => ({ ...prev, score: prev.score + 1 }));

    const s1 = player1State.score + (p1Win ? 1 : 0);
    const s2 = player2State.score + (p2Win ? 1 : 0);

    const nextTimer = setTimeout(() => {
      if (s1 >= 2 || s2 >= 2 || currentRound >= MAX_ROUNDS) {
        roundResolvingRef.current = false;
        setGamePhase('game_end');
      } else {
        advanceToNextRound();
      }
    }, 2200);

    roundAnimTimersRef.current.push(nextTimer);
  }, [gamePhase, player1State.move, player2State.move, player1State.score, player2State.score, currentRound, advanceToNextRound]);

  // Round-end animation timings
  useEffect(() => {
    if (gamePhase !== 'round_end') { setDuelReveal(false); setImpactFlash(false); clearRoundAnimTimers(); return; }
    clearRoundAnimTimers();
    const t1 = setTimeout(() => setImpactFlash(true), 280);
    const t2 = setTimeout(() => setDuelReveal(true), 540);
    const t3 = setTimeout(() => setImpactFlash(false), 1000);
    roundAnimTimersRef.current.push(t1, t2, t3);
  }, [gamePhase, clearRoundAnimTimers]);

  useEffect(() => { if (impactFlash) { playImpactSnap(); playCrash(); setShatterPulse(p => p + 1); } }, [impactFlash, playImpactSnap, playCrash]);
  useEffect(() => { if (duelReveal) playRevealChord(); }, [duelReveal, playRevealChord]);

  useEffect(() => {
    if (gamePhase !== 'game_end') return;
    const ls = localPlayerId === 1 ? player1State.score : player2State.score;
    const rs = localPlayerId === 1 ? player2State.score : player1State.score;
    if (ls > rs) playVictory(); else if (rs > ls) playDefeat();
  }, [gamePhase, localPlayerId, player1State.score, player2State.score, playVictory, playDefeat]);

  /* ─── Player Actions (LOGIC UNTOUCHED) ────────────────────────────── */
  const handleLocalReady = useCallback(() => {
    unlockAudio(); playReadyDing();
    const n1 = localPlayerId === 1 ? { ...player1State, ready: true } : player1State;
    const n2 = localPlayerId === 2 ? { ...player2State, ready: true } : player2State;
    if (localPlayerId === 1) setPlayer1State(n1); else setPlayer2State(n2);
    syncGameState('ready', n1, n2, currentRound);
  }, [localPlayerId, player1State, player2State, currentRound, syncGameState, unlockAudio, playReadyDing]);

  const handleMoveSelect = useCallback((move: Move, cardId: string) => {
    if (localMove) return;
    unlockAudio(); playCardPickTick(move);
    selectedCardIdRef.current = cardId;
    const n1 = localPlayerId === 1 ? { ...player1State, move } : player1State;
    const n2 = localPlayerId === 2 ? { ...player2State, move } : player2State;
    if (localPlayerId === 1) setPlayer1State(n1); else setPlayer2State(n2);
    syncGameState('playing', n1, n2, currentRound);
  }, [localPlayerId, player1State, player2State, currentRound, syncGameState, playCardPickTick, unlockAudio, localMove]);

  const handleEmote = useCallback((emoteType: EmoteType) => {
    unlockAudio();
    const n1 = localPlayerId === 1 ? { ...player1State, emote: emoteType } : player1State;
    const n2 = localPlayerId === 2 ? { ...player2State, emote: emoteType } : player2State;
    if (localPlayerId === 1) setPlayer1State(n1); else setPlayer2State(n2);
    playEmotePing(emoteType);
    syncGameState(gamePhase, n1, n2, currentRound);
    setTimeout(() => {
      const c1 = localPlayerId === 1 ? { ...n1, emote: null } : n1;
      const c2 = localPlayerId === 2 ? { ...n2, emote: null } : n2;
      if (localPlayerId === 1) setPlayer1State(c1); else setPlayer2State(c2);
      syncGameState(gamePhase, c1, c2, currentRound);
    }, 1500);
  }, [localPlayerId, player1State, player2State, currentRound, gamePhase, syncGameState, playEmotePing, unlockAudio]);

  const handleClose = useCallback(() => {
    clearDealingTimer(); clearRoundAnimTimers(); actions.disconnect();
    setShowLobby(true); setShowGame(false); setGamePhase('lobby'); setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
    setLocalHand([]); setOpponentCardCount(3);
    onClose();
  }, [actions, onClose, clearDealingTimer, clearRoundAnimTimers]);

  const handleBackToLobby = useCallback(() => {
    clearDealingTimer(); clearRoundAnimTimers(); actions.disconnect();
    setShowLobby(true); setShowGame(false); setGamePhase('lobby'); setCurrentRound(1);
    setPlayer1State({ score: 0, move: null, ready: false, emote: null });
    setPlayer2State({ score: 0, move: null, ready: false, emote: null });
    setLocalHand([]); setOpponentCardCount(3);
  }, [actions, clearDealingTimer, clearRoundAnimTimers]);

  const handleRematch = useCallback(() => {
    clearDealingTimer(); clearRoundAnimTimers();
    initializeMatch();
  }, [initializeMatch, clearDealingTimer, clearRoundAnimTimers]);

  /* ── Derived data for opponent hand display ────────────────────────── */
  const opponentDisplayCards = useMemo(() =>
    Array.from({ length: opponentCardCount }, (_, i) => ({ id: `opp-${i}`, move: 'rock' as Move })),
    [opponentCardCount]
  );

  /* ── Hand info banner ──────────────────────────────────────────────── */
  const handSummary = useMemo(() => {
    const counts: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };
    localHand.forEach(c => counts[c.move]++);
    const parts: string[] = [];
    if (counts.rock > 0) parts.push(`${counts.rock}🪨`);
    if (counts.paper > 0) parts.push(`${counts.paper}📄`);
    if (counts.scissors > 0) parts.push(`${counts.scissors}✂️`);
    return parts.join(' · ');
  }, [localHand]);

  if (!open) return null;

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[10030]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/92 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

          <motion.div
            className="relative mx-auto mt-[2dvh] h-[96dvh] w-[98vw] overflow-hidden rounded-xl border border-white/12 bg-[#08080b] text-white shadow-[0_18px_70px_rgba(0,0,0,0.7)] sm:mt-[3dvh] sm:h-[94dvh] sm:w-[96vw] lg:mt-[4dvh] lg:h-[92dvh] lg:w-[min(96vw,1000px)]"
            initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }}
          >
            {/* ── Header ── */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/8 px-4 py-2.5 bg-gradient-to-r from-[#08080b]/95 via-[#0e0e14]/95 to-[#08080b]/95 backdrop-blur-sm">
              <Button variant="ghost" size="sm" onClick={handleBackToLobby} className="text-zinc-500 hover:text-white h-8 px-2">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Lobby
              </Button>
              <h1 className="text-xs font-bold uppercase tracking-[0.22em] text-white/80">⚔️ Carta Forbice Sasso</h1>
              <div className="flex items-center gap-2">
                {room.state === 'connected' ? (
                  <div className="flex items-center gap-1.5">
                    <motion.div className="h-1.5 w-1.5 rounded-full bg-emerald-400" animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <Wifi className="h-3 w-3 text-emerald-400/70" />
                    <span className="text-[10px] font-mono text-zinc-600">{latency}ms</span>
                  </div>
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-amber-500/60" />
                )}
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-zinc-500 hover:text-red-400 h-8 px-2">✕</Button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="h-full pt-12 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* ═══ LOBBY ═══ */}
                {showLobby && (
                  <motion.div key="lobby" className="h-full flex items-center justify-center p-3 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <P2PLobby onConnected={() => { setShowLobby(false); setShowGame(true); }} room={room} actions={actions} />
                  </motion.div>
                )}

                {/* ═══ GAME ═══ */}
                {showGame && room.state === 'connected' && (
                  <motion.div key="game" className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Score bar */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-zinc-950/50">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary/70" />
                        <span className="text-xs text-zinc-400">Tu (P{localPlayerId})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.span key={`s1-${player1State.score}`} className="text-xl font-black text-primary" initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
                          {player1State.score}
                        </motion.span>
                        <span className="text-zinc-600 text-sm font-bold">—</span>
                        <motion.span key={`s2-${player2State.score}`} className="text-xl font-black text-primary" initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
                          {player2State.score}
                        </motion.span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        Round {currentRound}/{MAX_ROUNDS}
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                      {/* Ambient lighting */}
                      <motion.div className="pointer-events-none absolute -left-20 top-1/4 h-56 w-56 rounded-full bg-primary/8 blur-3xl" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 5, repeat: Infinity }} />
                      <motion.div className="pointer-events-none absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-cyan-500/8 blur-3xl" animate={{ opacity: [0.4, 0.65, 0.4] }} transition={{ duration: 6, repeat: Infinity }} />

                      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-6">

                        {/* ═══ DEALING ═══ */}
                        {gamePhase === 'dealing' && (
                          <motion.div className="w-full max-w-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p className="text-center text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4">
                              Distribuzione carte — Round {currentRound}
                            </p>

                            {/* Dealing table */}
                            <div className="relative mx-auto h-[380px] rounded-3xl border border-white/8 bg-[radial-gradient(circle_at_50%_30%,rgba(255,115,0,0.18),transparent_55%),linear-gradient(180deg,rgba(12,12,16,0.97),rgba(8,8,11,0.97))] overflow-hidden">
                              {/* Inner glow */}
                              <motion.div className="pointer-events-none absolute left-1/2 top-[40%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl" animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.15, 0.9] }} transition={{ duration: 1.3, repeat: Infinity }} />

                              {/* Central deck pile */}
                              {[0, 1, 2].map(i => (
                                <motion.div
                                  key={`deck-${i}`}
                                  className="absolute left-1/2 top-[38%]"
                                  style={{ marginLeft: -32, marginTop: -44 }}
                                  initial={{ rotate: -3 + i * 3, y: i * -2 }}
                                  animate={{ rotate: [-5 + i * 4, 5 - i * 4, -5 + i * 4], y: [i * -2, i * -4, i * -2] }}
                                  transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                  <div className="h-[88px] w-[64px]"><ArenaCardBack /></div>
                                </motion.div>
                              ))}

                              {/* Cards dealing to opponent (top) */}
                              {[0, 1, 2].map(idx => (
                                <motion.div
                                  key={`deal-opp-${idx}`}
                                  className="absolute left-1/2 top-[38%]"
                                  initial={{ x: -32, y: -44, rotate: 0, opacity: 0, scale: 0.7 }}
                                  animate={{ x: -110 + idx * 72, y: -180, rotate: -12 + idx * 12, opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.5, delay: 0.6 + idx * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                  onAnimationStart={() => { if (idx <= 2) playCardDealWhip(idx); }}
                                >
                                  <div className="h-[76px] w-[56px]"><ArenaCardBack /></div>
                                </motion.div>
                              ))}

                              {/* Cards dealing to player (bottom) — face UP to reveal hand */}
                              {localHand.map((card, idx) => (
                                <motion.div
                                  key={`deal-me-${card.id}`}
                                  className="absolute left-1/2 top-[38%]"
                                  initial={{ x: -32, y: -44, rotate: 0, opacity: 0, scale: 0.7 }}
                                  animate={{ x: -110 + idx * 72, y: 90, rotate: -8 + idx * 8, opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.5, delay: 1.0 + idx * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <HandMoveCard card={card} hidden={false} disabled />
                                </motion.div>
                              ))}

                              <motion.p
                                className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-zinc-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
                              >
                                Carte distribuite casualmente
                              </motion.p>
                            </div>
                          </motion.div>
                        )}

                        {/* ═══ READY ═══ */}
                        {gamePhase === 'ready' && (
                          <motion.div className="w-full max-w-md rounded-2xl border border-white/8 bg-zinc-950/70 p-7 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                            <Loader2 className="h-8 w-8 text-primary/70 mx-auto mb-4 animate-spin" />
                            <h3 className="text-lg font-semibold text-white mb-5">Pronti?</h3>

                            <div className="flex items-center justify-center gap-6 mb-6">
                              {[{ label: `P1${localPlayerId === 1 ? ' (Tu)' : ''}`, ready: player1State.ready }, { label: `P2${localPlayerId === 2 ? ' (Tu)' : ''}`, ready: player2State.ready }].map((p, i) => (
                                <motion.div key={i} className="text-center" animate={p.ready ? { scale: [1, 1.05, 1] } : { opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-1.5 text-sm font-black ${p.ready ? 'bg-emerald-500/15 border border-emerald-400/60 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)]' : 'bg-zinc-900 border border-zinc-700 text-zinc-500'}`}>
                                    {p.ready ? '✓' : '…'}
                                  </div>
                                  <span className="text-[10px] text-zinc-400">{p.label}</span>
                                </motion.div>
                              ))}
                            </div>

                            <div className="text-[10px] text-zinc-600 mb-5">La tua mano: {handSummary}</div>

                            {!((localPlayerId === 1 && player1State.ready) || (localPlayerId === 2 && player2State.ready)) && (
                              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                <Button onClick={handleLocalReady} className="bg-primary hover:bg-primary/90 text-white px-8 py-5 text-base rounded-lg shadow-[0_8px_28px_rgba(255,115,0,0.3)]">
                                  ⚡ Pronto!
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {/* ═══ PLAYING ═══ */}
                        {gamePhase === 'playing' && (
                          <motion.div className="w-full max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

                            {/* Opponent section */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Avversario — {opponentCardCount} carte</span>
                                {remoteMove && (
                                  <motion.span className="text-[10px] text-emerald-400 uppercase tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    ✓ mossa scelta
                                  </motion.span>
                                )}
                              </div>
                              <div className="flex items-center justify-center gap-3">
                                {opponentDisplayCards.map((card, idx) => (
                                  <motion.div key={card.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, rotate: -6 + idx * 6 }} transition={{ delay: idx * 0.08 }}>
                                    <HandMoveCard card={card} hidden={true} />
                                  </motion.div>
                                ))}
                              </div>

                              {/* Remote emote sticker */}
                              <AnimatePresence>
                                {remoteEmote && (
                                  <motion.div className="flex justify-center mt-3" initial={{ opacity: 0, y: -8, scale: 0.4 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.7 }} transition={{ type: 'spring', stiffness: 350, damping: 18 }}>
                                    <motion.div
                                      className={`rounded-2xl border-2 ${EMOTE_CFG[remoteEmote].border} bg-gradient-to-br ${EMOTE_CFG[remoteEmote].tone} p-2 flex items-center gap-2`}
                                      style={{ boxShadow: `0 0 28px ${EMOTE_CFG[remoteEmote].glow}` }}
                                      animate={remoteEmote === 'panic' ? { x: [0, -3, 3, -2, 2, 0], rotate: [0, -4, 4, -2, 2, 0] } : remoteEmote === 'taunt' ? { y: [0, -4, 0], rotate: [0, 6, -6, 0] } : { scale: [1, 1.06, 1], y: [0, -3, 0] }}
                                      transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                      <StickerFace emote={remoteEmote} size={42} />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 pr-1">{EMOTE_CFG[remoteEmote].label}</span>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* ── ARENA ZONE ── */}
                            <div className="relative mx-auto rounded-[28px] border-2 border-primary/15 bg-[radial-gradient(circle_at_50%_42%,rgba(255,115,0,0.22),transparent_50%),radial-gradient(circle_at_30%_70%,rgba(56,189,248,0.12),transparent_48%),radial-gradient(circle_at_70%_30%,rgba(168,50,105,0.1),transparent_48%),linear-gradient(180deg,#0c0c10,#080810)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.6)]" style={{ minHeight: 160 }}>

                              {/* Inner border ring */}
                              <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-white/[0.04]" />

                              {/* Diamond pattern overlay */}
                              <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[0.03]" style={{ backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)', backgroundSize: '24px 24px' }} />

                              {/* Center emblem */}
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
                                  <div className="h-8 w-8 rotate-45 border border-primary/20 bg-primary/5 rounded-sm" />
                                </motion.div>
                                <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/[0.04]" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }} />
                              </div>

                              {/* Energy streaks when moves exist */}
                              {(localMove || remoteMove) && (
                                <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <motion.div
                                      key={i}
                                      className="absolute h-[1.5px] w-12 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                                      style={{ top: `${15 + i * 10}%`, left: `${5 + i * 11}%`, transform: `rotate(${-20 + i * 5}deg)` }}
                                      animate={{ x: [-10, 16, -8, 0], opacity: [0, 0.6, 0.15, 0] }}
                                      transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.05 }}
                                    />
                                  ))}
                                </motion.div>
                              )}

                              {/* Status text */}
                              <motion.p
                                className="relative text-center text-xs font-semibold uppercase tracking-[0.2em]"
                                style={{ color: localMove && remoteMove ? '#FF7300' : localMove || remoteMove ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)' }}
                                animate={(localMove || remoteMove) ? { opacity: [0.5, 1, 0.5] } : {}}
                                transition={{ duration: 1.4, repeat: Infinity }}
                              >
                                {localMove && remoteMove
                                  ? '⚡ Scontro imminente...'
                                  : localMove
                                    ? 'In attesa dell\'avversario...'
                                    : remoteMove
                                      ? 'L\'avversario ha scelto!'
                                      : 'Seleziona la tua carta'}
                              </motion.p>
                            </div>

                            {/* Player section */}
                            <div className="mt-5">
                              <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">La tua mano — {localHand.length} carte</span>
                                <span className="text-[10px] text-zinc-600">{handSummary}</span>
                              </div>

                              <div className="relative rounded-2xl border border-white/8 bg-zinc-950/50 px-4 py-4">
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,115,0,0.1),transparent_50%)]" />

                                <div className="relative flex items-center justify-center gap-4">
                                  {localHand.map((card) => {
                                    const selected = localMove === card.move && selectedCardIdRef.current === card.id;
                                    const disabled = !!localMove;
                                    return (
                                      <motion.div
                                        key={card.id}
                                        animate={selected ? { scale: 1.18, y: -10 } : { scale: 1.1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <HandMoveCard card={card} hidden={false} disabled={disabled} selected={selected} onPick={() => handleMoveSelect(card.move, card.id)} />
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Local emote */}
                              <AnimatePresence>
                                {localEmote && (
                                  <motion.div className="flex justify-center mt-2" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.7 }}>
                                    <div className={`rounded-xl border ${EMOTE_CFG[localEmote].border} bg-gradient-to-br ${EMOTE_CFG[localEmote].tone} p-1.5`} style={{ boxShadow: `0 0 16px ${EMOTE_CFG[localEmote].glow}` }}>
                                      <StickerFace emote={localEmote} size={36} />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Emote buttons */}
                              <div className="mt-3 flex items-center justify-center gap-2">
                                {(['smug', 'panic', 'challenge', 'taunt'] as EmoteType[]).map(e => (
                                  <motion.button
                                    key={e}
                                    onClick={() => handleEmote(e)}
                                    whileHover={{ scale: 1.12, y: -2 }}
                                    whileTap={{ scale: 0.88 }}
                                    className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 transition ${localEmote === e ? `${EMOTE_CFG[e].border} bg-gradient-to-br ${EMOTE_CFG[e].tone}` : 'border-white/10 bg-zinc-900/50 hover:border-white/25'}`}
                                  >
                                    <StickerFace emote={e} size={28} />
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">{EMOTE_CFG[e].label}</span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* ═══ ROUND END ═══ */}
                        {gamePhase === 'round_end' && (
                          <motion.div className="w-full max-w-lg rounded-2xl border border-white/8 bg-zinc-950/75 p-6 text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-5">Round {currentRound} — Risultato</p>

                            <div className="relative flex items-center justify-center gap-6 min-h-[260px]">
                              {/* Impact blast */}
                              <motion.div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl" animate={impactFlash ? { scale: [0.3, 1.8], opacity: [0.9, 0] } : { opacity: 0 }} transition={{ duration: 0.5 }} />
                              <motion.div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" animate={impactFlash ? { scale: [0.5, 1.4], opacity: [0.8, 0] } : { opacity: 0 }} transition={{ duration: 0.6 }} />

                              {/* Shatter fragments */}
                              <AnimatePresence>
                                {impactFlash && (
                                  <motion.div key={`sh-${shatterPulse}`} className="pointer-events-none absolute inset-0">
                                    {Array.from({ length: 20 }).map((_, i) => {
                                      const a = (i / 20) * Math.PI * 2;
                                      const d = 60 + (i % 5) * 15;
                                      return (
                                        <motion.div key={i} className="absolute left-1/2 top-1/2 h-2 w-5 rounded bg-gradient-to-r from-primary/70 to-cyan-300/60"
                                          initial={{ x: 0, y: 0, rotate: 0, opacity: 0.9, scale: 1 }}
                                          animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, rotate: i % 2 === 0 ? 150 : -150, opacity: 0, scale: 0.2 }}
                                          transition={{ duration: 0.4, delay: i * 0.01 }}
                                        />
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Duel cards */}
                              {(() => {
                                const outcome = getRoundOutcome(player1State.move, player2State.move);
                                const localOutcome = outcome === 'draw' ? 'draw' : localPlayerId === 1 ? outcome : (outcome === 'player' ? 'opponent' : 'player');
                                const ls: 'winner' | 'loser' | 'draw' | 'neutral' = localOutcome === 'player' ? 'winner' : localOutcome === 'opponent' ? 'loser' : localOutcome === 'draw' ? 'draw' : 'neutral';
                                const rs: 'winner' | 'loser' | 'draw' | 'neutral' = localOutcome === 'opponent' ? 'winner' : localOutcome === 'player' ? 'loser' : localOutcome === 'draw' ? 'draw' : 'neutral';
                                return (
                                  <>
                                    <motion.div initial={{ x: -150, y: 160, rotate: 20, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                                      <DuelCard move={localMove ?? 'rock'} reveal={duelReveal} state={ls} title="Tu" />
                                    </motion.div>
                                    <motion.span className="text-zinc-600 text-xl font-black" animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.6, delay: 0.3 }}>VS</motion.span>
                                    <motion.div initial={{ x: 150, y: -160, rotate: -20, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                                      <DuelCard move={remoteMove ?? 'rock'} reveal={duelReveal} state={rs} title="Rivale" />
                                    </motion.div>
                                  </>
                                );
                              })()}
                            </div>

                            <motion.p className="mt-4 text-base font-semibold text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                              {(() => {
                                const o = getRoundOutcome(player1State.move, player2State.move);
                                const lo = o === 'draw' ? 'draw' : localPlayerId === 1 ? o : (o === 'player' ? 'opponent' : 'player');
                                return lo === 'draw' ? '⚖️ Pareggio!' : lo === 'player' ? '🏆 Hai vinto il round!' : '💀 Round al rivale';
                              })()}
                            </motion.p>
                          </motion.div>
                        )}

                        {/* ═══ GAME END ═══ */}
                        {gamePhase === 'game_end' && (
                          <motion.div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-zinc-950/80 p-8 text-center overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                            <ConfettiBurst active />
                            <motion.div animate={{ y: [0, -6, 0], rotate: [0, -4, 4, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
                              <Trophy className="h-14 w-14 text-primary mx-auto drop-shadow-[0_0_18px_rgba(255,115,0,0.5)]" />
                            </motion.div>
                            <motion.h2 className="mt-3 text-2xl font-bold text-white" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                              {(() => { const l = localPlayerId === 1 ? player1State.score : player2State.score; const r = localPlayerId === 1 ? player2State.score : player1State.score; return l > r ? '🏆 Vittoria!' : r > l ? '💀 Sconfitta' : '⚖️ Pareggio'; })()}
                            </motion.h2>
                            <div className="mt-3 flex items-center justify-center gap-3 text-xl font-black">
                              <span className="text-primary">{player1State.score}</span>
                              <span className="text-zinc-600">—</span>
                              <span className="text-primary">{player2State.score}</span>
                            </div>
                            <motion.div className="mt-6 flex items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                              <Button onClick={handleRematch} className="bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-lg">🔄 Rivincita</Button>
                              <Button onClick={handleBackToLobby} variant="outline" className="px-6 py-5 rounded-lg">Lobby</Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══ DISCONNECTED ═══ */}
                {showGame && room.state !== 'connected' && (
                  <motion.div key="dc" className="h-full flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <WifiOff className="h-14 w-14 text-red-500/60 mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Connessione Persa</h3>
                    <p className="text-zinc-500 text-sm mb-5">Il collegamento P2P si è interrotto.</p>
                    <Button onClick={handleBackToLobby} variant="outline">Torna alla Lobby</Button>
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

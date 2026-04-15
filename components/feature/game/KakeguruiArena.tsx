'use client';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import {
  Crown,
  ShieldAlert,
  Smile,
  Swords,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

type Move = 'rock' | 'paper' | 'scissors';
type GameState = 'idle' | 'dealing' | 'playing' | 'resolving' | 'end';
type RoundOutcome = 'player' | 'opponent' | 'draw';

type EmoteType = 'smug' | 'panic' | 'challenge';

interface HandCard {
  id: string;
  move: Move;
}

interface DuelSnapshot {
  player: HandCard;
  opponent: HandCard;
}

interface EmoteBurst {
  id: number;
  emoji: string;
  tone: string;
}

interface KakeguruiArenaProps {
  open: boolean;
  onClose: () => void;
  playerName?: string;
  opponentName?: string;
}

const TURN_DURATION_MS = 3000;
const WIN_TARGET = 2;

const MOVE_META: Record<Move, { label: string; emoji: string; color: string; accentHex: string; accentRgb: string }> = {
  rock: {
    label: 'Sasso',
    emoji: '🪨',
    color: 'from-amber-400/25 to-orange-500/25',
    accentHex: '#FF7300',
    accentRgb: '255,115,0',
  },
  paper: {
    label: 'Carta',
    emoji: '📄',
    color: 'from-cyan-300/25 to-sky-500/25',
    accentHex: '#818CF8',
    accentRgb: '129,140,248',
  },
  scissors: {
    label: 'Forbice',
    emoji: '✂️',
    color: 'from-fuchsia-400/25 to-rose-500/25',
    accentHex: '#34D399',
    accentRgb: '52,211,153',
  },
};

const EMOTES: Record<EmoteType, { emoji: string; tone: string; label: string }> = {
  smug: {
    emoji: '😈',
    tone: 'from-fuchsia-500/25 to-pink-500/25',
    label: 'Risata malefica',
  },
  panic: {
    emoji: '😰',
    tone: 'from-cyan-500/25 to-blue-500/25',
    label: 'Panico',
  },
  challenge: {
    emoji: '😤',
    tone: 'from-orange-500/25 to-red-500/25',
    label: 'Sfida',
  },
};

const BEATS: Record<Move, Move> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

const CARD_BACK_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 30%), radial-gradient(circle at 80% 80%, rgba(255,115,0,0.25), transparent 35%), linear-gradient(145deg, rgba(22,22,22,0.98), rgba(38,38,38,0.98))',
};

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomMove(): Move {
  const moves: Move[] = ['rock', 'paper', 'scissors'];
  return moves[Math.floor(Math.random() * moves.length)];
}

function createHand(prefix: string): HandCard[] {
  return Array.from({ length: 3 }, () => ({
    id: uid(prefix),
    move: randomMove(),
  }));
}

function resolveRound(playerMove: Move, opponentMove: Move): RoundOutcome {
  if (playerMove === opponentMove) return 'draw';
  return BEATS[playerMove] === opponentMove ? 'player' : 'opponent';
}

function ArenaCardBack({ variant = 'hand' }: { variant?: 'hand' | 'duel' }) {
  const isDuel = variant === 'duel';

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/20" style={CARD_BACK_STYLE}>
      <div className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/5" />
      <span className={`font-comodo font-black tracking-tight text-white/95 ${isDuel ? 'text-3xl' : 'text-lg'}`}>
        BRX
      </span>
      <span className={`mt-0.5 uppercase tracking-[0.32em] text-zinc-400 ${isDuel ? 'text-[9px]' : 'text-[8px]'}`}>
        Ebartex
      </span>
      <div className="pointer-events-none absolute left-3 right-3 top-3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

function ArenaMoveFace({
  move,
  variant = 'hand',
}: {
  move: Move;
  variant?: 'hand' | 'duel';
}) {
  const meta = MOVE_META[move];
  const isDuel = variant === 'duel';

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border"
      style={{
        borderColor: `rgba(${meta.accentRgb},0.65)`,
        background: 'linear-gradient(150deg, #1c1c22 0%, #0e0e12 35%, #16161b 70%, #1c1c22 100%)',
        boxShadow: `0 10px 34px rgba(${meta.accentRgb},0.28), inset 0 1px 0 rgba(${meta.accentRgb},0.15)`,
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(105deg, transparent 26%, rgba(${meta.accentRgb},0.2) 44%, rgba(255,255,255,0.45) 50%, rgba(${meta.accentRgb},0.2) 56%, transparent 74%)`,
          backgroundSize: '240% 100%',
        }}
        animate={{ backgroundPosition: ['220% 0', '-220% 0'] }}
        transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
      />

      <div className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/10" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: isDuel ? 92 : 56,
          height: isDuel ? 92 : 56,
          background: `radial-gradient(circle, rgba(${meta.accentRgb},0.2) 0%, transparent 72%)`,
        }}
      />

      <span
        className={`pointer-events-none absolute top-4 font-comodo font-black tracking-tight text-white/25 ${isDuel ? 'text-2xl' : 'text-base'}`}
        style={{ textShadow: `0 0 14px rgba(${meta.accentRgb},0.4)` }}
      >
        BRX
      </span>

      <span className={`${isDuel ? 'text-5xl' : 'text-2xl sm:text-3xl'}`}>{meta.emoji}</span>

      <span
        className={`mt-2 rounded-full border px-2.5 py-0.5 font-bold uppercase tracking-[0.2em] text-white/90 ${
          isDuel ? 'text-[10px]' : 'text-[9px]'
        }`}
        style={{ borderColor: `rgba(${meta.accentRgb},0.6)`, background: `rgba(${meta.accentRgb},0.15)` }}
      >
        {meta.label}
      </span>

      {[['left-2 top-2', 'left-0 top-0'], ['right-2 top-2', 'right-0 top-0'], ['bottom-2 left-2', 'bottom-0 left-0'], ['bottom-2 right-2', 'bottom-0 right-0']].map(([pos, inner], idx) => (
        <div key={idx} className={`pointer-events-none absolute ${pos} h-2.5 w-2.5`}>
          <div className={`absolute ${inner} h-[1.5px] w-2 rounded-full`} style={{ backgroundColor: `rgba(${meta.accentRgb},0.6)` }} />
          <div className={`absolute ${inner} h-2 w-[1.5px] rounded-full`} style={{ backgroundColor: `rgba(${meta.accentRgb},0.6)` }} />
        </div>
      ))}

      <div className="pointer-events-none absolute left-4 right-4 top-3 h-px bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, rgba(${meta.accentRgb},0.45), transparent)` }} />
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 h-px bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, rgba(${meta.accentRgb},0.45), transparent)` }} />
      <div className="pointer-events-none absolute h-2 w-2 rotate-45" style={{ border: `1px solid rgba(${meta.accentRgb},0.5)`, boxShadow: `0 0 8px rgba(${meta.accentRgb},0.35)` }} />
    </div>
  );
}

function HandMoveCard({
  card,
  hidden,
  disabled,
  selected,
  onPick,
}: {
  card: HandCard;
  hidden: boolean;
  disabled?: boolean;
  selected?: boolean;
  onPick?: () => void;
}) {
  const commonClasses =
    'relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border text-center shadow-lg sm:h-28 sm:w-24';

  if (hidden) {
    return (
      <motion.div
        layout
        className={`${commonClasses} border-white/20`}
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <ArenaCardBack />
      </motion.div>
    );
  }

  return (
    <motion.button
      layout
      type="button"
      disabled={disabled}
      onClick={onPick}
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: selected ? 1.04 : 1 }}
      whileHover={disabled ? undefined : { y: -4, scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`${commonClasses} ${
        selected
          ? 'border-orange-300 ring-2 ring-orange-400/70 shadow-[0_0_24px_rgba(255,115,0,0.42)]'
          : 'border-white/25 hover:border-white/45'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <ArenaMoveFace move={card.move} />
    </motion.button>
  );
}

function DuelCard({
  move,
  reveal,
  state,
  title,
}: {
  move: Move;
  reveal: boolean;
  state: 'neutral' | 'winner' | 'loser' | 'draw';
  title: string;
}) {
  const faceStyle: CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  return (
    <div className="w-[140px] sm:w-[180px]" style={{ perspective: '1200px' }}>
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
        {title}
      </p>
      <motion.div
        className={`relative h-[185px] w-full rounded-2xl ${
          state === 'winner'
            ? 'shadow-[0_0_32px_rgba(34,197,94,0.45)]'
            : state === 'loser'
              ? 'shadow-[0_0_20px_rgba(239,68,68,0.35)]'
              : 'shadow-[0_0_22px_rgba(255,255,255,0.10)]'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateY: reveal ? 180 : 0,
          scale: state === 'winner' ? 1.07 : 1,
          opacity: state === 'loser' ? 0.55 : 1,
          x: state === 'loser' ? [0, -4, 4, -3, 3, 0] : 0,
        }}
        transition={{
          rotateY: { duration: 0.56, ease: 'easeInOut' },
          scale: { duration: 0.34 },
          opacity: { duration: 0.3 },
          x: { duration: 0.4, ease: 'easeInOut' },
        }}
      >
        <div className="absolute inset-0" style={{ ...faceStyle }}>
          <ArenaCardBack variant="duel" />
        </div>

        <div
          className="absolute inset-0"
          style={{
            ...faceStyle,
            transform: 'rotateY(180deg)',
          }}
        >
          <ArenaMoveFace move={move} variant="duel" />
        </div>
      </motion.div>
    </div>
  );
}

export function KakeguruiArena({
  open,
  onClose,
  playerName = 'Tu',
  opponentName = 'Rivale',
}: KakeguruiArenaProps) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [playerHand, setPlayerHand] = useState<HandCard[]>([]);
  const [opponentHand, setOpponentHand] = useState<HandCard[]>([]);
  const [battle, setBattle] = useState<DuelSnapshot | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [countdownMs, setCountdownMs] = useState(TURN_DURATION_MS);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundIndex, setRoundIndex] = useState(1);
  const [roundOutcome, setRoundOutcome] = useState<RoundOutcome | null>(null);
  const [isAutoPicked, setIsAutoPicked] = useState(false);
  const [activeEmote, setActiveEmote] = useState<EmoteBurst | null>(null);

  const timeoutRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  const clearQueuedTimeouts = useCallback(() => {
    timeoutRef.current.forEach((id) => window.clearTimeout(id));
    timeoutRef.current = [];
  }, []);

  const stopCountdown = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const queueTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutRef.current = timeoutRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);

    timeoutRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const startDealing = useCallback(
    (resetScore: boolean) => {
      stopCountdown();
      clearQueuedTimeouts();

      if (resetScore) {
        setPlayerScore(0);
        setOpponentScore(0);
        setRoundIndex(1);
      }

      setRoundOutcome(null);
      setSelectedPlayerId(null);
      setBattle(null);
      setRevealed(false);
      setIsAutoPicked(false);
      setCountdownMs(TURN_DURATION_MS);
      setPlayerHand(createHand('player'));
      setOpponentHand(createHand('opponent'));
      setGameState('dealing');

      queueTimeout(() => {
        setGameState('playing');
      }, 1300);
    },
    [clearQueuedTimeouts, queueTimeout, stopCountdown]
  );

  const handleCardSelection = useCallback(
    (cardId: string, autoPicked = false) => {
      if (gameState !== 'playing') return;
      if (selectedPlayerId) return;

      const playerCard = playerHand.find((card) => card.id === cardId);
      if (!playerCard || opponentHand.length === 0) return;

      const opponentCard = opponentHand[Math.floor(Math.random() * opponentHand.length)];

      stopCountdown();
      setSelectedPlayerId(cardId);
      setRoundOutcome(null);
      setIsAutoPicked(autoPicked);
      setBattle({
        player: playerCard,
        opponent: opponentCard,
      });
      setGameState('resolving');
      setRevealed(false);

      // TODO: Emetti evento socket 'card_selected' qui.

      const remainingPlayer = playerHand.length - 1;
      const remainingOpponent = opponentHand.length - 1;
      let nextPlayerScore = playerScore;
      let nextOpponentScore = opponentScore;
      const outcome = resolveRound(playerCard.move, opponentCard.move);

      queueTimeout(() => {
        setRevealed(true);
      }, 500);

      queueTimeout(() => {
        setRoundOutcome(outcome);

        if (outcome === 'player') nextPlayerScore += 1;
        if (outcome === 'opponent') nextOpponentScore += 1;

        setPlayerScore(nextPlayerScore);
        setOpponentScore(nextOpponentScore);

        // TODO: Emetti evento socket 'round_resolved' qui.
      }, 1000);

      queueTimeout(() => {
        setPlayerHand((prev) => prev.filter((card) => card.id !== playerCard.id));
        setOpponentHand((prev) => prev.filter((card) => card.id !== opponentCard.id));
        setSelectedPlayerId(null);
        setBattle(null);
        setRevealed(false);
        setIsAutoPicked(false);

        if (nextPlayerScore >= WIN_TARGET || nextOpponentScore >= WIN_TARGET) {
          setGameState('end');
          return;
        }

        setRoundIndex((prev) => prev + 1);

        if (remainingPlayer <= 0 || remainingOpponent <= 0) {
          startDealing(false);
          return;
        }

        setGameState('playing');
        setCountdownMs(TURN_DURATION_MS);
      }, 2250);
    },
    [
      gameState,
      opponentHand,
      opponentScore,
      playerHand,
      playerScore,
      queueTimeout,
      selectedPlayerId,
      startDealing,
      stopCountdown,
    ]
  );

  const triggerEmote = useCallback(
    (type: EmoteType) => {
      const emote = EMOTES[type];
      const id = Date.now();
      setActiveEmote({
        id,
        emoji: emote.emoji,
        tone: emote.tone,
      });

      // TODO: Emetti evento socket 'player_emote' qui.

      queueTimeout(() => {
        setActiveEmote((prev) => (prev?.id === id ? null : prev));
      }, 1200);
    },
    [queueTimeout]
  );

  useEffect(() => {
    if (!open) {
      stopCountdown();
      clearQueuedTimeouts();
      setGameState('idle');
      return;
    }

    startDealing(true);
  }, [clearQueuedTimeouts, open, startDealing, stopCountdown]);

  useEffect(() => {
    if (gameState !== 'playing') {
      stopCountdown();
      return;
    }

    const startedAt = Date.now();
    setCountdownMs(TURN_DURATION_MS);

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, TURN_DURATION_MS - elapsed);
      setCountdownMs(left);

      if (left > 0) return;

      window.clearInterval(intervalId);
      intervalRef.current = null;

      if (playerHand.length === 0) return;

      const randomCard = playerHand[Math.floor(Math.random() * playerHand.length)];
      handleCardSelection(randomCard.id, true);
    }, 60);

    intervalRef.current = intervalId;

    return () => {
      window.clearInterval(intervalId);
      if (intervalRef.current === intervalId) {
        intervalRef.current = null;
      }
    };
  }, [gameState, handleCardSelection, playerHand, stopCountdown]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(
    () => () => {
      stopCountdown();
      clearQueuedTimeouts();
    },
    [clearQueuedTimeouts, stopCountdown]
  );

  const timerSeconds = Math.ceil(countdownMs / 1000);
  const progressPct = Math.max(0, (countdownMs / TURN_DURATION_MS) * 100);

  const duelState = useMemo(() => {
    if (!roundOutcome) {
      return {
        player: 'neutral' as const,
        opponent: 'neutral' as const,
      };
    }

    if (roundOutcome === 'draw') {
      return {
        player: 'draw' as const,
        opponent: 'draw' as const,
      };
    }

    return roundOutcome === 'player'
      ? { player: 'winner' as const, opponent: 'loser' as const }
      : { player: 'loser' as const, opponent: 'winner' as const };
  }, [roundOutcome]);

  const endTitle =
    playerScore > opponentScore
      ? 'Hai dominato la Arena'
      : playerScore < opponentScore
        ? 'Sei stato battuto'
        : 'Parita assoluta';

  const endSubtitle =
    playerScore > opponentScore
      ? 'La tua lettura psicologica e stata perfetta.'
      : playerScore < opponentScore
        ? 'Respira, studia il rivale e riparti.'
        : 'Nessuno ha ceduto. Stress puro.';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10020]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <motion.div
            className="relative mx-auto h-[100dvh] w-full max-w-[1200px] overflow-hidden border-x border-white/10 bg-[#090909] text-white"
            initial={{ y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,115,0,0.26), transparent 42%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.2), transparent 38%)',
            }} />

            <header className="relative z-10 border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-orange-400" />
                  <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/90 sm:text-base">
                    Kakegurui Arena
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-orange-300 hover:text-orange-200"
                >
                  <X className="h-3.5 w-3.5" />
                  Chiudi
                </button>
              </div>
            </header>

            <div className="relative z-10 grid h-[calc(100dvh-57px)] grid-rows-[auto_1fr_auto]">
              <section className="border-b border-white/10 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-rose-300/40 bg-gradient-to-br from-rose-500/25 to-fuchsia-500/15 text-lg font-black text-rose-200">
                      R
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/55">Avversario</p>
                      <p className="text-sm font-bold text-white sm:text-base">{opponentName}</p>
                    </div>
                  </div>
                  <p className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/80">
                    {opponentScore} - {playerScore}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {opponentHand.map((card) => (
                    <HandMoveCard key={card.id} card={card} hidden disabled />
                  ))}
                </div>
              </section>

              <section className="relative flex flex-col items-center justify-center px-4 py-4 sm:px-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/45 sm:mb-4">
                  Round {roundIndex}
                </p>

                <AnimatePresence mode="wait">
                  {gameState === 'dealing' && (
                    <motion.div
                      key="dealing"
                      className="relative flex h-[260px] w-full max-w-[560px] items-center justify-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <motion.div
                        className="h-32 w-24"
                        animate={{ rotate: [-2, 2, -2, 2, 0], y: [0, -3, 0] }}
                        transition={{ duration: 0.55, repeat: Infinity }}
                      >
                        <ArenaCardBack />
                      </motion.div>

                      {[0, 1, 2].map((idx) => (
                        <motion.div
                          key={`deal-up-${idx}`}
                          className="absolute h-20 w-16"
                          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                          animate={{
                            x: -140 + idx * 120,
                            y: -112,
                            opacity: 1,
                            rotate: -12 + idx * 12,
                          }}
                          transition={{ duration: 0.62, delay: idx * 0.08, ease: 'easeOut' }}
                        >
                          <ArenaCardBack />
                        </motion.div>
                      ))}

                      {[0, 1, 2].map((idx) => (
                        <motion.div
                          key={`deal-down-${idx}`}
                          className="absolute h-20 w-16"
                          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                          animate={{
                            x: -140 + idx * 120,
                            y: 116,
                            opacity: 1,
                            rotate: 10 - idx * 10,
                          }}
                          transition={{ duration: 0.62, delay: 0.22 + idx * 0.08, ease: 'easeOut' }}
                        >
                          <ArenaMoveFace move={['rock', 'paper', 'scissors'][idx] as Move} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {gameState === 'playing' && (
                    <motion.div
                      key="playing"
                      className="w-full max-w-[560px]"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                            Scegli la carta
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                            3 secondi
                          </p>
                        </div>

                        <div className="mt-3 flex items-end gap-3">
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={timerSeconds}
                              initial={{ y: 6, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -6, opacity: 0 }}
                              className="text-4xl font-black leading-none text-white sm:text-5xl"
                            >
                              {timerSeconds}
                            </motion.span>
                          </AnimatePresence>
                          <span className="pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                            tempo residuo
                          </span>
                        </div>

                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={`h-full ${
                              progressPct < 34
                                ? 'bg-gradient-to-r from-red-500 to-orange-400'
                                : progressPct < 67
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                  : 'bg-gradient-to-r from-emerald-400 to-amber-400'
                            }`}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ ease: 'linear', duration: 0.08 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {gameState === 'resolving' && battle && (
                    <motion.div
                      key="resolving"
                      className="flex w-full max-w-[560px] flex-col items-center"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="flex w-full items-center justify-center gap-4 sm:gap-8">
                        <DuelCard
                          move={battle.opponent.move}
                          reveal={revealed}
                          state={duelState.opponent}
                          title={opponentName}
                        />
                        <DuelCard
                          move={battle.player.move}
                          reveal={revealed}
                          state={duelState.player}
                          title={playerName}
                        />
                      </div>

                      <p className="mt-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-white/75">
                        {!revealed
                          ? 'Pausa drammatica...'
                          : roundOutcome === 'player'
                            ? 'Hai vinto il round'
                            : roundOutcome === 'opponent'
                              ? 'Round al rivale'
                              : 'Round in parita'}
                      </p>
                    </motion.div>
                  )}

                  {gameState === 'end' && (
                    <motion.div
                      key="end"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-[560px] rounded-2xl border border-white/20 bg-white/[0.06] p-6 text-center"
                    >
                      <p className="text-xl font-black uppercase tracking-wide text-white sm:text-2xl">
                        {endTitle}
                      </p>
                      <p className="mt-2 text-sm text-white/70">{endSubtitle}</p>

                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                        Score finale {playerScore} - {opponentScore}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startDealing(true)}
                          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-110"
                        >
                          Rigioca
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/85 transition hover:border-orange-300 hover:text-orange-200"
                        >
                          Esci
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAutoPicked && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-300/40 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-200"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Panico: carta selezionata automaticamente
                  </motion.div>
                )}
              </section>

              <section className="border-t border-white/10 px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="relative flex items-center gap-3">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-orange-300/50 bg-gradient-to-br from-orange-500/25 to-amber-500/20 text-lg font-black text-orange-100">
                      T

                      <AnimatePresence>
                        {activeEmote && (
                          <motion.div
                            key={activeEmote.id}
                            initial={{ opacity: 0, y: 8, scale: 0.65 }}
                            animate={{ opacity: 1, y: -48, scale: 1 }}
                            exit={{ opacity: 0, y: -72, scale: 0.8 }}
                            className={`pointer-events-none absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br ${activeEmote.tone} text-2xl shadow-[0_8px_20px_rgba(0,0,0,0.35)]`}
                          >
                            <span>{activeEmote.emoji}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/55">Giocatore</p>
                      <p className="text-sm font-bold text-white sm:text-base">{playerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(Object.keys(EMOTES) as EmoteType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        title={EMOTES[type].label}
                        onClick={() => triggerEmote(type)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br ${EMOTES[type].tone} text-base transition hover:scale-110 hover:border-white/50`}
                      >
                        <span aria-hidden>{EMOTES[type].emoji}</span>
                        <span className="sr-only">{EMOTES[type].label}</span>
                      </button>
                    ))}
                    <Smile className="h-4 w-4 text-white/60" aria-hidden />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {playerHand.map((card) => (
                    <HandMoveCard
                      key={card.id}
                      card={card}
                      hidden={false}
                      selected={selectedPlayerId === card.id}
                      disabled={gameState !== 'playing'}
                      onPick={() => handleCardSelection(card.id)}
                    />
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
                  <Crown className="h-3.5 w-3.5 text-orange-300" />
                  Primo a {WIN_TARGET} vittorie
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

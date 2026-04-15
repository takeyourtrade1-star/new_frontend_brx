'use client';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import {
  Crown,
  ShieldAlert,
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

export type Move = 'rock' | 'paper' | 'scissors';
type GameState = 'idle' | 'dealing' | 'playing' | 'resolving' | 'end';
type RoundOutcome = 'player' | 'opponent' | 'draw';

type EmoteType = 'smug' | 'panic' | 'challenge';

export interface HandCard {
  id: string;
  move: Move;
}

interface DuelSnapshot {
  player: HandCard;
  opponent: HandCard;
}

interface EmoteBurst {
  id: number;
  emote: EmoteType;
  tone: string;
}

interface KakeguruiArenaProps {
  open: boolean;
  onClose: () => void;
  playerName?: string;
  opponentName?: string;
}

const TURN_DURATION_SECONDS = 7;
const TURN_DURATION_MS = TURN_DURATION_SECONDS * 1000;
const WIN_TARGET = 2;

const MOVE_META: Record<Move, { label: string; color: string; accentHex: string; accentRgb: string }> = {
  rock: {
    label: 'Sasso',
    color: 'from-amber-400/25 to-orange-500/25',
    accentHex: '#FF7300',
    accentRgb: '255,115,0',
  },
  paper: {
    label: 'Carta',
    color: 'from-cyan-300/25 to-sky-500/25',
    accentHex: '#818CF8',
    accentRgb: '129,140,248',
  },
  scissors: {
    label: 'Forbice',
    color: 'from-fuchsia-400/25 to-rose-500/25',
    accentHex: '#34D399',
    accentRgb: '52,211,153',
  },
};

const EMOTES: Record<EmoteType, { tone: string; label: string }> = {
  smug: {
    tone: 'from-fuchsia-500/25 to-pink-500/25',
    label: 'Risata malefica',
  },
  panic: {
    tone: 'from-cyan-500/25 to-blue-500/25',
    label: 'Panico',
  },
  challenge: {
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
    'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.2), transparent 32%), radial-gradient(circle at 78% 82%, rgba(255,115,0,0.28), transparent 36%), linear-gradient(155deg, rgba(13,13,17,0.98), rgba(30,30,36,0.98) 40%, rgba(19,19,24,0.98) 100%)',
};

type MascotExpression = 'neutral' | 'smug' | 'panic' | 'challenge' | 'focus';

const EMOTE_EXPRESSIONS: Record<EmoteType, MascotExpression> = {
  smug: 'smug',
  panic: 'panic',
  challenge: 'challenge',
};

function MascotGlyph({
  expression,
  accentRgb,
  className,
}: {
  expression: MascotExpression;
  accentRgb: string;
  className?: string;
}) {
  const config: Record<MascotExpression, { mouth: string; leftPupil: string; rightPupil: string; brows?: string[] }> = {
    neutral: {
      mouth: 'M 34 65 Q 50 75 66 65',
      leftPupil: '35 41',
      rightPupil: '65 41',
    },
    smug: {
      mouth: 'M 36 65 Q 51 73 67 62',
      leftPupil: '33 39.5',
      rightPupil: '63 39.5',
    },
    panic: {
      mouth: 'M 45 67 Q 50 75 55 67 Q 50 62 45 67',
      leftPupil: '35 43',
      rightPupil: '65 43',
      brows: ['M 24 31 L 42 35', 'M 58 35 L 76 31'],
    },
    challenge: {
      mouth: 'M 34 67 Q 50 62 66 67',
      leftPupil: '36 40',
      rightPupil: '64 40',
      brows: ['M 24 35 L 42 31', 'M 58 31 L 76 35'],
    },
    focus: {
      mouth: 'M 36 66 Q 50 68 64 66',
      leftPupil: '35 40',
      rightPupil: '65 40',
      brows: ['M 24 33 L 42 33', 'M 58 33 L 76 33'],
    },
  };

  const active = config[expression];
  const [leftPupilX, leftPupilY] = active.leftPupil.split(' ').map(Number);
  const [rightPupilX, rightPupilY] = active.rightPupil.split(' ').map(Number);

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="45" fill={`rgba(${accentRgb},0.16)`} stroke={`rgba(${accentRgb},0.65)`} strokeWidth="2.8" />
      <circle cx="50" cy="50" r="39" fill="rgba(15,15,20,0.9)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.8" />

      {active.brows?.map((path, idx) => (
        <path key={idx} d={path} stroke="rgba(248,250,252,0.88)" strokeWidth="2.8" strokeLinecap="round" />
      ))}

      <circle cx="35" cy="40" r="11" fill="none" stroke="rgba(248,250,252,0.9)" strokeWidth="2.8" />
      <circle cx="65" cy="40" r="11" fill="none" stroke="rgba(248,250,252,0.9)" strokeWidth="2.8" />

      <circle cx={leftPupilX} cy={leftPupilY} r="4.8" fill="rgba(232,236,242,0.96)" />
      <circle cx={rightPupilX} cy={rightPupilY} r="4.8" fill="rgba(232,236,242,0.96)" />
      <circle cx={leftPupilX - 1.8} cy={leftPupilY - 1.8} r="1.6" fill="rgba(17,17,24,0.95)" />
      <circle cx={rightPupilX - 1.8} cy={rightPupilY - 1.8} r="1.6" fill="rgba(17,17,24,0.95)" />

      <path d={active.mouth} fill="none" stroke="rgba(248,250,252,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoveSymbolGlyph({
  move,
  accentRgb,
  className,
}: {
  move: Move;
  accentRgb: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="39" fill="rgba(10,10,14,0.58)" stroke={`rgba(${accentRgb},0.35)`} strokeWidth="1.8" />
      <circle cx="50" cy="50" r="31" fill="none" stroke={`rgba(${accentRgb},0.24)`} strokeWidth="1" strokeDasharray="2 4" />
      <path d="M 20 50 H 80" stroke={`rgba(${accentRgb},0.14)`} strokeWidth="1" />
      <path d="M 50 20 V 80" stroke={`rgba(${accentRgb},0.14)`} strokeWidth="1" />

      {move === 'rock' && (
        <>
          <path
            d="M 28 47 L 37 31 L 54 24 L 70 33 L 75 51 L 66 66 L 48 73 L 32 64 Z"
            fill={`rgba(${accentRgb},0.18)`}
            stroke={`rgba(${accentRgb},0.92)`}
            strokeWidth="3.2"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 8px rgba(${accentRgb},0.5))` }}
          />
          <path d="M 38 44 L 48 36" stroke="rgba(248,250,252,0.78)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 50 56 L 61 47" stroke="rgba(248,250,252,0.72)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 35 57 L 44 66" stroke="rgba(248,250,252,0.55)" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {move === 'paper' && (
        <>
          <rect
            x="30"
            y="19"
            width="40"
            height="62"
            rx="8"
            fill={`rgba(${accentRgb},0.14)`}
            stroke={`rgba(${accentRgb},0.95)`}
            strokeWidth="3"
            style={{ filter: `drop-shadow(0 0 9px rgba(${accentRgb},0.45))` }}
          />
          <path d="M 36 33 H 64" stroke="rgba(248,250,252,0.75)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 36 43 H 64" stroke="rgba(248,250,252,0.72)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 36 53 H 62" stroke="rgba(248,250,252,0.68)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 36 63 H 56" stroke="rgba(248,250,252,0.62)" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {move === 'scissors' && (
        <>
          <circle cx="34" cy="66" r="10.5" fill="none" stroke={`rgba(${accentRgb},0.95)`} strokeWidth="3" />
          <circle cx="66" cy="66" r="10.5" fill="none" stroke={`rgba(${accentRgb},0.95)`} strokeWidth="3" />
          <path
            d="M 40 60 L 70 25"
            stroke={`rgba(${accentRgb},0.95)`}
            strokeWidth="5.2"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 7px rgba(${accentRgb},0.48))` }}
          />
          <path
            d="M 60 60 L 30 25"
            stroke={`rgba(${accentRgb},0.95)`}
            strokeWidth="5.2"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 7px rgba(${accentRgb},0.48))` }}
          />
          <circle cx="50" cy="56" r="3" fill="rgba(248,250,252,0.86)" />
        </>
      )}

      <text
        x="50"
        y="86"
        textAnchor="middle"
        className="font-comodo"
        fontSize="7"
        letterSpacing="2"
        fill={`rgba(${accentRgb},0.78)`}
      >
        BRX
      </text>
    </svg>
  );
}

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

export function ArenaCardBack({ variant = 'hand' }: { variant?: 'hand' | 'duel' }) {
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
      <div className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 rounded-full border border-white/20 bg-white/5 p-0.5">
        <MascotGlyph expression="neutral" accentRgb="255,255,255" className="h-full w-full" />
      </div>
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
  const strokeLabel = move.toUpperCase();

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border"
      style={{
        borderColor: `rgba(${meta.accentRgb},0.85)`,
        background:
          `radial-gradient(circle at 16% 12%, rgba(${meta.accentRgb},0.22), transparent 36%), ` +
          `radial-gradient(circle at 84% 88%, rgba(${meta.accentRgb},0.16), transparent 42%), ` +
          'linear-gradient(156deg, #0b0b0f 0%, #050508 36%, #111118 66%, #0a0a0f 100%)',
        boxShadow: `0 14px 48px rgba(${meta.accentRgb},0.38), inset 0 1px 0 rgba(${meta.accentRgb},0.28), inset 0 0 0 1px rgba(255,255,255,0.05)`,
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(105deg, transparent 26%, rgba(${meta.accentRgb},0.2) 44%, rgba(255,255,255,0.45) 50%, rgba(${meta.accentRgb},0.2) 56%, transparent 74%)`,
          backgroundSize: '240% 100%',
        }}
        animate={{ backgroundPosition: ['220% 0', '-220% 0'] }}
        transition={{ duration: isDuel ? 2.2 : 2.6, ease: 'easeInOut', repeat: Infinity }}
      />

      <div className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/10" />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: isDuel ? 92 : 56,
          height: isDuel ? 92 : 56,
          background: `radial-gradient(circle, rgba(${meta.accentRgb},0.2) 0%, transparent 72%)`,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.66, 1, 0.66] }}
        transition={{ duration: isDuel ? 2.1 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <span
        className={`pointer-events-none absolute top-3 font-comodo font-black tracking-[0.12em] text-white/55 ${isDuel ? 'text-lg' : 'text-[11px]'}`}
        style={{ textShadow: `0 0 12px rgba(${meta.accentRgb},0.8)` }}
      >
        {strokeLabel}
      </span>

      <MoveSymbolGlyph
        move={move}
        accentRgb={meta.accentRgb}
        className={`${isDuel ? 'h-24 w-24' : 'h-14 w-14 sm:h-16 sm:w-16'}`}
      />

      <span
        className={`mt-2 rounded-full border px-2.5 py-0.5 font-bold uppercase tracking-[0.2em] text-white ${
          isDuel ? 'text-[10px]' : 'text-[9px]'
        }`}
        style={{ borderColor: `rgba(${meta.accentRgb},0.88)`, background: `rgba(${meta.accentRgb},0.22)`, boxShadow: `0 0 18px rgba(${meta.accentRgb},0.32)` }}
      >
        {meta.label}
      </span>

      <span
        className={`pointer-events-none absolute bottom-2 font-comodo font-black tracking-[0.28em] text-white/70 ${isDuel ? 'text-[9px]' : 'text-[8px]'}`}
        style={{ textShadow: `0 0 10px rgba(${meta.accentRgb},0.68)` }}
      >
        BRX
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

export function HandMoveCard({
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
      animate={
        selected
          ? { opacity: 1, y: -5, scale: 1.05, rotate: 0 }
          : disabled
            ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
            : { opacity: 1, y: [0, -4, 0], scale: [1, 1.012, 1], rotate: [0, -0.8, 0.8, 0] }
      }
      transition={
        selected
          ? { duration: 0.2, ease: 'easeOut' }
          : disabled
            ? { duration: 0.2 }
            : {
                opacity: { duration: 0.2 },
                y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
              }
      }
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

export function DuelCard({
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
          scale: state === 'winner' ? [1, 1.08, 1.05] : state === 'draw' ? [1, 1.02, 1] : 1,
          opacity: state === 'loser' ? 0.55 : 1,
          x: state === 'loser' ? [0, -4, 4, -3, 3, 0] : 0,
          y: state === 'winner' ? [0, -8, 0] : 0,
          rotateZ: state === 'winner' ? 1.5 : state === 'loser' ? -1.5 : 0,
        }}
        transition={{
          rotateY: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.4, ease: 'easeOut' },
          opacity: { duration: 0.3 },
          x: { duration: 0.4, ease: 'easeInOut' },
          y: { duration: 0.44, ease: 'easeOut' },
          rotateZ: { duration: 0.3, ease: 'easeOut' },
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
  const [shatterPulse, setShatterPulse] = useState(0);

  const timeoutRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new window.AudioContext();
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const playEmoteSfx = useCallback(
    async (type: EmoteType) => {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      master.connect(ctx.destination);

      const playTone = (opts: {
        freq: number;
        dur: number;
        wave: OscillatorType;
        gain?: number;
        start?: number;
        detune?: number;
      }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const start = opts.start ?? 0;
        const gain = opts.gain ?? 0.08;
        const detune = opts.detune ?? 0;

        osc.type = opts.wave;
        osc.frequency.setValueAtTime(opts.freq, now + start);
        if (detune !== 0) {
          osc.detune.setValueAtTime(detune, now + start);
        }

        gainNode.gain.setValueAtTime(0.0001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + opts.dur);

        osc.connect(gainNode);
        gainNode.connect(master);

        osc.start(now + start);
        osc.stop(now + start + opts.dur + 0.03);
      };

      if (type === 'smug') {
        playTone({ freq: 420, dur: 0.12, wave: 'triangle', gain: 0.07 });
        playTone({ freq: 620, dur: 0.16, wave: 'sine', gain: 0.09, start: 0.09 });
      } else if (type === 'panic') {
        playTone({ freq: 860, dur: 0.08, wave: 'square', gain: 0.07, detune: -14 });
        playTone({ freq: 790, dur: 0.08, wave: 'square', gain: 0.065, start: 0.09, detune: 12 });
        playTone({ freq: 920, dur: 0.1, wave: 'triangle', gain: 0.06, start: 0.18 });
      } else {
        playTone({ freq: 250, dur: 0.14, wave: 'sawtooth', gain: 0.075 });
        playTone({ freq: 330, dur: 0.16, wave: 'triangle', gain: 0.08, start: 0.1 });
        playTone({ freq: 440, dur: 0.18, wave: 'sine', gain: 0.085, start: 0.18 });
      }
    },
    [ensureAudioContext]
  );

  const playCardDestroySfx = useCallback(async () => {
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
    master.connect(ctx.destination);

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(190, now);
    body.frequency.exponentialRampToValueAtTime(62, now + 0.24);
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.29);
    body.connect(bodyGain);
    bodyGain.connect(master);
    body.start(now);
    body.stop(now + 0.33);

    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(1160, now + 0.016);
    crack.frequency.exponentialRampToValueAtTime(360, now + 0.16);
    crackGain.gain.setValueAtTime(0.0001, now + 0.012);
    crackGain.gain.exponentialRampToValueAtTime(0.12, now + 0.022);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
    crack.connect(crackGain);
    crackGain.connect(master);
    crack.start(now + 0.012);
    crack.stop(now + 0.24);

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.28), ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1200, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.17, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    noise.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now + 0.014);
    noise.stop(now + 0.3);
  }, [ensureAudioContext]);

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
        void playCardDestroySfx();
        setShatterPulse((prev) => prev + 1);
      }, 1680);

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
      playCardDestroySfx,
      startDealing,
      stopCountdown,
    ]
  );

  const triggerEmote = useCallback(
    (type: EmoteType) => {
      const emote = EMOTES[type];
      const id = Date.now();

      void playEmoteSfx(type);

      setActiveEmote({
        id,
        emote: type,
        tone: emote.tone,
      });

      // TODO: Emetti evento socket 'player_emote' qui.

      queueTimeout(() => {
        setActiveEmote((prev) => (prev?.id === id ? null : prev));
      }, 1200);
    },
    [playEmoteSfx, queueTimeout]
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

      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    },
    [clearQueuedTimeouts, stopCountdown]
  );

  const timerSeconds = Math.ceil(countdownMs / 1000);
  const progressPct = Math.max(0, (countdownMs / TURN_DURATION_MS) * 100);
  const isCountdownCritical = progressPct < 34;

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

  const activeEmoteAnimate =
    activeEmote?.emote === 'panic'
      ? { opacity: 1, y: [-48, -50, -48], x: [0, -4, 4, -3, 3, 0], scale: [1, 1.06, 1], rotate: [0, -3, 3, -2, 2, 0] }
      : activeEmote?.emote === 'smug'
        ? { opacity: 1, y: [-48, -56, -48], x: [0, 5, 0], scale: [1, 1.06, 1], rotate: [0, 5, 0] }
        : { opacity: 1, y: [-48, -54, -48], x: [0, 0, 0], scale: [1, 1.12, 1], rotate: [0, -1, 1, 0] };

  const activeEmoteTransition =
    activeEmote?.emote === 'panic'
      ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const }
      : activeEmote?.emote === 'smug'
        ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' as const }
        : { duration: 0.65, repeat: Infinity, ease: 'easeInOut' as const };

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
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          />

          <motion.div
            className="relative mx-auto mt-[2dvh] h-[96dvh] w-[98vw] overflow-hidden rounded-xl border border-white/15 bg-[#090909] text-white shadow-[0_18px_70px_rgba(0,0,0,0.55)] sm:mt-[3dvh] sm:h-[94dvh] sm:w-[96vw] sm:rounded-2xl lg:mt-[4dvh] lg:h-[92dvh] lg:w-[min(96vw,1240px)]"
            style={{ transformPerspective: 1200, transformOrigin: '50% 20%' }}
            initial={{ y: 36, opacity: 0, scale: 0.94, rotateX: 7 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ y: 24, opacity: 0, scale: 0.98, rotateX: 4 }}
            transition={{
              opacity: { duration: 0.2, ease: 'easeOut' },
              y: { type: 'spring', stiffness: 320, damping: 28, mass: 0.85 },
              scale: { type: 'spring', stiffness: 260, damping: 24, mass: 0.9 },
              rotateX: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
            }}
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

            <div className="relative z-10 grid h-[calc(100%-57px)] grid-rows-[auto_1fr_auto]">
              <section className="border-b border-white/10 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-rose-300/40 bg-gradient-to-br from-rose-500/25 to-fuchsia-500/15 p-1">
                      <MascotGlyph expression="smug" accentRgb="244,114,182" className="h-full w-full" />
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

              <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-4 sm:px-6">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-[280px] w-[min(90%,620px)] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-orange-300/20 bg-[radial-gradient(ellipse_at_center,rgba(255,115,0,0.16),transparent_70%)]" />
                  <div className="absolute left-1/2 top-1/2 h-[220px] w-[min(80%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-cyan-300/20 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12),transparent_72%)]" />
                </div>
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
                      {[0, 1, 2, 3, 4].map((idx) => {
                        const radius = 34 + idx * 6;
                        return (
                          <motion.div
                            key={`arena-shuffle-${idx}`}
                            className="absolute h-20 w-16"
                            animate={{
                              x: [0, radius, 0, -radius, 0],
                              y: [-radius * 0.24, 0, radius * 0.24, 0, -radius * 0.24],
                              rotate: [idx * 12, idx * 12 + 75, idx * 12 + 160, idx * 12 + 250, idx * 12 + 340],
                              opacity: [0.2, 0.75, 0.65, 0.75, 0.2],
                            }}
                            transition={{ duration: 1.15, repeat: Infinity, ease: 'linear', delay: idx * 0.06 }}
                          >
                            <ArenaCardBack />
                          </motion.div>
                        );
                      })}

                      <motion.div
                        className="h-32 w-24"
                        animate={{ rotate: [-3, 3, -2, 2, 0], y: [0, -5, 0], scale: [1, 1.03, 1] }}
                        transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArenaCardBack />
                      </motion.div>

                      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full border border-orange-300/35 bg-orange-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-200/90">
                        Mischia in corso
                      </div>

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
                            {TURN_DURATION_SECONDS} secondi
                          </p>
                        </div>

                        <motion.div
                          className="mt-3 flex items-end gap-3"
                          animate={isCountdownCritical ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }}
                          transition={isCountdownCritical ? { duration: 0.34, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                        >
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={timerSeconds}
                              initial={{ y: 6, opacity: 0 }}
                              animate={{ y: 0, opacity: 1, scale: isCountdownCritical ? [1, 1.08, 1] : 1 }}
                              exit={{ y: -6, opacity: 0 }}
                              transition={{ scale: { duration: 0.55, repeat: isCountdownCritical ? Infinity : 0, ease: 'easeInOut' } }}
                              className="text-4xl font-black leading-none text-white sm:text-5xl"
                            >
                              {timerSeconds}
                            </motion.span>
                          </AnimatePresence>
                          <span className="pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                            tempo residuo
                          </span>
                        </motion.div>

                        <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={`relative h-full ${
                              progressPct < 34
                                ? 'bg-gradient-to-r from-red-500 to-orange-400'
                                : progressPct < 67
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                  : 'bg-gradient-to-r from-emerald-400 to-amber-400'
                            }`}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ ease: 'linear', duration: 0.08 }}
                          >
                            <motion.div
                              className="absolute inset-y-0 w-12 bg-white/30 blur-[1px]"
                              animate={{ x: ['-130%', '220%'] }}
                              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                            />
                          </motion.div>
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
                      <div className="relative flex w-full items-center justify-center gap-4 sm:gap-8">
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

                        <AnimatePresence mode="wait">
                          {revealed && (
                            <motion.div
                              key={`arena-shatter-${shatterPulse}`}
                              className="pointer-events-none absolute inset-0"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {Array.from({ length: 16 }).map((_, idx) => {
                                const angle = (idx / 16) * Math.PI * 2;
                                const distance = 70 + (idx % 5) * 13;
                                const targetX = Math.cos(angle) * distance;
                                const targetY = Math.sin(angle) * distance;
                                return (
                                  <motion.div
                                    key={`arena-fragment-${idx}`}
                                    className="absolute left-1/2 top-1/2 h-2.5 w-6 rounded-[4px] border border-orange-100/70 bg-gradient-to-r from-orange-200/80 to-cyan-200/70"
                                    initial={{ x: 0, y: 0, rotate: 0, opacity: 0.95, scale: 1 }}
                                    animate={{
                                      x: targetX,
                                      y: targetY,
                                      rotate: idx % 2 === 0 ? 140 : -140,
                                      opacity: 0,
                                      scale: 0.22,
                                    }}
                                    transition={{ duration: 0.42, ease: 'easeOut', delay: idx * 0.012 }}
                                  />
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-orange-300/50 bg-gradient-to-br from-orange-500/25 to-amber-500/20 p-1">
                      <MascotGlyph expression="challenge" accentRgb="255,115,0" className="h-full w-full" />

                      <AnimatePresence>
                        {activeEmote && (
                          <motion.div
                            key={activeEmote.id}
                            initial={{ opacity: 0, y: 8, scale: 0.65 }}
                            animate={activeEmoteAnimate}
                            transition={activeEmoteTransition}
                            exit={{ opacity: 0, y: -72, scale: 0.8 }}
                            className={`pointer-events-none absolute left-1/2 top-0 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br ${activeEmote.tone} shadow-[0_8px_20px_rgba(0,0,0,0.35)]`}
                          >
                            <MascotGlyph
                              expression={EMOTE_EXPRESSIONS[activeEmote.emote]}
                              accentRgb="255,255,255"
                              className="h-[38px] w-[38px]"
                            />
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
                      <motion.button
                        key={type}
                        type="button"
                        title={EMOTES[type].label}
                        onClick={() => triggerEmote(type)}
                        whileHover={
                          type === 'panic'
                            ? { scale: 1.07, x: [0, -2, 2, -1, 1, 0] }
                            : type === 'smug'
                              ? { scale: 1.08, y: -2, rotate: -4 }
                              : { scale: 1.1, y: -1 }
                        }
                        whileTap={{ scale: 0.94 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br ${EMOTES[type].tone} p-1 transition hover:scale-110 hover:border-white/50`}
                      >
                        <MascotGlyph
                          expression={EMOTE_EXPRESSIONS[type]}
                          accentRgb="255,255,255"
                          className="h-full w-full"
                        />
                        <span className="sr-only">{EMOTES[type].label}</span>
                      </motion.button>
                    ))}
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

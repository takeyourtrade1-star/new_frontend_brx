'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { X, Send, Camera, ImageIcon, FileText, Bug, CheckCircle2, HelpCircle, MessageSquare, ArrowRight, Sparkles, Loader2, Play, Users, Shirt } from 'lucide-react';
import html2canvas from 'html2canvas';
import { CardLoader } from '@/components/dev/CardLoader';
import { KakeguruiArena } from '@/components/feature/game/KakeguruiArena';
import { KakeguruiP2P } from '@/components/feature/game/KakeguruiP2P';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  ACCESSORY_ITEMS,
  ALL_WARDROBE_ITEMS,
  CLOTHING_ITEMS,
  DEFAULT_FACE_COLOR_ID,
  FACE_COLOR_OPTIONS,
  OBJECT_ITEMS,
  getItemRenderClassName,
  getItemOverlayStyle,
  getItemRenderEnhancementStyle,
  type Category,
  type EquippedItems,
  type FaceColorId,
  type WardrobeItem,
} from './mascotte-wardrobe';

// Storage keys for bug report data
const BUG_REPORT_STORAGE = {
  SCREENSHOT: 'brx_bug_screenshot',
  CONSOLE_LOGS: 'brx_bug_console_logs',
  CATEGORY: 'brx_bug_category',
  TIMESTAMP: 'brx_bug_timestamp',
};

const Z_INDEX = {
  mascotteBase: 9999,
  modal: 10000,
  mascotteOverlay: 10002,
  tooltip: 10003,
  screenshotPreview: 99998,
  flash: 99999,
} as const;

const EXPRESSION_TRANSITION_MS = 140;
const CODING_PREVIEW_MS = 900;
const SUBMIT_FEEDBACK_MS = 1400;
const BUG_MODAL_FADE_MS = 220;
const MATCHMAKING_GUEST_KEY = 'brx_kakegurui_guest_id';
const WARDROBE_STORAGE_KEY = 'brx_mascotte_wardrobe_v1';

function isValidFaceColorId(value: unknown): value is FaceColorId {
  return typeof value === 'string' && FACE_COLOR_OPTIONS.some((option) => option.id === value);
}

interface MatchmakingPayload {
  status: 'waiting' | 'matched' | 'not_found';
  ticketId: string;
  queueSize?: number;
  matchId?: string;
  opponent?: {
    userId: string;
    username: string;
  };
}

// Console log capture
interface ConsoleLog {
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: number;
}

let capturedLogs: ConsoleLog[] = [];
let originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};
let isConsoleCaptureActive = false;

// Patterns to exclude from bug report logs (internal debug noise)
const EXCLUDED_LOG_PATTERNS = [
  /Found pupils/i,
  /👁️/,
  /Mouse tracking effect mounted/i,
  /faceContainerRef is null/i,
  /cardRef is null/i,
  /Mousemove listener/i,
];

function shouldExcludeLog(message: string): boolean {
  return EXCLUDED_LOG_PATTERNS.some(pattern => pattern.test(message));
}

function safeSerializeArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }

  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return '[unserializable object]';
    }
  }

  return String(arg);
}

function serializeArgs(args: unknown[]): string {
  const message = args.map(safeSerializeArg).join(' ');
  return message.length > 1200 ? `${message.slice(0, 1200)}...[truncated]` : message;
}

function startConsoleCapture() {
  if (isConsoleCaptureActive) return;
  isConsoleCaptureActive = true;
  capturedLogs = [];
  const MAX_LOGS = 200;

  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    const message = serializeArgs(args);
    if (shouldExcludeLog(message)) return;
    capturedLogs.push({
      type: 'log',
      message,
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    const message = serializeArgs(args);
    if (shouldExcludeLog(message)) return;
    capturedLogs.push({
      type: 'error',
      message,
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    const message = serializeArgs(args);
    if (shouldExcludeLog(message)) return;
    capturedLogs.push({
      type: 'warn',
      message,
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };
}

function stopConsoleCapture() {
  if (!isConsoleCaptureActive) return;
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  isConsoleCaptureActive = false;
}

function getRecentLogs(seconds: number = 60): ConsoleLog[] {
  const cutoff = Date.now() - (seconds * 1000);
  return capturedLogs.filter(log => log.timestamp >= cutoff);
}

function inferBugCategory(url: string): string {
  const path = url.toLowerCase();
  if (path.includes('/account') || path.includes('/login') || path.includes('/register')) return 'account';
  if (path.includes('/search') || path.includes('/product') || path.includes('/carta')) return 'search';
  if (path.includes('/cart') || path.includes('/checkout')) return 'payment';
  if (path.includes('/auction') || path.includes('/asta')) return 'auction';
  if (path.includes('/acquisti') || path.includes('/ordini')) return 'orders';
  if (path.includes('/vendi') || path.includes('/inventory')) return 'selling';
  if (path.includes('/messaggi') || path.includes('/chat')) return 'messaging';
  if (path.includes('/games')) return 'games';
  return 'functional';
}

const faceSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: light stroke behind (thicker) -->
  <circle class="face-halo" cx="35" cy="39" r="11.5" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-halo" cx="65" cy="39" r="11.5" stroke="#faf9f6" stroke-width="3.5"/>
  <!-- Eyes: dark stroke on top -->
  <circle class="face-line" cx="35" cy="39" r="11.5" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="face-line" cx="65" cy="39" r="11.5" stroke="#4a5548" stroke-width="2.5"/>
  <!-- Pupils and highlights -->
  <circle class="pupil" cx="35" cy="40" r="5.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="32.3" cy="36.4" r="2.2" fill="#faf9f6" stroke="none"/>
  <circle class="pupil" cx="65" cy="40" r="5.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="62.3" cy="36.4" r="2.2" fill="#faf9f6" stroke="none"/>
  <!-- Mouth: light stroke behind -->
  <path class="face-halo" d="M 34 63 Q 50 77 66 63" stroke="#faf9f6" stroke-width="4.2" fill="none"/>
  <!-- Mouth: dark stroke on top -->
  <path class="face-line" d="M 34 63 Q 50 77 66 63" stroke="#4a5548" stroke-width="3.2" fill="none"/>
</svg>`;

const faceBugReportSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: light stroke behind -->
  <circle class="face-halo" cx="34" cy="40" r="10" stroke="#faf9f6" stroke-width="3.2"/>
  <circle class="face-halo" cx="66" cy="40" r="10" stroke="#faf9f6" stroke-width="3.2"/>
  <!-- Eyes: dark stroke on top -->
  <circle class="face-line" cx="34" cy="40" r="10" stroke="#4a5548" stroke-width="2.2"/>
  <circle class="face-line" cx="66" cy="40" r="10" stroke="#4a5548" stroke-width="2.2"/>
  <!-- Pupils and highlights -->
  <circle class="pupil" cx="34" cy="41" r="4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="31.6" cy="37.2" r="1.5" fill="#faf9f6" stroke="none"/>
  <circle class="pupil" cx="66" cy="41" r="4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="63.6" cy="37.2" r="1.5" fill="#faf9f6" stroke="none"/>
  <!-- Monitor frame -->
  <rect x="20" y="29" width="60" height="23" rx="4.5" stroke-width="2.1" fill="none" stroke="#faf9f6"/>
  <line x1="50" y1="33" x2="50" y2="48" stroke-width="1.7" stroke="#faf9f6"/>
  <line x1="20" y1="41" x2="16" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <line x1="80" y1="41" x2="84" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <path class="bug-glint bug-glint-1" d="M 28 34 L 34 31" stroke="#faf9f6" stroke-width="1.4"/>
  <path class="bug-glint bug-glint-2" d="M 62 35 L 68 32" stroke="#faf9f6" stroke-width="1.4"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo bug-mouth" d="M 44 65 Q 50 69 56 65" stroke="#faf9f6" stroke-width="3.8" fill="none"/>
  <path class="face-line bug-mouth" d="M 44 65 Q 50 69 56 65" stroke="#4a5548" stroke-width="2.8" fill="none"/>
</svg>`;

const faceBugFocusSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Narrowed (squint) eye outlines: light behind -->
  <ellipse class="face-halo" cx="34" cy="40" rx="10" ry="6.2" stroke="#faf9f6" stroke-width="3.2"/>
  <ellipse class="face-halo" cx="66" cy="40" rx="10" ry="6.2" stroke="#faf9f6" stroke-width="3.2"/>
  <!-- Eyes: dark on top -->
  <ellipse class="face-line" cx="34" cy="40" rx="10" ry="6.2" stroke="#4a5548" stroke-width="2.2"/>
  <circle class="pupil" cx="34" cy="40.2" r="3.4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="31.9" cy="37.7" r="1.2" fill="#faf9f6" stroke="none"/>
  <ellipse class="face-line" cx="66" cy="40" rx="10" ry="6.2" stroke="#4a5548" stroke-width="2.2"/>
  <circle class="pupil" cx="66" cy="40.2" r="3.4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="63.9" cy="37.7" r="1.2" fill="#faf9f6" stroke="none"/>
  <rect x="20" y="29" width="60" height="23" rx="4.5" stroke-width="2.1" fill="none" stroke="#faf9f6"/>
  <line x1="50" y1="33" x2="50" y2="48" stroke-width="1.7" stroke="#faf9f6"/>
  <line x1="20" y1="41" x2="16" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <line x1="80" y1="41" x2="84" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <path class="bug-glint bug-glint-1" d="M 28 34 L 34 31" stroke="#faf9f6" stroke-width="1.4"/>
  <path class="bug-glint bug-glint-2" d="M 62 35 L 68 32" stroke="#faf9f6" stroke-width="1.4"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo bug-mouth" d="M 45 65 Q 50 67.5 55 65" stroke="#faf9f6" stroke-width="3.7" fill="none"/>
  <path class="face-line bug-mouth" d="M 45 65 Q 50 67.5 55 65" stroke="#4a5548" stroke-width="2.7" fill="none"/>
</svg>`;

const faceWinkSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Wink eye: light behind, dark on top -->
  <path class="face-halo" d="M 24 40 Q 34 32 44 40" stroke="#faf9f6" stroke-width="4.4"/>
  <path class="face-line" d="M 24 40 Q 34 32 44 40" stroke="#4a5548" stroke-width="3.4"/>
  <!-- Open eye: light behind -->
  <circle class="face-halo" cx="67" cy="39" r="11.2" stroke="#faf9f6" stroke-width="3.5"/>
  <!-- Open eye: dark on top -->
  <circle class="face-line" cx="67" cy="39" r="11.2" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="pupil" cx="67" cy="40" r="5.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="64.4" cy="36.4" r="2.1" fill="#faf9f6" stroke="none"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo" d="M 39 63 Q 54 72 68 62" stroke="#faf9f6" stroke-width="4.2" fill="none"/>
  <path class="face-line" d="M 39 63 Q 54 72 68 62" stroke="#4a5548" stroke-width="3.2" fill="none"/>
</svg>`;

const faceCodingSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: light behind -->
  <circle class="face-halo" cx="35" cy="38" r="14" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-halo" cx="65" cy="38" r="14" stroke="#faf9f6" stroke-width="3.5"/>
  <!-- Eyes: dark on top -->
  <circle class="face-line" cx="35" cy="38" r="14" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="face-line" cx="65" cy="38" r="14" stroke="#4a5548" stroke-width="2.5"/>
  <!-- Pupils -->
  <circle class="pupil" cx="35" cy="38.6" r="3.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil" cx="65" cy="38.6" r="3.6" fill="#4a5548" stroke="none"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo coding-mouth" d="M 36 66 Q 50 63.8 64 66" stroke="#faf9f6" stroke-width="4" fill="none"/>
  <path class="face-line coding-mouth" d="M 36 66 Q 50 63.8 64 66" stroke="#4a5548" stroke-width="3" fill="none"/>
  <!-- Glasses/monitor frame -->
  <rect x="20" y="24" width="60" height="28" rx="3" stroke-width="2.5" fill="none" stroke="#faf9f6"/>
  <line x1="50" y1="24" x2="50" y2="52" stroke-width="2" stroke="#faf9f6"/>
</svg>`;

const faceSleepSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Closed eyes: light behind, dark on top -->
  <path class="face-halo" d="M 24 40 Q 34 48 44 40" stroke="#faf9f6" stroke-width="3.8" fill="none"/>
  <path class="face-halo" d="M 56 40 Q 66 48 76 40" stroke="#faf9f6" stroke-width="3.8" fill="none"/>
  <path class="face-line" d="M 24 40 Q 34 48 44 40" stroke="#4a5548" stroke-width="2.8" fill="none"/>
  <path class="face-line" d="M 56 40 Q 66 48 76 40" stroke="#4a5548" stroke-width="2.8" fill="none"/>
  <!-- Small sleepy mouth -->
  <ellipse cx="50" cy="68" rx="3" ry="2" fill="#faf9f6" stroke="none"/>
  <!-- Gentle blush marks -->
  <ellipse cx="22" cy="52" rx="5" ry="3" fill="#ff9999" stroke="none" opacity="0.4"/>
  <ellipse cx="78" cy="52" rx="5" ry="3" fill="#ff9999" stroke="none" opacity="0.4"/>
</svg>`;

const faceShockedSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: huge shocked circles -->
  <circle class="face-halo" cx="35" cy="38" r="13" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-halo" cx="65" cy="38" r="13" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-line" cx="35" cy="38" r="13" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="face-line" cx="65" cy="38" r="13" stroke="#4a5548" stroke-width="2.5"/>
  <!-- Pupils: tiny for shock -->
  <circle class="pupil" cx="35" cy="38" r="3.5" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="32.5" cy="35.5" r="1.8" fill="#faf9f6" stroke="none"/>
  <circle class="pupil" cx="65" cy="38" r="3.5" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="62.5" cy="35.5" r="1.8" fill="#faf9f6" stroke="none"/>
  <!-- Mouth: O shape -->
  <ellipse class="face-halo" cx="50" cy="68" rx="10" ry="9" stroke="#faf9f6" stroke-width="4" fill="none"/>
  <ellipse class="face-line" cx="50" cy="68" rx="10" ry="9" stroke="#4a5548" stroke-width="3" fill="none"/>
  <!-- Inner mouth depth -->
  <ellipse cx="50" cy="68" rx="6" ry="5.5" fill="#4a5548" stroke="none" opacity="0.12"/>
</svg>`;

export function CardMascotte() {
  const authUser = useAuthStore((s) => s.user);

  // Safe mount check
  const [isMounted, setIsMounted] = useState(false);
  const [hasError] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Check if user has interacted with Asso before
    try {
      const hasSeenBefore = localStorage.getItem('brx_asso_interacted');
      setHasInteractedBefore(!!hasSeenBefore);
    } catch {
      // localStorage not available
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [hasConsoleLogs, setHasConsoleLogs] = useState(false);
  
  // Flash animation state for screenshot
  const [showFlash, setShowFlash] = useState(false);
  
  // Screenshot preview thumbnail state
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(false);

  // Chat flow state
  const [chatStep, setChatStep] = useState<'greeting' | 'menu' | 'bug' | 'contact'>('greeting');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'asso' | 'user', text: string}>>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // First interaction tracking for personalized greetings
  const [hasInteractedBefore, setHasInteractedBefore] = useState(false);
  
  // Typewriter effect state
  const [typewriterText, setTypewriterText] = useState('');
  const [isTypewriting, setIsTypewriting] = useState(false);
  const typewriterTimeoutRef = useRef<number | null>(null);
  const greetingTimeoutRef = useRef<number | null>(null);
  const typewriterSequenceRef = useRef(0);
  const [isCodingTransition, setIsCodingTransition] = useState(false);
  const [showCodingCompanion, setShowCodingCompanion] = useState(false);
  const [codingStatus, setCodingStatus] = useState<'compiling' | 'received'>('compiling');
  const [isBugFormFocused, setIsBugFormFocused] = useState(false);

  // Hint bubble visibility + message rotation
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [promoHintIndex, setPromoHintIndex] = useState(0);
  const [styleReactionText, setStyleReactionText] = useState<string | null>(null);
  const [showStyleReaction, setShowStyleReaction] = useState(false);
  const styleReactionHideTimeoutRef = useRef<number | null>(null);
  const styleReactionClearTimeoutRef = useRef<number | null>(null);
  const styleReactionLastIndexRef = useRef<number>(-1);
  const pendingStyleReactionSourceRef = useRef<'outfit' | 'color' | null>(null);
  const wardrobeDoneTimeoutRef = useRef<number | null>(null);

  // Mascotte expression state
  const [mascotteExpression, setMascotteExpression] = useState<'normal' | 'bugReport' | 'bugFocus' | 'wink' | 'coding' | 'sleeping' | 'shocked'>('normal');

  // Sleep mode state - triggered after 15s of mouse inactivity
  const [isSleeping, setIsSleeping] = useState(false);
  const isSleepingRef = useRef(false); // Ref to track sleeping state without re-triggering effect
  const sleepPromoIntervalRef = useRef<number | null>(null); // For cycling promos during sleep
  const [isSleepMuted, setIsSleepMuted] = useState(() => {
    // Load mute preference from localStorage
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('brx_asso_sleep_muted') === 'true';
      } catch { return false; }
    }
    return false;
  });
  // Sleep hours tracking
  const [totalSleepMs, setTotalSleepMs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return parseInt(localStorage.getItem('brx_asso_sleep_ms') || '0', 10) || 0;
      } catch { return 0; }
    }
    return 0;
  });
  const sleepStartTimeRef = useRef<number | null>(null);
  const sleepTimeoutRef = useRef<number | null>(null);
  const snoreOscillatorRef = useRef<OscillatorNode | null>(null);
  const snoreGainRef = useRef<GainNode | null>(null);
  const SLEEP_DELAY_MS = 15000; // 15 seconds

  // Sync isSleeping ref with state
  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  // Bug form state - complete form with all fields
  const [bugForm, setBugForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    bugType: 'functional',
    priority: 'medium',
    url: '',
  });
  const [showConsoleLogs, setShowConsoleLogs] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const faceContainerRef = useRef<HTMLDivElement>(null);
  const expressionTimeoutRef = useRef<number | null>(null);
  const codingTransitionTimeoutRef = useRef<number | null>(null);
  const submitFeedbackTimeoutRef = useRef<number | null>(null);

  // ── Card flip (swipe gamification) ──
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [flipParticles, setFlipParticles] = useState<Array<{ id: number; x: number; y: number; dx: number; dy: number; size: number; color: string }>>([]);
  const [dressingSparkles, setDressingSparkles] = useState<Array<{ id: number; left: number; top: number; delay: number; size: number; color: string }>>([]);
  const dressingSparklesTimeoutRef = useRef<number | null>(null);
  const [backVariant, setBackVariant] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [newUnlock, setNewUnlock] = useState<string | null>(null);
  const [showAlbum, setShowAlbum] = useState(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [wardrobeCategory, setWardrobeCategory] = useState<Category>('clothing');
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({
    clothing: null,
    accessories: [],
    objects: [],
    faceColor: DEFAULT_FACE_COLOR_ID,
  });
  const [isArenaOpen, setIsArenaOpen] = useState(false);
  const [isP2POpen, setIsP2POpen] = useState(false);
  const [showGameModeMenu, setShowGameModeMenu] = useState(false);
  const [isCheckingArenaPlayers, setIsCheckingArenaPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState<number | null>(null);
  const [arenaGateMessage, setArenaGateMessage] = useState<string | null>(null);
  const [arenaOpponentName, setArenaOpponentName] = useState('Rivale Live');
  const [arenaMatchId, setArenaMatchId] = useState<string | null>(null);
  const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [goldenConfetti, setGoldenConfetti] = useState<Array<{ id: number; x: number; delay: number; size: number; rotation: number; duration: number; color: string }>>([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isShiny, setIsShiny] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const shinyTimeoutRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const achievementTimeoutRef = useRef<number | null>(null);
  const comboTimeoutRef = useRef<number | null>(null);
  const unlockTimeoutRef = useRef<number | null>(null);
  const particleIdRef = useRef(0);
  const lastFlipTimeRef = useRef(0);
  const backFaceRef = useRef<HTMLDivElement>(null);
  const gameModeMenuRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number; left: number} | null>(null);
  const matchmakingTicketRef = useRef<string | null>(null);
  const matchmakingPollRef = useRef<number | null>(null);

  const closeMascottePanels = useCallback(() => {
    setShowAlbum(false);
    setIsWardrobeOpen(false);
    setShowGameModeMenu(false);
    setMenuPosition(null);
    setShowChatModal(false);
    setIsModalOpen(false);
    setIsArenaOpen(false);
    setIsP2POpen(false);
    setIsCheckingArenaPlayers(false);
    setIsFlipped(false);
  }, []);

  // Close game mode menu when clicking outside
  useEffect(() => {
    if (!showGameModeMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (gameModeMenuRef.current && !gameModeMenuRef.current.contains(event.target as Node)) {
        setShowGameModeMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGameModeMenu]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WARDROBE_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as EquippedItems;
      setEquippedItems({
        clothing: typeof parsed?.clothing === 'string' ? parsed.clothing : null,
        accessories: Array.isArray(parsed?.accessories) ? parsed.accessories.filter(Boolean) : [],
        objects: Array.isArray(parsed?.objects) ? parsed.objects.filter(Boolean) : [],
        faceColor: isValidFaceColorId(parsed?.faceColor) ? parsed.faceColor : DEFAULT_FACE_COLOR_ID,
      });
    } catch {
      // Ignore invalid stored wardrobe payloads.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(equippedItems));
    } catch {
      // Ignore write errors in restricted browsing modes.
    }
  }, [equippedItems]);

  // Force shocked expression when cigar-xl is equipped (mouth becomes O)
  useEffect(() => {
    const hasCigar = equippedItems.accessories.includes('cigar-xl');
    if (hasCigar) {
      setMascotteExpression('shocked');
    } else if (mascotteExpression === 'shocked') {
      setMascotteExpression('normal');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedItems.accessories]);

  useEffect(() => {
    if (!isWardrobeOpen) {
      pendingStyleReactionSourceRef.current = null;
    }
  }, [isWardrobeOpen]);

  const wardrobeItemsById = useMemo(() => new Map(ALL_WARDROBE_ITEMS.map((item) => [item.id, item])), []);

  const equippedWardrobeItems = useMemo(() => {
    const items: WardrobeItem[] = [];

    if (equippedItems.clothing) {
      const clothing = wardrobeItemsById.get(equippedItems.clothing);
      if (clothing) items.push(clothing);
    }

    for (const id of equippedItems.accessories) {
      const item = wardrobeItemsById.get(id);
      if (item) items.push(item);
    }

    for (const id of equippedItems.objects) {
      const item = wardrobeItemsById.get(id);
      if (item) items.push(item);
    }

    return items.sort((a, b) => a.zIndex - b.zIndex);
  }, [equippedItems, wardrobeItemsById]);

  const visibleWardrobeItems = useMemo(() => {
    if (wardrobeCategory === 'clothing') return CLOTHING_ITEMS;
    if (wardrobeCategory === 'accessories') return ACCESSORY_ITEMS;
    if (wardrobeCategory === 'color') return [];
    return OBJECT_ITEMS;
  }, [wardrobeCategory]);

  const wardrobeThumbById = useMemo(
    () =>
      new Map(
        ALL_WARDROBE_ITEMS.map((item) => [
          item.id,
          `data:image/svg+xml;utf8,${encodeURIComponent(item.svg)}`,
        ])
      ),
    []
  );

  const selectedFaceColor = useMemo(
    () => FACE_COLOR_OPTIONS.find((option) => option.id === equippedItems.faceColor) ?? FACE_COLOR_OPTIONS[0],
    [equippedItems.faceColor],
  );

  const isWardrobeItemEquipped = useCallback((item: WardrobeItem) => {
    if (item.category === 'clothing') return equippedItems.clothing === item.id;
    if (item.category === 'accessories') return equippedItems.accessories.includes(item.id);
    return equippedItems.objects.includes(item.id);
  }, [equippedItems]);

  const toggleWardrobeItem = useCallback((item: WardrobeItem) => {
    pendingStyleReactionSourceRef.current = 'outfit';
    setEquippedItems((prev) => {
      if (item.category === 'clothing') {
        return {
          ...prev,
          clothing: prev.clothing === item.id ? null : item.id,
        };
      }

      if (item.category === 'accessories') {
        const exists = prev.accessories.includes(item.id);
        return {
          ...prev,
          accessories: exists
            ? prev.accessories.filter((id) => id !== item.id)
            : [...prev.accessories, item.id],
        };
      }

      const exists = prev.objects.includes(item.id);
      if (exists) {
        return {
          ...prev,
          objects: prev.objects.filter((id) => id !== item.id),
        };
      }

      const nextObjects = [...prev.objects, item.id].slice(-2);
      return {
        ...prev,
        objects: nextObjects,
      };
    });
  }, []);

  const clearWardrobeItems = useCallback(() => {
    const hasAnyCustomization =
      equippedItems.clothing !== null ||
      equippedItems.accessories.length > 0 ||
      equippedItems.objects.length > 0 ||
      equippedItems.faceColor !== DEFAULT_FACE_COLOR_ID;

    if (!hasAnyCustomization) {
      return;
    }

    pendingStyleReactionSourceRef.current = 'outfit';
    setEquippedItems({
      clothing: null,
      accessories: [],
      objects: [],
      faceColor: DEFAULT_FACE_COLOR_ID,
    });
  }, [equippedItems]);

  const handleWardrobeDone = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const source = pendingStyleReactionSourceRef.current;
    pendingStyleReactionSourceRef.current = null;
    setIsWardrobeOpen(false);

    if (!source) return;

    if (wardrobeDoneTimeoutRef.current !== null) {
      window.clearTimeout(wardrobeDoneTimeoutRef.current);
    }

    wardrobeDoneTimeoutRef.current = window.setTimeout(() => {
      triggerStyleReaction(source);
      wardrobeDoneTimeoutRef.current = null;
    }, 180);
  };

  const vibrate = useCallback((pattern: number | number[]) => {
    try { navigator?.vibrate?.(pattern); } catch {}
  }, []);

  const FLIP_STORAGE_KEY = 'brx_mascotte_flips';
  const FLIP_UNLOCKS_KEY = 'brx_mascotte_unlocked';
  const COMBO_WINDOW_MS = 1200;

  // Back face variants with unlock thresholds
  const BACK_VARIANTS = useMemo(() => [
    { gradient: 'linear-gradient(145deg, #FF7300 0%, #FF9A40 50%, #FFB366 100%)', pattern: '45deg', label: 'ASSO', sub: 'Ebartex', unlock: 0 },
    { gradient: 'linear-gradient(145deg, #6366F1 0%, #818CF8 50%, #A5B4FC 100%)', pattern: '-45deg', label: 'RARO', sub: 'Collezionista', unlock: 5 },
    { gradient: 'linear-gradient(145deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)', pattern: '60deg', label: 'EPICO', sub: 'Leggendario', unlock: 15 },
    { gradient: 'linear-gradient(145deg, #F43F5E 0%, #FB7185 50%, #FDA4AF 100%)', pattern: '30deg', label: 'FOIL', sub: 'Edizione Speciale', unlock: 30 },
    { gradient: 'linear-gradient(145deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%)', pattern: '135deg', label: 'GOLD', sub: 'Ultra Raro', unlock: 50 },
  ], []);

  // Achievement thresholds
  const ACHIEVEMENTS: Record<number, string> = {
    1: 'Primo flip!',
    5: 'Curioso!',
    10: 'Collezionista',
    25: 'Esperto di carte',
    50: 'Maestro del flip',
    100: 'Leggenda BRX',
  };

  // Get current achievement title based on flip count
  const getCurrentTitle = useCallback((count: number): string => {
    const thresholds = [100, 50, 25, 10, 5, 1];
    for (const t of thresholds) {
      if (count >= t) return ACHIEVEMENTS[t];
    }
    return 'Principiante';
  }, []);

  // Load flip count from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FLIP_STORAGE_KEY);
      if (stored) setFlipCount(parseInt(stored, 10) || 0);
    } catch {}
  }, []);

  const playFlipSound = useCallback((combo: number) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;

      // Paper whisper: filtered white noise, gentle descending sweep, no thud
      const noiseDuration = 0.36;
      const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Bandpass centered high (paper rustle zone), narrow sweep
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, now);
      bandpass.frequency.exponentialRampToValueAtTime(900, now + 0.3);
      bandpass.Q.value = 0.45;

      // Highpass to cut any rumble (removes low-end "thud" feel)
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(400, now);
      highpass.Q.value = 0.5;

      // Soft lowpass ceiling
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(2600, now);
      lowpass.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      lowpass.Q.value = 0.4;

      // Very gentle envelope
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0, now);
      noiseG.gain.linearRampToValueAtTime(0.055, now + 0.045);
      noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      noise.connect(highpass);
      highpass.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseG);
      noiseG.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + noiseDuration);

      // Combo >= 2: Gentle sine bell reward (melodic, soft)
      if (combo >= 2) {
        const bell = ctx.createOscillator();
        const bellG = ctx.createGain();
        bell.connect(bellG); bellG.connect(ctx.destination);
        bell.type = 'sine';
        const bellPitch = 330 + combo * 40;
        bell.frequency.setValueAtTime(bellPitch, now + 0.08);
        bellG.gain.setValueAtTime(0, now + 0.08);
        bellG.gain.linearRampToValueAtTime(0.035, now + 0.1);
        bellG.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        bell.start(now + 0.08); bell.stop(now + 0.42);
      }
    } catch {}
  }, []);

  const playAchievementSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0, now + i * 0.1);
        g.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.35);
      });
    } catch {}
  }, []);

  const playUnlockSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = i < 3 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.45);
      });
    } catch {}
  }, []);

  const playFanfareSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = i < 4 ? 'sine' : 'triangle';
        const t = now + i * 0.1;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15, t + 0.03);
        g.gain.setValueAtTime(0.15, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.start(t); osc.stop(t + 0.55);
      });
      // Final chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        const t = now + 0.85;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
        osc.start(t); osc.stop(t + 1.3);
      });
    } catch {}
  }, []);

  const spawnGoldenConfetti = useCallback(() => {
    const colors = ['#FFD700', '#FFC107', '#FBBF24', '#F59E0B', '#D4AF37', '#FFE082', '#FFF8E1', '#FF7300'];
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 140 - 22,
      delay: Math.random() * 0.6,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      duration: 1.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setGoldenConfetti(pieces);
    setTimeout(() => setGoldenConfetti([]), 3500);
  }, []);

  const triggerEasterEgg = useCallback(() => {
    setEasterEggActive(true);
    playFanfareSound();
    spawnGoldenConfetti();
    setTimeout(() => setEasterEggActive(false), 2000);
  }, [playFanfareSound, spawnGoldenConfetti]);

  const playShinySound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      // Crystalline shimmer: descending then ascending harmonics
      [1318.5, 1174.7, 1046.5, 1174.7, 1318.5, 1568, 2093].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        const t = now + i * 0.06;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.start(t); osc.stop(t + 0.4);
      });
    } catch {}
  }, []);

  // Spawn particles — more particles for higher combos
  const spawnFlipParticles = useCallback((combo: number) => {
    const colors = ['#FF7300', '#FFB366', '#FDE68A', '#FF9A40', '#FBBF24', '#F43F5E', '#6366F1', '#10B981'];
    const count = Math.min(8 + combo * 3, 20);
    const newParticles = Array.from({ length: count }, (_, i) => {
      particleIdRef.current += 1;
      const rad = ((360 / count) * i + Math.random() * 30) * (Math.PI / 180);
      const dist = (40 + Math.random() * 20) * (1 + combo * 0.15);
      return {
        id: particleIdRef.current,
        x: 48 + (Math.random() - 0.5) * 20,
        y: 64 + (Math.random() - 0.5) * 20,
        dx: Math.cos(rad) * dist,
        dy: Math.sin(rad) * dist,
        size: combo >= 3 ? 8 : 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setFlipParticles(newParticles);
    setTimeout(() => setFlipParticles([]), 700);
  }, []);

  const doFlip = useCallback(() => {
    const now = Date.now();
    // Streak/combo detection
    let newCombo = 0;
    if (now - lastFlipTimeRef.current < COMBO_WINDOW_MS) {
      newCombo = comboCount + 1;
    }
    lastFlipTimeRef.current = now;
    setComboCount(newCombo);

    // Show combo badge if >= 2
    if (newCombo >= 2) {
      setShowCombo(true);
      if (comboTimeoutRef.current) window.clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = window.setTimeout(() => {
        setShowCombo(false);
        setComboCount(0);
        comboTimeoutRef.current = null;
      }, COMBO_WINDOW_MS + 300);
    }

    // Shiny roll: 5% chance
    const rolledShiny = Math.random() < 0.05;
    if (rolledShiny) {
      playShinySound();
      setIsShiny(true);
      if (shinyTimeoutRef.current) window.clearTimeout(shinyTimeoutRef.current);
      shinyTimeoutRef.current = window.setTimeout(() => {
        setIsShiny(false);
        shinyTimeoutRef.current = null;
      }, 3500);
    }

    playFlipSound(newCombo);
    vibrate(rolledShiny ? [50, 30, 50] : newCombo >= 2 ? [30, 15, 30] : 25);
    spawnFlipParticles(rolledShiny ? Math.max(newCombo, 4) : newCombo);

    const newCount = flipCount + 1;
    setFlipCount(newCount);
    try { localStorage.setItem(FLIP_STORAGE_KEY, String(newCount)); } catch {}

    // Pick random unlocked variant
    const available = BACK_VARIANTS.filter(v => newCount >= v.unlock);
    setBackVariant(BACK_VARIANTS.indexOf(available[Math.floor(Math.random() * available.length)]));
    setIsFlipping(true);
    setIsFlipped(prev => !prev);
    setTimeout(() => setIsFlipping(false), 650);

    // Check for newly unlocked variant
    const justUnlocked = BACK_VARIANTS.find(v => v.unlock === newCount);
    if (justUnlocked) {
      try {
        const prev = JSON.parse(localStorage.getItem(FLIP_UNLOCKS_KEY) || '[]') as number[];
        if (!prev.includes(justUnlocked.unlock)) {
          localStorage.setItem(FLIP_UNLOCKS_KEY, JSON.stringify([...prev, justUnlocked.unlock]));
          if (unlockTimeoutRef.current) window.clearTimeout(unlockTimeoutRef.current);
          playUnlockSound();
          setNewUnlock(justUnlocked.label);
          setBackVariant(BACK_VARIANTS.indexOf(justUnlocked));
          unlockTimeoutRef.current = window.setTimeout(() => {
            setNewUnlock(null);
            unlockTimeoutRef.current = null;
          }, 3000);
        }
      } catch {}
    }

    // Check achievements
    if (ACHIEVEMENTS[newCount]) {
      if (achievementTimeoutRef.current) window.clearTimeout(achievementTimeoutRef.current);
      playAchievementSound();
      setShowAchievement(ACHIEVEMENTS[newCount]);
      achievementTimeoutRef.current = window.setTimeout(() => {
        setShowAchievement(null);
        achievementTimeoutRef.current = null;
      }, 2500);
    }

    // Easter egg at 100 flips
    if (newCount === 100) {
      triggerEasterEgg();
    }
  }, [flipCount, comboCount, vibrate, spawnFlipParticles, playFlipSound, playShinySound, playAchievementSound, playUnlockSound, triggerEasterEgg, BACK_VARIANTS]);

  // Share achievement
  const handleShare = useCallback(async () => {
    vibrate(15);
    const title = getCurrentTitle(flipCount);
    const text = `Ho raggiunto "${title}" con ${flipCount} flip su Ebartex! 🃏✨`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ebartex Card Flip', text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 1800);
      }
    } catch {}
  }, [flipCount, getCurrentTitle, vibrate]);

  // ── Touch swipe (mobile) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = Math.abs(t.clientY - touchStartRef.current.y);
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    if (Math.abs(dx) > 30 && dy < 60 && elapsed < 400) {
      setIsWardrobeOpen(false);
      doFlip();
    }
  };

  // ── Desktop flip: dedicated button (no more drag conflicts) ──
  const handleFlipButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsWardrobeOpen(false);
    doFlip();
  }, [doFlip, setIsWardrobeOpen]);

  // 3D Tilt parallax: track mouse relative to card center
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || easterEggActive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });

    // Also update holo pos for GOLD variant
    if (backFaceRef.current) {
      const br = backFaceRef.current.getBoundingClientRect();
      setHoloPos({
        x: ((e.clientX - br.left) / br.width) * 100,
        y: ((e.clientY - br.top) / br.height) * 100,
      });
    }
  }, [easterEggActive]);

  const handleCardMouseLeave = useCallback(() => {
    setIsCardHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  // Toggle album
  const handleAlbumToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(15);
    setShowAlbum(prev => !prev);
  }, [vibrate]);

  const stopMatchmakingPoll = useCallback(() => {
    if (matchmakingPollRef.current != null) {
      window.clearInterval(matchmakingPollRef.current);
      matchmakingPollRef.current = null;
    }
  }, []);

  const getArenaIdentity = useCallback(() => {
    if (authUser?.id) {
      const fallbackName = `Player-${authUser.id.slice(0, 6)}`;
      return {
        userId: authUser.id,
        username: authUser.name?.trim() || fallbackName,
      };
    }

    let guestId = '';
    try {
      guestId = localStorage.getItem(MATCHMAKING_GUEST_KEY) || '';
      if (!guestId) {
        guestId = `guest-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(MATCHMAKING_GUEST_KEY, guestId);
      }
    } catch {
      guestId = `guest-${Math.random().toString(36).slice(2, 10)}`;
    }

    return {
      userId: guestId,
      username: `Guest-${guestId.slice(-4).toUpperCase()}`,
    };
  }, [authUser]);

  const requestMatchmaking = useCallback(async (ticketId?: string): Promise<MatchmakingPayload | null> => {
    const identity = getArenaIdentity();

    try {
      const response = await fetch('/api/game/matchmaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          userId: identity.userId,
          username: identity.username,
          ticketId,
        }),
      });

      if (!response.ok) return null;
      const data = (await response.json().catch(() => null)) as MatchmakingPayload | null;
      return data;
    } catch {
      return null;
    }
  }, [getArenaIdentity]);

  const leaveMatchmakingQueue = useCallback(async (ticketId: string) => {
    try {
      await fetch(`/api/game/matchmaking?ticketId=${encodeURIComponent(ticketId)}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
    } catch {
      // ignore best-effort cleanup failures
    }
  }, []);

  const fetchConnectedPlayers = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/game/user-ids?limit=50', {
        method: 'GET',
        cache: 'no-store',
      });

      const payload: unknown = await response.json().catch(() => []);
      if (!Array.isArray(payload)) return 0;

      const uniqueIds = new Set(
        payload
          .map((entry) => {
            if (typeof entry === 'string') return entry.trim();
            if (typeof entry === 'number' && Number.isFinite(entry)) return String(entry);
            return '';
          })
          .filter(Boolean)
      );

      return uniqueIds.size;
    } catch {
      return 0;
    }
  }, []);

  const handlePlayArena = useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    e?.preventDefault();
    vibrate(20);

    setIsCheckingArenaPlayers(true);
    setArenaGateMessage('Controllo giocatori collegati...');
    stopMatchmakingPoll();

    const players = await fetchConnectedPlayers();
    setConnectedPlayers(players);

    const matchmaking = await requestMatchmaking(matchmakingTicketRef.current ?? undefined);

    if (!matchmaking) {
      setArenaGateMessage('Matchmaking non disponibile. Riprova tra poco.');
      setIsCheckingArenaPlayers(false);
      return;
    }

    matchmakingTicketRef.current = matchmaking.ticketId || matchmakingTicketRef.current;

    if (matchmaking.status === 'matched') {
      setArenaMatchId(matchmaking.matchId ?? null);
      setArenaOpponentName(matchmaking.opponent?.username || 'Rivale Live');
      setArenaGateMessage('Match trovato. Si parte!');
      setIsArenaOpen(true);
      setIsCheckingArenaPlayers(false);
      return;
    }

    if (players >= 2) {
      setArenaGateMessage('Cerco un avversario libero...');
    } else {
      setArenaGateMessage('In attesa di un altro giocatore');
    }

    if (matchmakingTicketRef.current) {
      matchmakingPollRef.current = window.setInterval(() => {
        void (async () => {
          const update = await requestMatchmaking(matchmakingTicketRef.current ?? undefined);
          if (!update) return;

          matchmakingTicketRef.current = update.ticketId || matchmakingTicketRef.current;

          if (update.status === 'matched') {
            stopMatchmakingPoll();
            setArenaMatchId(update.matchId ?? null);
            setArenaOpponentName(update.opponent?.username || 'Rivale Live');
            setArenaGateMessage('Match trovato. Si parte!');
            setIsArenaOpen(true);
            return;
          }

          setArenaGateMessage('In attesa di un altro giocatore');
        })();
      }, 2500);
    }

    setIsCheckingArenaPlayers(false);
  }, [fetchConnectedPlayers, requestMatchmaking, stopMatchmakingPoll, vibrate]);

  useEffect(() => {
    if (!isFlipped) {
      if (matchmakingTicketRef.current) {
        void leaveMatchmakingQueue(matchmakingTicketRef.current);
      }
      stopMatchmakingPoll();
      matchmakingTicketRef.current = null;
      setArenaOpponentName('Rivale Live');
      setArenaMatchId(null);
      setConnectedPlayers(null);
      setArenaGateMessage(null);
      setIsCheckingArenaPlayers(false);
      return;
    }

    if (isArenaOpen) return;

    let cancelled = false;

    const refreshPlayers = async () => {
      const players = await fetchConnectedPlayers();
      if (cancelled) return;
      setConnectedPlayers(players);
      if (matchmakingTicketRef.current) {
        setArenaGateMessage('In attesa di un altro giocatore');
        return;
      }
      setArenaGateMessage(players >= 2 ? 'Pronto: puoi premere Play' : 'In attesa di un altro giocatore');
    };

    void refreshPlayers();
    const pollId = window.setInterval(() => {
      void refreshPlayers();
    }, 7000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [fetchConnectedPlayers, isArenaOpen, isFlipped, leaveMatchmakingQueue, stopMatchmakingPoll]);

  useEffect(() => {
    if (!isArenaOpen) return;
    stopMatchmakingPoll();
  }, [isArenaOpen, stopMatchmakingPoll]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (achievementTimeoutRef.current) window.clearTimeout(achievementTimeoutRef.current);
      if (comboTimeoutRef.current) window.clearTimeout(comboTimeoutRef.current);
      if (unlockTimeoutRef.current) window.clearTimeout(unlockTimeoutRef.current);
      if (shinyTimeoutRef.current) window.clearTimeout(shinyTimeoutRef.current);
    };
  }, []);

  // Card loader state
  const [showCardLoader, setShowCardLoader] = useState(false);

  // Sticky bar offset state (when sticky bar appears, mascot moves up)
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);

  // Mobile hide state (mascotte moves 80% off-screen when hidden)
  const [isMobileHidden, setIsMobileHidden] = useState(false);
  const hasInitializedMobileHide = useRef(false);
  
  // Mobile detection state for flip behavior
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 640;
      setIsMobileView(isMobile);

      if (!hasInitializedMobileHide.current) {
        setIsMobileHidden(isMobile);
        hasInitializedMobileHide.current = true;
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Welcome message variants based on interaction history
  const welcomeMessages = useMemo(() => {
    if (!hasInteractedBefore) {
      // First time - warm introduction
      return [
        "Ciao! Sono Asso, l'assistente di Ebartex. Come posso aiutarti oggi?",
        "Benvenuto su Ebartex! Sono Asso, il tuo assistente personale. Cosa posso fare per te?",
        "Ciao! Asso al tuo servizio. Pronto per aiutarti a navigare su Ebartex!"
      ];
    }
    // Returning user - familiar, shorter greetings
    return [
      "Bentornato! Asso è qui. Cosa ti serve oggi?",
      "Ciao di nuovo! Pronto ad aiutarti.",
      "Asso al tuo servizio! Come posso esserti utile?",
      "Eccomi! Cosa posso fare per te questa volta?"
    ];
  }, [hasInteractedBefore]);

  const handleClick = (e: React.MouseEvent) => {
    // Ignore clicks on buttons inside the card (share, album, flip)
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    // If mascot is hidden on mobile, restore it
    if (isMobileHidden) {
      setIsMobileHidden(false);
      return;
    }

    // If card is flipped, flip it back instead of opening chat
    if (isFlipped) {
      setShowAlbum(false);
      setIsWardrobeOpen(false);
      doFlip();
      return;
    }
    playOpenSound();
    // Show card loader animation first
    setShowCardLoader(true);
  };

  // Typewriter effect function
  const startTypewriterEffect = useCallback((fullText: string, onComplete: () => void) => {
    // Invalidate any in-flight typewriter loop before starting a new one.
    typewriterSequenceRef.current += 1;
    const sequenceId = typewriterSequenceRef.current;

    if (typewriterTimeoutRef.current !== null) {
      window.clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }

    setIsTypewriting(true);
    setTypewriterText('');
    
    let currentIndex = 0;
    // Use code points instead of split('') to avoid broken glyphs while typing.
    const chars = Array.from(fullText);
    
    const typeNextChar = () => {
      if (sequenceId !== typewriterSequenceRef.current) {
        return;
      }

      if (currentIndex < chars.length) {
        setTypewriterText(chars.slice(0, currentIndex + 1).join(''));
        currentIndex++;
        
        // Variable typing speed for natural feel (faster for spaces, slower for punctuation)
        const char = chars[currentIndex - 1];
        const delay = char === ' ' ? 20 : char === '.' || char === '!' || char === '?' ? 120 : 35;
        
        typewriterTimeoutRef.current = window.setTimeout(typeNextChar, delay);
      } else {
        typewriterTimeoutRef.current = null;
        setIsTypewriting(false);
        onComplete();
      }
    };
    
    typewriterTimeoutRef.current = window.setTimeout(typeNextChar, 150);
  }, []);

  // Callback when card loader animation completes
  const handleCardLoaderComplete = useCallback(() => {
    setShowCardLoader(false);
    setIsCodingTransition(false);
    setShowCodingCompanion(false);
    setCodingStatus('compiling');
    setShowChatModal(true);
    setChatStep('greeting');
    // Reset messages immediately to prevent showing stale messages from previous session
    setChatMessages([]);
    
    // Select random welcome message
    const selectedMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    // Show typing indicator briefly, then start typewriter
    setIsTyping(true);

    if (greetingTimeoutRef.current !== null) {
      window.clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = null;
    }
    
    greetingTimeoutRef.current = window.setTimeout(() => {
      greetingTimeoutRef.current = null;
      setIsTyping(false);
      
      // Start typewriter effect
      startTypewriterEffect(selectedMessage, () => {
        // After typewriter completes, show the full message in chat and proceed to menu
        setChatMessages([{ type: 'asso', text: selectedMessage }]);
        setTimeout(() => setChatStep('menu'), 600);
      });
      
      // Mark as interacted for future visits
      try {
        localStorage.setItem('brx_asso_interacted', 'true');
        setHasInteractedBefore(true);
      } catch {
        // localStorage not available
      }
    }, 400);
  }, [welcomeMessages, startTypewriterEffect]);

  // Handle chat modal close
  const handleChatModalClose = () => {
    setShowChatModal(false);
    setIsTyping(false);

    if (greetingTimeoutRef.current !== null) {
      window.clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = null;
    }

    // Cancel any ongoing typewriter effect
    typewriterSequenceRef.current += 1;
    if (typewriterTimeoutRef.current !== null) {
      window.clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setIsTypewriting(false);
    setTypewriterText('');
  };

  const resetCodingCompanion = () => {
    if (codingTransitionTimeoutRef.current !== null) {
      window.clearTimeout(codingTransitionTimeoutRef.current);
      codingTransitionTimeoutRef.current = null;
    }
    if (submitFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(submitFeedbackTimeoutRef.current);
      submitFeedbackTimeoutRef.current = null;
    }
    setIsCodingTransition(false);
    setShowCodingCompanion(false);
    setCodingStatus('compiling');
    setIsBugFormFocused(false);
  };

  // Audio feedback using Web Audio API
  const playOpenSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create oscillator for a pleasant "pop" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sound configuration - soft pop
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.15);
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch {
    }
  };

  // Success sound feedback when bug report is submitted
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create oscillators for a pleasant "success" chord
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Success chord - C major (523.25Hz + 659.25Hz)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioContext.currentTime);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioContext.currentTime);
      
      // Volume envelope - brighter and longer than open sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      osc1.start(audioContext.currentTime);
      osc2.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.4);
      osc2.stop(audioContext.currentTime + 0.4);
    } catch {
    }
  };

  // iPhone camera shutter - realistic synthesis (multi-layer)
  const playShutterSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioContext.currentTime;

      // Master gain - higher volume for louder sound
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(audioContext.destination);

      // 1. Noise burst - mechanical "clack" texture (sharper and louder)
      const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.04), audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.2));
      }
      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      
      // Sharper bandpass filter
      const noiseFilter = audioContext.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 4000;
      noiseFilter.Q.value = 0.8;
      
      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.04);

      // 2. Main metallic click - square wave high freq (crisper)
      const clickOsc = audioContext.createOscillator();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(2800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.025);
      
      const clickFilter = audioContext.createBiquadFilter();
      clickFilter.type = 'highpass';
      clickFilter.frequency.value = 2000;
      
      const clickGain = audioContext.createGain();
      clickGain.gain.setValueAtTime(0, now);
      clickGain.gain.linearRampToValueAtTime(0.9, now + 0.0003);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      
      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(masterGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 3. Thud/slap - sawtooth for body (deeper and punchier)
      const thudOsc = audioContext.createOscillator();
      thudOsc.type = 'sawtooth';
      thudOsc.frequency.setValueAtTime(200, now + 0.002);
      thudOsc.frequency.exponentialRampToValueAtTime(80, now + 0.02);
      
      const thudFilter = audioContext.createBiquadFilter();
      thudFilter.type = 'lowpass';
      thudFilter.frequency.value = 500;
      
      const thudGain = audioContext.createGain();
      thudGain.gain.setValueAtTime(0, now + 0.002);
      thudGain.gain.linearRampToValueAtTime(0.7, now + 0.003);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      
      thudOsc.connect(thudFilter);
      thudFilter.connect(thudGain);
      thudGain.connect(masterGain);
      thudOsc.start(now + 0.002);
      thudOsc.stop(now + 0.03);

      // 4. High transient - sine for the "ting" (brighter)
      const transientOsc = audioContext.createOscillator();
      transientOsc.type = 'sine';
      transientOsc.frequency.setValueAtTime(4000, now);
      transientOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.01);
      
      const transientGain = audioContext.createGain();
      transientGain.gain.setValueAtTime(0, now);
      transientGain.gain.linearRampToValueAtTime(0.4, now + 0.0005);
      transientGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      
      transientOsc.connect(transientGain);
      transientGain.connect(masterGain);
      transientOsc.start(now);
      transientOsc.stop(now + 0.02);

      // 5. Secondary click for double-shutter effect (very subtle delay)
      const click2Osc = audioContext.createOscillator();
      click2Osc.type = 'square';
      click2Osc.frequency.setValueAtTime(3000, now + 0.008);
      click2Osc.frequency.exponentialRampToValueAtTime(1500, now + 0.02);
      
      const click2Filter = audioContext.createBiquadFilter();
      click2Filter.type = 'highpass';
      click2Filter.frequency.value = 2500;
      
      const click2Gain = audioContext.createGain();
      click2Gain.gain.setValueAtTime(0, now + 0.008);
      click2Gain.gain.linearRampToValueAtTime(0.6, now + 0.0085);
      click2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      
      click2Osc.connect(click2Filter);
      click2Filter.connect(click2Gain);
      click2Gain.connect(masterGain);
      click2Osc.start(now + 0.008);
      click2Osc.stop(now + 0.025);

    } catch (e) {
      // Audio not supported
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Keyboard activation: flip back if flipped, otherwise open chat
      if (isFlipped) {
        setShowAlbum(false);
        setIsWardrobeOpen(false);
        doFlip();
      } else {
        playOpenSound();
        setShowCardLoader(true);
      }
    }
  };

  // Enable console capture only while bug modal is open to avoid global overhead.
  useEffect(() => {
    if (!isModalOpen) return;
    startConsoleCapture();
    return () => {
      stopConsoleCapture();
    };
  }, [isModalOpen]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const bugCategory = inferBugCategory(currentUrl);
  const detailedBugUrl = `/aiuto?tab=bug&url=${encodeURIComponent(currentUrl)}&category=${bugCategory}`;

  // Eyes follow mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!faceContainerRef.current) {
        return;
      }

      const cardEl = cardRef.current;
      if (!cardEl) {
        return;
      }

      const cardRect = cardEl.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      const angle = Math.atan2(e.clientY - cardCenterY, e.clientX - cardCenterX);
      const dist = Math.sqrt(
        Math.pow(e.clientX - cardCenterX, 2) + Math.pow(e.clientY - cardCenterY, 2)
      );
      const factor = Math.min(1, dist / 300);
      const maxOffset = 4;
      const dx = Math.cos(angle) * maxOffset * factor;
      const dy = Math.sin(angle) * maxOffset * factor;

      const pupils = faceContainerRef.current.querySelectorAll('.pupil');
      
      pupils.forEach((pupil) => {
        (pupil as SVGElement).style.transition = 'transform 0.12s ease-out';
        (pupil as SVGElement).style.transform = `translate(${dx}px, ${dy}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    playSuccessSound();
    setCodingStatus('received');

    setSubmitted(true);
    
    // Clear stored data
    try {
      localStorage.removeItem(BUG_REPORT_STORAGE.SCREENSHOT);
      localStorage.removeItem(BUG_REPORT_STORAGE.CONSOLE_LOGS);
      localStorage.removeItem(BUG_REPORT_STORAGE.CATEGORY);
      localStorage.removeItem(BUG_REPORT_STORAGE.TIMESTAMP);
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    
    if (submitFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(submitFeedbackTimeoutRef.current);
    }

    submitFeedbackTimeoutRef.current = window.setTimeout(() => {
      setIsModalOpen(false);
      setSubmitted(false);
      setBugForm({ name: '', email: '', subject: '', message: '', bugType: 'functional', priority: 'medium', url: '' });
      setScreenshot(null);
      setHasConsoleLogs(false);
      setShowConsoleLogs(false);
      resetCodingCompanion();
      submitFeedbackTimeoutRef.current = null;
    }, SUBMIT_FEEDBACK_MS);
  };

  const handleDetailedBug = () => {
    if (screenshot) {
      try {
        localStorage.setItem(BUG_REPORT_STORAGE.SCREENSHOT, screenshot);
      } catch (e) {
        console.error('Failed to save screenshot:', e);
      }
    }

    const recentLogs = getRecentLogs(60);
    if (recentLogs.length > 0) {
      try {
        localStorage.setItem(BUG_REPORT_STORAGE.CONSOLE_LOGS, JSON.stringify(recentLogs));
        localStorage.setItem(BUG_REPORT_STORAGE.TIMESTAMP, Date.now().toString());
      } catch (e) {
        console.error('Failed to save logs:', e);
      }
    }

    localStorage.setItem(BUG_REPORT_STORAGE.CATEGORY, bugCategory);

    setIsModalOpen(false);
    setBugForm({ name: '', email: '', subject: '', message: '', bugType: 'functional', priority: 'medium', url: '' });
    setScreenshot(null);
    setHasConsoleLogs(false);
    resetCodingCompanion();
  };

  const captureScreenshot = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      // Trigger flash animation and shutter sound FIRST
      setShowFlash(true);
      playShutterSound();
      setTimeout(() => setShowFlash(false), 300);

      // Temporarily hide the modal and mascot for clean screenshot
      const modalWasOpen = isModalOpen;
      setIsModalOpen(false);
      
      // Hide mascot elements
      if (cardRef.current) {
        cardRef.current.style.visibility = 'hidden';
        cardRef.current.style.opacity = '0';
      }

      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 400));

      // Capture screenshot
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowHeight: window.innerHeight,
        height: window.innerHeight,
        backgroundColor: null,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure mascot is hidden in the clone too
          const clonedMascotte = clonedDoc.querySelector('[aria-label="Segnala un bug"]');
          if (clonedMascotte) {
            (clonedMascotte as HTMLElement).style.display = 'none';
          }
        },
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setScreenshot(dataUrl);

      // Show preview thumbnail briefly
      setShowScreenshotPreview(true);
      setTimeout(() => setShowScreenshotPreview(false), 2000);

      const logs = getRecentLogs(60);
      setHasConsoleLogs(logs.length > 0);

      // Reopen modal and show mascot again
      setIsModalOpen(true);
    } catch (err) {
      console.error('Screenshot failed:', err);
      // Reopen modal even on error
      setIsModalOpen(true);
    } finally {
      // Always restore mascot visibility
      if (cardRef.current) {
        cardRef.current.style.visibility = '';
        cardRef.current.style.opacity = '';
      }
      setIsCapturing(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  useEffect(() => {
    return () => {
      if (codingTransitionTimeoutRef.current !== null) {
        window.clearTimeout(codingTransitionTimeoutRef.current);
      }
      if (submitFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(submitFeedbackTimeoutRef.current);
      }
      if (greetingTimeoutRef.current !== null) {
        window.clearTimeout(greetingTimeoutRef.current);
      }
      if (typewriterTimeoutRef.current !== null) {
        window.clearTimeout(typewriterTimeoutRef.current);
      }
      if (styleReactionHideTimeoutRef.current !== null) {
        window.clearTimeout(styleReactionHideTimeoutRef.current);
      }
      if (styleReactionClearTimeoutRef.current !== null) {
        window.clearTimeout(styleReactionClearTimeoutRef.current);
      }
      if (wardrobeDoneTimeoutRef.current !== null) {
        window.clearTimeout(wardrobeDoneTimeoutRef.current);
      }
    };
  }, []);

  // Keep expression in sync with current overlay state + sleep mode
  useEffect(() => {
    // Priority: sleep > coding > modal > chat > normal
    const nextExpression = isSleeping 
      ? 'sleeping' 
      : isCodingTransition 
        ? 'bugReport' 
        : isModalOpen 
          ? (isBugFormFocused ? 'bugFocus' : 'bugReport') 
          : showChatModal 
            ? 'wink' 
            : 'normal';

    if (mascotteExpression === nextExpression) {
      return;
    }

    if (expressionTimeoutRef.current !== null) {
      window.clearTimeout(expressionTimeoutRef.current);
    }

    const delay = nextExpression === 'wink' ? EXPRESSION_TRANSITION_MS : 0;
    expressionTimeoutRef.current = window.setTimeout(() => {
      setMascotteExpression(nextExpression);
      expressionTimeoutRef.current = null;
    }, delay);

    return () => {
      if (expressionTimeoutRef.current !== null) {
        window.clearTimeout(expressionTimeoutRef.current);
        expressionTimeoutRef.current = null;
      }
    };
  }, [isModalOpen, showChatModal, mascotteExpression, isCodingTransition, isBugFormFocused, isSleeping]);

  useEffect(() => {
    if (!isModalOpen) {
      setIsBugFormFocused(false);
    }
  }, [isModalOpen]);

  // Watch for external modals (from AuctionBidModal) to hide mascot
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  // Track when modal just closed for re-entry animation
  const [justReappeared, setJustReappeared] = useState(false);
  const reappearTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const checkExternalModalClass = () => {
      const wasOpen = isExternalModalOpen;
      const isOpen = document.body.classList.contains('auction-bid-modal-open');
      setIsExternalModalOpen(isOpen);
      
      // Trigger reappear animation when modal closes
      if (wasOpen && !isOpen) {
        setJustReappeared(true);
        if (reappearTimeoutRef.current !== null) {
          window.clearTimeout(reappearTimeoutRef.current);
        }
        reappearTimeoutRef.current = window.setTimeout(() => {
          setJustReappeared(false);
          reappearTimeoutRef.current = null;
        }, 600);
      }
    };

    checkExternalModalClass();

    const observer = new MutationObserver(checkExternalModalClass);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (reappearTimeoutRef.current !== null) {
        window.clearTimeout(reappearTimeoutRef.current);
      }
    };
  }, [isExternalModalOpen]);

  const router = useRouter();
  const pathname = usePathname();

  // Promotional hints - glassmorphism style matching mascot
  const promoHints = useMemo(() => [
    {
      id: 'tcg-express',
      text: 'Lo sai cosa ci rende unici? Tornei live e logistica decentralizzata con BRX Express!',
      route: '/tcg-express',
      // Glass tint color (accent only, not solid)
      accent: '#10B981',
      icon: 'swap',
    },
    {
      id: 'aste',
      text: 'Vuoi guadagnare di più dalle vendite? Perché non provi le Aste?',
      route: '/aste',
      // Glass tint color (accent only, not solid)
      accent: '#06B6D4',
      icon: 'auction',
    },
    {
      id: 'bug',
      text: 'Segnalami un bug! Clicca qui per aiutarci a migliorare.',
      route: '#bug-report',
      // Minimal - no accent color, just glass
      accent: null,
      icon: 'bug',
    },
  ], []);

  // Filter promos to exclude current page (smart rotation)
  const activePromoHints = useMemo(() => {
    if (!pathname) return promoHints;
    return promoHints.filter(promo => !pathname.startsWith(promo.route));
  }, [pathname, promoHints]);

  const styleReactionMessages = useMemo(() => ({
    outfit: [
      'Nuovo fit, nuova era.',
      'Questo outfit spacca, no cap.',
      'Drip attivato: livello massimo.',
      'Mood: main character unlocked.',
      'Flex silenzioso ma devastante.',
      'Sto servendo look, e si vede.',
      'Cambio vestito, cambio vibe.',
      'Versione premium di me: online.',
    ],
    color: [
      'Questo colore mi sta illegalmente bene.',
      'Glow-up cromatico appena droppato.',
      'Palette nuova, energia nuova.',
      'Color match perfetto: chef\'s kiss.',
    ],
  }), []);

  const triggerStyleReaction = useCallback((source: 'outfit' | 'color') => {
    const pool = styleReactionMessages[source];
    if (pool.length === 0) return;

    let nextIndex = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && nextIndex === styleReactionLastIndexRef.current) {
      nextIndex = (nextIndex + 1) % pool.length;
    }
    styleReactionLastIndexRef.current = nextIndex;

    if (styleReactionHideTimeoutRef.current !== null) {
      window.clearTimeout(styleReactionHideTimeoutRef.current);
      styleReactionHideTimeoutRef.current = null;
    }
    if (styleReactionClearTimeoutRef.current !== null) {
      window.clearTimeout(styleReactionClearTimeoutRef.current);
      styleReactionClearTimeoutRef.current = null;
    }

    setStyleReactionText(pool[nextIndex]);
    setShowStyleReaction(true);

    styleReactionHideTimeoutRef.current = window.setTimeout(() => {
      setShowStyleReaction(false);
      styleReactionHideTimeoutRef.current = null;

      styleReactionClearTimeoutRef.current = window.setTimeout(() => {
        setStyleReactionText(null);
        styleReactionClearTimeoutRef.current = null;
      }, 280);
    }, 3000);
  }, [styleReactionMessages]);

  // Cycle hint bubble: show briefly, hide, repeat with rotating messages
  // Promotional hints appear frequently (every 2nd hint = 50% of the time)
  useEffect(() => {
    if (styleReactionText) {
      return;
    }

    if (activePromoHints.length === 0) {
      setShowHint(false);
      return;
    }

    const INITIAL_DELAY = 1500; // Very fast first appearance
    const REGULAR_SHOW_DURATION = 3000; // Brief display
    const PROMO_SHOW_DURATION = 4500; // Brief but noticeable
    const HIDE_DURATION = 6000; // Very short hide = almost continuous
    const PROMO_FREQUENCY = 2; // Every 2nd hint is promotional (more frequent)

    let showTimer: number;
    let hideTimer: number;
    let hintCounter = 0;

    const show = () => {
      hintCounter++;
      // Only show promo if it's promo time AND there are active promos available
      const shouldShowPromo = hintCounter % PROMO_FREQUENCY === 0 && activePromoHints.length > 0;

      // Always cycle through promo hints (scambi, aste, bug hint)
      setPromoHintIndex(prev => (prev + 1) % activePromoHints.length);

      setShowHint(true);
      const showDuration = shouldShowPromo ? PROMO_SHOW_DURATION : REGULAR_SHOW_DURATION;

      hideTimer = window.setTimeout(() => {
        setShowHint(false);
        showTimer = window.setTimeout(show, HIDE_DURATION);
      }, showDuration);
    };

    const initialTimer = window.setTimeout(() => {
      setShowHint(true);
      hideTimer = window.setTimeout(() => {
        setShowHint(false);
        showTimer = window.setTimeout(show, HIDE_DURATION);
      }, REGULAR_SHOW_DURATION);
    }, INITIAL_DELAY);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [activePromoHints.length, styleReactionText]);

  // Listen for sticky bar visibility changes
  useEffect(() => {
    const handleStickyBarShow = (e: CustomEvent) => {
      setIsStickyBarVisible(e.detail.visible);
    };

    window.addEventListener('stickyBarVisibilityChange' as any, handleStickyBarShow as any);
    return () => window.removeEventListener('stickyBarVisibilityChange' as any, handleStickyBarShow as any);
  }, []);

  // No separate sleep promo cycle - uses same index as awake state

  const isOverlayVisible = showChatModal || isModalOpen || isCodingTransition || showCodingCompanion || isExternalModalOpen || isArenaOpen;
  const isStyleReactionActive = styleReactionText !== null;
  const isHintVisible = isStyleReactionActive ? showStyleReaction : showHint;
  const currentPromoHint = activePromoHints[promoHintIndex];
  const currentHintAccent = isStyleReactionActive ? '#FF7300' : currentPromoHint?.accent ?? null;
  const currentHintText = isStyleReactionActive ? styleReactionText : currentPromoHint?.text ?? '';

  // Snore sound using Web Audio API - soft rhythmic breathing sound
  const playSnoreSound = useCallback(() => {
    if (isSleepMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      
      // Create oscillator for gentle hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Low frequency for sleep breathing effect
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 2);
      
      // Lowpass filter for muffled sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      
      // Gentle volume envelope - rhythmic breathing
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      
      osc.start(now);
      osc.stop(now + 2.5);
      
      // Store refs for stopping
      snoreOscillatorRef.current = osc;
      snoreGainRef.current = gain;
    } catch {}
  }, [isSleepMuted]);

  // Stop snore sound
  const stopSnoreSound = useCallback(() => {
    try {
      if (snoreOscillatorRef.current) {
        snoreOscillatorRef.current.stop();
        snoreOscillatorRef.current = null;
      }
    } catch {}
  }, []);

  // Mouse inactivity tracking for sleep mode - defined after isOverlayVisible and isFlipped
  // BUG FIX: Use refs to avoid effect re-running when sleeping state changes
  useEffect(() => {
    const resetSleepTimer = () => {
      // Wake up if sleeping (using ref to avoid re-trigger)
      if (isSleepingRef.current) {
        // Calculate and save sleep duration
        if (sleepStartTimeRef.current) {
          const sleepDuration = Date.now() - sleepStartTimeRef.current;
          const newTotal = totalSleepMs + sleepDuration;
          setTotalSleepMs(newTotal);
          try {
            localStorage.setItem('brx_asso_sleep_ms', String(newTotal));
          } catch {}
          sleepStartTimeRef.current = null;
        }
        setIsSleeping(false);
        stopSnoreSound();
      }
      // Clear existing timer
      if (sleepTimeoutRef.current !== null) {
        window.clearTimeout(sleepTimeoutRef.current);
      }
      // Set new timer - only if no overlay is open and card is not flipped
      if (!isOverlayVisible && !isFlipped) {
        sleepTimeoutRef.current = window.setTimeout(() => {
          setIsSleeping(true);
          sleepStartTimeRef.current = Date.now(); // Track when sleep started
          playSnoreSound();
        }, SLEEP_DELAY_MS);
      }
    };

    // Listen for mouse activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, resetSleepTimer, { passive: true });
    });

    // Initial timer - only set if not already sleeping
    if (!isSleepingRef.current) {
      resetSleepTimer();
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetSleepTimer);
      });
      if (sleepTimeoutRef.current !== null) {
        window.clearTimeout(sleepTimeoutRef.current);
      }
      stopSnoreSound();
    };
    // BUG FIX: Removed isSleeping from dependencies - use ref instead
  }, [isOverlayVisible, isFlipped, playSnoreSound, stopSnoreSound, totalSleepMs]);

  // Toggle sleep mute and persist to localStorage
  const toggleSleepMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isSleepMuted;
    setIsSleepMuted(newMuted);
    try {
      localStorage.setItem('brx_asso_sleep_muted', String(newMuted));
    } catch {}
    vibrate(10);
  }, [isSleepMuted, vibrate]);

  // Safe render - don't render if not mounted (hydration mismatch protection)
  if (!isMounted) {
    return null;
  }

  // If there was a critical error, don't render
  if (hasError) {
    console.error('🎴 CardMascotte has error, not rendering');
    return null;
  }

  return (
    <>
      {/* Card Loader - Shows when mascot is clicked */}
      {showCardLoader && (
        <CardLoader onComplete={handleCardLoaderComplete} duration={3900} />
      )}

      {/* Flash overlay for screenshot capture */}
      {showFlash && (
        <div
          className="fixed inset-0 pointer-events-none bg-white"
          style={{
            zIndex: Z_INDEX.flash,
            animation: 'flashFade 300ms ease-out forwards',
          }}
        />
      )}

      {/* Screenshot preview thumbnail */}
      {showScreenshotPreview && screenshot && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.screenshotPreview,
            bottom: '200px',
            right: '20px',
            animation: 'previewSlideIn 0.3s ease-out, previewFadeOut 0.3s ease-in 1.7s forwards',
          }}
        >
          <div className="rounded-lg border-2 border-[#C4A35A] bg-zinc-900 p-2 shadow-2xl">
            <div className="relative">
              <img
                src={screenshot}
                alt="Screenshot preview"
                className="h-32 w-48 rounded object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
                Screenshot catturato
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Hint Bubble — single component for all states */}
      {!isModalOpen && (
        <div
          className={`fixed hidden sm:flex flex-col items-center group ${isStyleReactionActive ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={() => {
            if (isStyleReactionActive) return;

            const promo = currentPromoHint;
            if (promo) {
              if (promo.id === 'bug') {
                setIsModalOpen(true);
              } else {
                router.push(promo.route);
              }
            }
          }}
          style={{
            zIndex: isStyleReactionActive ? Z_INDEX.tooltip + 6 : Z_INDEX.tooltip,
            bottom: isStickyBarVisible ? '210px' : '154px',
            right: '24px',
            width: '220px',
            opacity: isHintVisible ? 1 : 0,
            transform: isHintVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
            transition: 'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease, transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: isHintVisible ? 'auto' : 'none',
          }}
        >
          {/* Glassmorphism bubble - matches mascot style */}
          <div
            className="relative rounded-xl px-4 py-3 text-center backdrop-blur-md overflow-hidden"
            style={{
              background: currentHintAccent
                ? `linear-gradient(135deg, ${currentHintAccent}15 0%, rgba(39,39,42,0.85) 100%)`
                : 'rgba(39,39,42,0.85)',
              border: currentHintAccent
                ? `1px solid ${currentHintAccent}40`
                : '1px solid rgba(255,255,255,0.15)',
              boxShadow: currentHintAccent
                ? `0 4px 20px ${currentHintAccent}25, 0 2px 8px rgba(0,0,0,0.2)`
                : '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            {/* Subtle accent glow for non-bug hints */}
            {currentHintAccent && (
              <div
                className="absolute inset-0 opacity-20 blur-md"
                style={{
                  background: currentHintAccent,
                }}
              />
            )}
            {/* Sleep emoji indicator when sleeping */}
            {isSleeping && (
              <span className="absolute -top-1 -left-1 text-lg" style={{ animation: 'sleepTwinkle 2s ease-in-out infinite' }}>💤</span>
            )}
            {/* Text content */}
            <p
              className="relative text-white font-semibold leading-tight"
              style={{
                fontSize: '11px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {currentHintText}
            </p>
            {/* CTA arrow */}
            {!isStyleReactionActive && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="text-[9px] font-medium text-white/90">
                  {isSleeping ? 'Scopri nel sogno' : 'Scopri di più'}
                </span>
                <ArrowRight className="h-3 w-3 text-white/90 transition-transform group-hover:translate-x-1" />
              </div>
            )}
            {/* Glass arrow pointer */}
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rotate-45"
              style={{
                width: '8px',
                height: '8px',
                background: currentHintAccent
                  ? `linear-gradient(135deg, ${currentHintAccent}20 0%, rgba(39,39,42,0.9) 100%)`
                  : 'rgba(39,39,42,0.9)',
                borderBottom: currentHintAccent
                  ? `1px solid ${currentHintAccent}50`
                  : '1px solid rgba(255,255,255,0.15)',
                borderRight: currentHintAccent
                  ? `1px solid ${currentHintAccent}50`
                  : '1px solid rgba(255,255,255,0.15)',
              }}
            />
          </div>
        </div>
      )}

      {/* Unlock Notification */}
      {newUnlock && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 2,
            bottom: isStickyBarVisible ? '220px' : '160px',
            right: '10px',
            animation: 'unlockFlash 3s ease-out forwards',
          }}
        >
          <div className="unlock-badge flex items-center gap-2 rounded-xl border border-amber-500/30 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="white" /></svg>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-white">Sbloccato!</p>
              <p className="text-[8px] font-bold text-white/80">{newUnlock}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mini Album Panel */}
      {showAlbum && isFlipped && (
        <div
          className="fixed"
          style={{
            zIndex: Z_INDEX.tooltip + 3,
            bottom: isStickyBarVisible ? '215px' : '155px',
            right: '16px',
            animation: 'albumSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="w-[140px] rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-2.5 shadow-2xl backdrop-blur-md">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Collezione</span>
              <span className="text-[8px] font-bold text-primary">{BACK_VARIANTS.filter(v => flipCount >= v.unlock).length}/{BACK_VARIANTS.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {BACK_VARIANTS.map((v, i) => {
                const unlocked = flipCount >= v.unlock;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors"
                    style={{ background: unlocked ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                  >
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded"
                      style={{
                        background: unlocked ? v.gradient : 'rgba(255,255,255,0.08)',
                        border: unlocked ? 'none' : '1px dashed rgba(255,255,255,0.15)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-[8px] font-bold ${unlocked ? 'text-white' : 'text-zinc-600'}`}>
                        {unlocked ? v.label : '???'}
                      </p>
                      <p className="text-[6px] text-zinc-500">
                        {unlocked ? v.sub : `${v.unlock} flip`}
                      </p>
                    </div>
                    {unlocked ? (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Wardrobe Panel */}
      {isWardrobeOpen && (
        <div
          className="fixed"
          style={{
            zIndex: Z_INDEX.tooltip + 3,
            bottom: isStickyBarVisible ? '260px' : '200px',
            right: '16px',
            animation: 'albumSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="relative w-[250px] max-w-[calc(100vw-1.5rem)] max-h-[360px] overflow-hidden rounded-2xl border border-white/35 bg-[linear-gradient(165deg,rgba(255,210,165,0.36)_0%,rgba(255,142,42,0.24)_40%,rgba(25,24,32,0.9)_100%)] p-2.5 shadow-[0_20px_46px_rgba(255,115,0,0.35)] ring-1 ring-white/20 backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-12 left-1/2 h-24 w-44 -translate-x-1/2 rounded-full bg-white/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-[#ff7300]/25 blur-2xl" />

            <div className="relative z-[1]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/85">Guardaroba</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearWardrobeItems();
                  }}
                  className="rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/90 transition hover:bg-white/25"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleWardrobeDone}
                  className="rounded-full border border-[#FFB26B]/70 bg-gradient-to-r from-[#FF7300]/95 to-[#FFA246]/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(255,115,0,0.35)] transition hover:brightness-110"
                >
                  Fatto
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-4 gap-1">
              {(['clothing', 'accessories', 'objects', 'color'] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWardrobeCategory(category);
                  }}
                  className={`min-w-0 overflow-hidden rounded-lg border px-1 py-1 text-[7px] font-bold uppercase leading-none tracking-[0.01em] transition ${
                    wardrobeCategory === category
                      ? 'border-white/40 bg-gradient-to-r from-[#FF7300]/95 to-[#FFA246]/90 text-white shadow-[0_6px_16px_rgba(255,115,0,0.35)]'
                      : 'border-white/15 bg-black/20 text-white/75 hover:border-white/30 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="block w-full truncate">
                    {category === 'clothing'
                      ? 'Abiti'
                      : category === 'accessories'
                      ? 'Accessori'
                      : category === 'objects'
                      ? 'Oggetti'
                      : 'Colore'}
                  </span>
                </button>
              ))}
            </div>

            {wardrobeCategory === 'color' ? (
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/15 p-1.5 sm:grid-cols-3">
                {FACE_COLOR_OPTIONS.map((option) => {
                  const isActive = equippedItems.faceColor === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isActive) return;
                        pendingStyleReactionSourceRef.current = 'color';
                        setEquippedItems((prev) => ({ ...prev, faceColor: option.id }));
                      }}
                      className={`flex items-center rounded-lg border px-2 py-1.5 text-left transition ${
                        isActive
                          ? 'border-[#FFB26B]/80 bg-[#FF7300]/30 text-white shadow-[0_8px_18px_rgba(255,115,0,0.25)]'
                          : 'border-white/15 bg-black/20 text-white/85 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate text-[9px] font-semibold">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: option.line,
                            boxShadow: `0 0 8px ${option.glowMid}`,
                          }}
                        />
                        {option.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="max-h-[250px] overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-1.5 pr-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {visibleWardrobeItems.map((item) => {
                    const equipped = isWardrobeItemEquipped(item);
                    const thumbSrc = wardrobeThumbById.get(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWardrobeItem(item);
                        }}
                        className={`group flex min-h-[78px] flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center transition ${
                          equipped
                            ? 'border-[#FFB26B]/80 bg-[linear-gradient(155deg,rgba(255,150,70,0.38)_0%,rgba(255,115,0,0.28)_55%,rgba(0,0,0,0.38)_100%)] text-white shadow-[0_10px_22px_rgba(255,115,0,0.28)]'
                            : 'border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_45%,rgba(0,0,0,0.32)_100%)] text-white/85 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border ${equipped ? 'border-white/40 bg-white/25' : 'border-white/20 bg-white/10'}`}>
                          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_58%)]" />
                          {thumbSrc ? (
                            <img
                              src={thumbSrc}
                              alt=""
                              aria-hidden="true"
                              className="h-8 w-8 object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Sparkles className="h-4 w-4 text-white/80" />
                          )}
                        </span>
                        <span className="w-full truncate text-[8px] font-semibold leading-tight">{item.name}</span>
                        <span className="text-[7px] uppercase tracking-wide text-white/50">
                          {item.category === 'clothing' ? 'Tessuto' : item.category === 'accessories' ? 'Dettaglio' : 'Prop'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badge */}
      {showAchievement && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '220px' : '160px',
            right: '20px',
            animation: 'achievementIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, achievementOut 400ms ease-in 2s forwards',
          }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-zinc-600/40 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
            <span className="text-base">&#11088;</span>
            <div>
              <p className="text-[10px] font-bold text-zinc-200">{showAchievement}</p>
              <p className="text-[8px] text-zinc-400">{flipCount} flip totali</p>
            </div>
          </div>
        </div>
      )}

      {/* Combo Badge */}
      {showCombo && comboCount >= 2 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '155px' : '95px',
            right: '30px',
            animation: 'comboPopIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-zinc-900/80 px-2.5 py-1 shadow-md shadow-black/20 backdrop-blur-md">
            <span className="text-[10px] font-black text-white">{comboCount}x</span>
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/80">COMBO</span>
          </div>
        </div>
      )}

      {/* Sleep Bubbles - Floating when sleeping */}
      {isSleeping && !isOverlayVisible && !isFlipped && !isMobileView && (
        <div
          className="fixed pointer-events-none sleep-bubbles-wrapper"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '175px' : '115px',
            right: '70px',
          }}
        >
          <div className="sleep-bubbles-container">
            <div className="sleep-bubble sleep-bubble-large">
              <span className="sleep-bubble-text">Zzz</span>
            </div>
            <div className="sleep-bubble sleep-bubble-small">
              <span className="sleep-bubble-text">z</span>
            </div>
          </div>
        </div>
      )}

      {/* Flip Particles */}
      {flipParticles.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '48px',
            width: '96px',
            height: '128px',
          }}
        >
          {flipParticles.map((p) => (
            <div
              key={p.id}
              className="flip-particle absolute"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--particle-dx': `${p.dx}px`,
                '--particle-dy': `${p.dy}px`,
                backgroundColor: p.color,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Dressing Sparkles — shown when opening wardrobe (front view) */}
      {dressingSparkles.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 1,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '48px',
            width: '96px',
            height: '128px',
          }}
          aria-hidden="true"
        >
          {dressingSparkles.map((s) => (
            <svg
              key={s.id}
              className="dressing-sparkle absolute"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: `${s.delay}ms`,
                color: s.color,
              }}
            >
              <path d="M12 2 L13.7 10.3 L22 12 L13.7 13.7 L12 22 L10.3 13.7 L2 12 L10.3 10.3 Z" />
            </svg>
          ))}
        </div>
      )}

      {/* Mobile X button to hide mascot */}
      {!isMobileHidden && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeMascottePanels();
            setIsMobileHidden(true);
          }}
          className="sm:hidden fixed flex items-center justify-center rounded-full border border-white/50 bg-black/45 text-white shadow-[0_4px_12px_rgba(0,0,0,0.24)] ring-1 ring-black/15 backdrop-blur-md transition-all hover:scale-105 hover:bg-black/55 active:scale-95"
          style={{
            zIndex: Z_INDEX.mascotteBase + 2,
            bottom: isStickyBarVisible ? '182px' : '122px',
            right: '42px',
            width: '30px',
            height: '30px',
          }}
          aria-label="Chiudi Asso"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      )}

      {/* Mobile launcher when Asso is hidden */}
      {isMobileHidden && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileHidden(false);
          }}
          className="sm:hidden fixed flex items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-[#FF7300] to-[#FF9A40] text-white shadow-[0_10px_24px_rgba(255,115,0,0.4)] transition-all hover:scale-105 active:scale-95"
          style={{
            zIndex: Z_INDEX.mascotteBase + 2,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '16px',
            width: '56px',
            height: '56px',
            animation: 'promoPulse 2.2s ease-in-out infinite',
          }}
          aria-label="Apri Asso"
          title="Apri Asso"
        >
          <span className="font-comodo text-[11px] font-bold tracking-[0.18em]">ASSO</span>
        </button>
      )}

      {/* Golden Confetti — Easter Egg at 100 flips */}
      {goldenConfetti.length > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip + 5,
            bottom: isStickyBarVisible ? '80px' : '20px',
            right: '48px',
            width: '96px',
            height: '200px',
          }}
        >
          {goldenConfetti.map((c) => (
            <div
              key={c.id}
              className="golden-confetti absolute"
              style={{
                left: `${c.x}px`,
                top: '100%',
                width: `${c.size}px`,
                height: `${c.size * 0.6}px`,
                backgroundColor: c.color,
                borderRadius: c.size > 7 ? '1px' : '50%',
                transform: `rotate(${c.rotation}deg)`,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                boxShadow: `0 0 ${c.size}px ${c.color}60`,
              }}
            />
          ))}
        </div>
      )}

      {/* Card Mascotte */}
      <div
        ref={cardRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        className={`fixed cursor-pointer select-none transition-all duration-300 ${justReappeared ? 'mascotte-reappear' : ''} ${easterEggActive ? 'mascotte-backflip' : ''} ${isShiny ? 'mascotte-shiny' : ''}`}
        style={{
          zIndex: isOverlayVisible ? Z_INDEX.mascotteOverlay : Z_INDEX.mascotteBase,
          bottom: isStickyBarVisible ? '80px' : '20px',
          right: '48px',
          width: '96px',
          height: '128px',
          perspective: '600px',
          filter: 'drop-shadow(0 12px 32px rgba(255, 115, 0, 0.35)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
          animation: isMobileHidden ? undefined : (justReappeared
            ? 'mascotteReappear 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, mascotteFloat 3s ease-in-out infinite 500ms'
            : 'mascotteFloat 3s ease-in-out infinite'),
          transition: 'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-in-out, transform 300ms ease-in-out',
          // Hide mascot when external modal is open (AuctionBidModal)
          opacity: isExternalModalOpen ? 0 : 1,
          pointerEvents: isExternalModalOpen ? 'none' : 'auto',
          // On mobile, hide Asso completely and show circular launcher
          transform: isMobileHidden ? 'translateX(calc(100% + 84px))' : 'translateX(0)',
        }}
        role="button"
        tabIndex={0}
        aria-label="Segnala un bug"
        title="Segnala un bug"
      >
        {/* 3D flip inner */}
        <div
          className="mascotte-flip-inner relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: isFlipping || easterEggActive
              ? 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 150ms ease-out',
            transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 + tilt.y : tilt.y}deg)`,
          }}
        >

        {/* ── FRONT FACE ── */}
        <div
          className="mascotte-flip-face absolute inset-0"
          style={{ 
            backfaceVisibility: isMobileView && isFlipped ? 'visible' : 'hidden', 
            pointerEvents: isFlipped ? 'none' : 'auto',
            opacity: isMobileView && isFlipped ? 0.3 : 1,
            transform: isMobileView && isFlipped ? 'rotateY(-30deg)' : 'rotateY(0deg)',
            transition: isMobileView ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease' : 'none',
          }}
        >
        {/* Card container — soft charm style */}
        <div
          className="relative h-full w-full overflow-visible rounded-2xl"
          style={{ background: 'transparent' }}
        >
          {/* Soft warm glow */}
          <div
            className="pointer-events-none absolute rounded-2xl"
            style={{
              inset: '-3px',
              zIndex: 0,
              boxShadow: isShiny
                ? '0 0 28px rgba(168,85,247,0.5), 0 0 56px rgba(59,130,246,0.3), 0 0 84px rgba(236,72,153,0.2)'
                : `0 6px 24px ${selectedFaceColor.glowSoft}, 0 2px 8px rgba(0,0,0,0.15)`,
              transition: 'box-shadow 300ms ease',
            }}
          />

          {/* Shiny rainbow border overlay */}
          {isShiny && (
            <div
              className="pointer-events-none absolute shiny-border-anim"
              style={{
                inset: '-3px',
                zIndex: 12,
                borderRadius: '18px',
                padding: '2.5px',
                background: 'conic-gradient(from var(--shiny-angle, 0deg), #f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #ec4899, #f43f5e)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          )}

          {/* Thin soft border */}
          <div
            className="pointer-events-none absolute rounded-2xl"
            style={{
              inset: '0px',
              zIndex: 2,
              padding: '1.5px',
              background: `linear-gradient(160deg, ${selectedFaceColor.glowMid} 0%, ${selectedFaceColor.glowStrong} 50%, ${selectedFaceColor.glowMid} 100%)`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* Bottom pill badge — ASSO */}
          <div
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${isCardHovered ? 'asso-pill-hovered' : ''}`}
            style={{ bottom: '5px', zIndex: 8 }}
          >
            <div
              className={`relative flex items-center justify-center overflow-full asso-pill-${mascotteExpression}`}
              style={{
                height: '14px',
                paddingInline: '8px',
                background: mascotteExpression === 'bugReport' || mascotteExpression === 'bugFocus'
                  ? 'linear-gradient(180deg, #DC2626 0%, #EF4444 100%)'
                  : mascotteExpression === 'coding'
                  ? 'linear-gradient(180deg, #7C3AED 0%, #A78BFA 100%)'
                  : mascotteExpression === 'sleeping'
                  ? 'linear-gradient(180deg, #4B5563 0%, #9CA3AF 100%)'
                  : mascotteExpression === 'wink'
                  ? 'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)'
                  : 'linear-gradient(180deg, #FF7300 0%, #FF9A40 100%)',
                boxShadow: mascotteExpression === 'bugReport' || mascotteExpression === 'bugFocus'
                  ? '0 -1px 4px rgba(220,38,38,0.3), inset 0 -1px 0 rgba(255,255,255,0.25)'
                  : mascotteExpression === 'coding'
                  ? '0 -1px 4px rgba(124,58,237,0.3), inset 0 -1px 0 rgba(255,255,255,0.25)'
                  : mascotteExpression === 'sleeping'
                  ? '0 -1px 4px rgba(75,85,99,0.2), inset 0 -1px 0 rgba(255,255,255,0.2)'
                  : mascotteExpression === 'wink'
                  ? '0 -1px 4px rgba(236,72,153,0.3), inset 0 -1px 0 rgba(255,255,255,0.25)'
                  : '0 -1px 4px rgba(255,100,0,0.2), inset 0 -1px 0 rgba(255,255,255,0.25)',
                animation: 'asso-pulse 3s ease-in-out infinite',
                borderRadius: '9999px',
              }}
            >
              <span
                className="font-comodo text-[7.5px] font-bold leading-none"
                style={{
                  color: '#fff',
                  textShadow: mascotteExpression === 'sleeping'
                    ? '0 1px 1px rgba(30,30,30,0.35)'
                    : '0 1px 1px rgba(100,30,0,0.45)',
                  letterSpacing: '0.2em',
                  marginLeft: '0.1em',
                }}
              >
                {mascotteExpression === 'sleeping' ? 'Zzz' : 'ASSO'}
              </span>
            </div>
          </div>

          {/* Face SVG — parallax offset on hover */}
          <div
            ref={faceContainerRef}
            className={`absolute flex items-center justify-center ${isModalOpen ? 'face-glint-active' : ''} face-fixed-neon`}
            style={{
              top: '4px',
              bottom: '4px',
              left: '3px',
              right: '3px',
              zIndex: 5,
              transition: 'transform 120ms ease-out, opacity 500ms ease-in-out',
              transform: mascotteExpression === 'wink'
                ? `translate(${tilt.y * 0.25}px, ${tilt.x * -0.2 - 2}px) rotate(-2deg)`
                : `translate(${tilt.y * 0.25}px, ${tilt.x * -0.2}px)`,
              opacity: mascotteExpression === 'sleeping' ? 0.85 : 1,
              filter: 'none',
            }}
            dangerouslySetInnerHTML={{
              __html: mascotteExpression === 'bugFocus' ? faceBugFocusSVG :
                      mascotteExpression === 'bugReport' ? faceBugReportSVG :
                      mascotteExpression === 'wink' ? faceWinkSVG :
                      mascotteExpression === 'coding' ? faceCodingSVG :
                      mascotteExpression === 'sleeping' ? faceSleepSVG :
                      mascotteExpression === 'shocked' ? faceShockedSVG :
                      faceSVG
            }}
          />

          {/* Wardrobe overlays aligned to 96x128 mascot base */}
          {equippedWardrobeItems.map((item) => (
            <div
              key={item.id}
              aria-hidden="true"
              style={getItemOverlayStyle(item, equippedItems.objects)}
            >
              <div
                className={`equipped-item-layer ${
                  item.category === 'objects'
                    ? 'equipped-item-float'
                    : item.category === 'accessories'
                    ? 'equipped-item-breathe'
                    : ''
                } ${getItemRenderClassName(item)}`}
                style={{
                  width: '100%',
                  height: '100%',
                  ...getItemRenderEnhancementStyle(item),
                }}
                dangerouslySetInnerHTML={{ __html: item.svg }}
              />
            </div>
          ))}

          {/* Flip button: desktop on hover, mobile always visible when not flipped */}
          {(isMobileView ? !isFlipped : isCardHovered && !isFlipped) && (
            <button
              onClick={handleFlipButtonClick}
              className={`mascotte-flip-btn absolute z-[11] flex items-center justify-center rounded-full border text-white shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:text-white ${
                isMobileView
                  ? 'h-8 w-8 border-white/45 bg-black/55 text-white'
                  : 'h-5 w-5 border-white/20 bg-zinc-900/60 text-white/70 hover:bg-zinc-800/80'
              }`}
              style={isMobileView ? { bottom: '6px', left: '6px' } : { bottom: '3px', left: '3px' }}
              title="Gira la carta"
              aria-label="Gira la carta"
            >
              <svg
                width={isMobileView ? '14' : '10'}
                height={isMobileView ? '14' : '10'}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={isMobileView ? '2.2' : '2.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
            </button>
          )}
        </div>
        </div>{/* end front face */}

        {/* ── BACK FACE ── */}
        <div
          ref={backFaceRef}
          className="mascotte-flip-face absolute inset-0"
          style={{ 
            backfaceVisibility: isMobileView ? 'visible' : 'hidden', 
            transform: isMobileView 
              ? (isFlipped ? 'translateX(0)' : 'translateX(120%)')
              : 'rotateY(180deg)',
            opacity: isMobileView ? (isFlipped ? 1 : 0) : 1,
            pointerEvents: isFlipped ? 'auto' : 'none',
            transition: isMobileView 
              ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease' 
              : 'none',
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-2xl"
            style={{ background: BACK_VARIANTS[backVariant].gradient }}
          >
            {/* Holographic overlay — GOLD only */}
            {BACK_VARIANTS[backVariant].label === 'GOLD' && (
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl holo-overlay"
                style={{
                  background: `radial-gradient(circle at ${holoPos.x}% ${holoPos.y}%, rgba(255,255,255,0.35) 0%, rgba(168,85,247,0.2) 20%, rgba(59,130,246,0.2) 40%, rgba(16,185,129,0.15) 60%, rgba(245,158,11,0.1) 80%, transparent 100%)`,
                  mixBlendMode: 'overlay',
                  transition: 'background 150ms ease-out',
                }}
              />
            )}

            {/* Flip counter badge (top-right) */}
            <div className="absolute right-2 top-2 inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-white/25 px-2 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white">{flipCount}</span>
            </div>

            {/* Album button (top-left) */}
            <button
              onClick={handleAlbumToggle}
              className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-sm transition-all hover:scale-110 ${showAlbum ? 'bg-white/40' : 'bg-white/25'}`}
              title="Collezione"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>

            {/* Title block */}
            <div className="pointer-events-none absolute inset-x-2 top-8 flex flex-col items-center text-center">
              <svg className="mascotte-back-sparkle mb-1" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="white" fillOpacity="0.95" />
              </svg>
              <span className="font-comodo text-[12px] font-bold tracking-wide text-white/95">
                {BACK_VARIANTS[backVariant].label}
              </span>
              <span className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.2em] text-white/70">
                {BACK_VARIANTS[backVariant].sub}
              </span>
            </div>

            {/* Action buttons */}
            <div className="absolute inset-x-2 bottom-2.5 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGameModeMenu(false);
                  setIsWardrobeOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setIsFlipping(true);
                      setIsFlipped(false);
                      window.setTimeout(() => setIsFlipping(false), 650);
                      const palette = ['#FF7300', '#FFA246', '#FFB26B', '#fcd34d', '#ffffff'];
                      const sparkles = Array.from({ length: 6 }, (_, i) => ({
                        id: Date.now() + i,
                        left: 18 + Math.random() * 60,
                        top: 12 + Math.random() * 74,
                        delay: i * 55 + Math.floor(Math.random() * 60),
                        size: 9 + Math.random() * 7,
                        color: palette[Math.floor(Math.random() * palette.length)],
                      }));
                      setDressingSparkles(sparkles);
                      if (dressingSparklesTimeoutRef.current !== null) {
                        window.clearTimeout(dressingSparklesTimeoutRef.current);
                      }
                      dressingSparklesTimeoutRef.current = window.setTimeout(() => {
                        setDressingSparkles([]);
                        dressingSparklesTimeoutRef.current = null;
                      }, 1300);
                    }
                    return next;
                  });
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/35 text-white transition hover:scale-105 hover:bg-black/50"
                title="Apri guardaroba"
                aria-label="Apri guardaroba"
              >
                <Shirt className="h-4 w-4" />
                <span className="sr-only">Apri guardaroba</span>
              </button>

              <button
                ref={playButtonRef}
                type="button"
                onClick={() => {
                  if (!showGameModeMenu && playButtonRef.current) {
                    const rect = playButtonRef.current.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 8,
                      left: rect.left + rect.width / 2
                    });
                  }
                  setShowGameModeMenu(prev => !prev);
                }}
                disabled={isCheckingArenaPlayers}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/35 text-white transition hover:scale-105 hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-60"
                title="Avvia mini-gioco"
                aria-label="Avvia mini-gioco"
              >
                {isCheckingArenaPlayers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span className="sr-only">Avvia mini-gioco</span>
              </button>
              
              {/* Game Mode Selector Dropdown - Ported to body to escape 3D context */}
              {showGameModeMenu && menuPosition && typeof document !== 'undefined' && createPortal(
                <div 
                  ref={gameModeMenuRef}
                  className="fixed w-48 rounded-lg border border-white/20 bg-black/95 backdrop-blur-md shadow-2xl overflow-hidden"
                  style={{
                    bottom: window.innerHeight - menuPosition.top + 8,
                    left: menuPosition.left,
                    transform: 'translateX(-50%)',
                    zIndex: 2147483647 // Maximum safe z-index
                  }}
                >
                  <div className="p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGameModeMenu(false);
                        handlePlayArena();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-[11px] text-white/90 hover:bg-white/10 transition"
                    >
                      <span className="text-base">🎮</span>
                      <div>
                        <div className="font-semibold">Single Player</div>
                        <div className="text-[9px] text-white/50">vs CPU locale</div>
                      </div>
                    </button>
                    <div className="h-px bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowGameModeMenu(false);
                        setIsP2POpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-[11px] text-white/90 hover:bg-primary/20 transition group"
                    >
                      <span className="text-base group-hover:scale-110 transition">⚔️</span>
                      <div>
                        <div className="font-semibold text-primary">1v1 LAN</div>
                        <div className="text-[9px] text-white/50">vs Amico in rete</div>
                      </div>
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>{/* end back face */}

        </div>{/* end flip inner */}

        {/* PC Icon - appears when coding mode */}
        {showCodingCompanion && (
          <div
            className="coding-companion absolute -left-[154px] top-1/2 z-[8] -translate-y-1/2"
          >
            <div className="w-36 rounded-xl border border-primary/45 bg-zinc-900/85 p-2 shadow-xl shadow-primary/20 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 rounded-full bg-marquee" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                </div>
                <span className={`text-[10px] font-medium ${codingStatus === 'received' ? 'text-emerald-300' : 'text-zinc-300'}`}>
                  {codingStatus === 'received' ? 'Ricevuto' : 'Compilo...'}
                </span>
              </div>

              <div className="rounded-md border border-white/10 bg-zinc-950/80 p-2">
                {codingStatus === 'received' ? (
                  <div className="coding-received rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-semibold">Report ricevuto</span>
                    </div>
                    <p className="mt-1 text-[9px] leading-relaxed text-zinc-200">
                      push bugfix/report done • ticket creato
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="coding-line coding-line-1" />
                    <div className="coding-line coding-line-2" />
                    <div className="coding-line coding-line-3" />
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9px] text-zinc-500">$</span>
                      <span className="coding-cursor h-2.5 w-1 rounded-[2px] bg-primary" />
                    </div>
                  </>
                )}
              </div>

              <div className="mx-auto mt-1.5 h-1.5 w-14 rounded-full bg-zinc-500/35" />
            </div>
          </div>
        )}
      </div>

      {/* Bug Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" style={{ zIndex: Z_INDEX.modal, animation: `bugModalBackdropIn ${BUG_MODAL_FADE_MS}ms ease-out forwards` }}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl" style={{ animation: `bugModalPanelIn ${BUG_MODAL_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` }}>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bug className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-comodo text-lg tracking-wide text-black">
                    Segnala un bug
                  </h3>
                  <p className="text-xs text-gray-500">
                    Aiutaci a migliorare BRX
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setScreenshot(null);
                  setSubmitted(false);
                  setShowConsoleLogs(false);
                  setHasConsoleLogs(false);
                  resetCodingCompanion();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                onFocusCapture={() => setIsBugFormFocused(true)}
                onBlurCapture={(e) => {
                  const nextFocused = e.relatedTarget as Node | null;
                  if (!nextFocused || !e.currentTarget.contains(nextFocused)) {
                    setIsBugFormFocused(false);
                  }
                }}
                className="max-h-[70vh] overflow-y-auto pr-2"
              >
                {/* Nome e Email */}
                <div className="mb-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Il tuo nome</label>
                    <input
                      type="text"
                      required
                      value={bugForm.name}
                      onChange={(e) => setBugForm({ ...bugForm, name: e.target.value })}
                      placeholder="Mario Rossi"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={bugForm.email}
                      onChange={(e) => setBugForm({ ...bugForm, email: e.target.value })}
                      placeholder="tua@email.com"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Tipo e Priorità */}
                <div className="mb-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Tipo di problema</label>
                    <select
                      value={bugForm.bugType}
                      onChange={(e) => setBugForm({ ...bugForm, bugType: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="functional">Malfunzionamento</option>
                      <option value="visual">Problema visivo/UI</option>
                      <option value="performance">Performance lente</option>
                      <option value="payment">Problema pagamento</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Priorità</label>
                    <select
                      value={bugForm.priority}
                      onChange={(e) => setBugForm({ ...bugForm, priority: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="low">Bassa - Miglioramento</option>
                      <option value="medium">Media - Funzionalità limitata</option>
                      <option value="high">Alta - Bloccante</option>
                    </select>
                  </div>
                </div>

                {/* Oggetto */}
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Oggetto</label>
                  <input
                    type="text"
                    required
                    value={bugForm.subject}
                    onChange={(e) => setBugForm({ ...bugForm, subject: e.target.value })}
                    placeholder="Descrivi brevemente il problema"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Descrizione */}
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Descrizione dettagliata</label>
                  <textarea
                    required
                    value={bugForm.message}
                    onChange={(e) => setBugForm({ ...bugForm, message: e.target.value })}
                    placeholder="Descrivi il problema in dettaglio: cosa stavi facendo, cosa ti aspettavi, cosa è successo invece..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* URL */}
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">URL della pagina</label>
                  <input
                    type="url"
                    value={bugForm.url}
                    onChange={(e) => setBugForm({ ...bugForm, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-gray-500">L&apos;URL ci aiuta a identificare esattamente dove si è verificato il problema.</p>
                </div>

                {/* Screenshot preview */}
                {screenshot && (
                  <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-gray-600">Screenshot allegato</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Rimuovi
                      </button>
                    </div>
                    <img src={screenshot} alt="Screenshot" className="max-h-32 rounded-lg object-contain" />
                  </div>
                )}

                {/* Console logs */}
                {hasConsoleLogs && (
                  <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          Log console disponibili ({getRecentLogs(60).length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConsoleLogs(!showConsoleLogs)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {showConsoleLogs ? 'Nascondi' : 'Mostra'}
                      </button>
                    </div>
                    {showConsoleLogs && capturedLogs.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded border border-blue-200 bg-white p-2 font-mono text-xs">
                        {getRecentLogs(60).map((log, i) => (
                          <div 
                            key={i} 
                            className={`mb-1 border-b border-gray-100 pb-1 last:border-0 ${
                              log.type === 'error' ? 'text-red-600' : 
                              log.type === 'warn' ? 'text-yellow-600' : 
                              'text-gray-700'
                            }`}
                          >
                            <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                            <span className="opacity-75">[{log.type.toUpperCase()}]</span>{' '}
                            {log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Azioni */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={captureScreenshot}
                    disabled={isCapturing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {isCapturing ? 'Catturando...' : 'Scatta screenshot'}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSubmitted(false);
                      setScreenshot(null);
                      setHasConsoleLogs(false);
                      setShowConsoleLogs(false);
                      setBugForm({ name: '', email: '', subject: '', message: '', bugType: 'functional', priority: 'medium', url: '' });
                      resetCodingCompanion();
                    }}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={!bugForm.message.trim() || !bugForm.name.trim() || !bugForm.email.trim() || !bugForm.subject.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Invia segnalazione
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-black">Grazie per il feedback!</p>
                <p className="text-sm text-gray-500">
                  Esamineremo la segnalazione al più presto.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Modal - Asso Assistant */}
      {showChatModal && (
        <div className="fixed inset-0 flex items-end justify-end p-4 sm:items-center sm:justify-center" style={{ zIndex: Z_INDEX.modal }}>
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleChatModalClose}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
            {/* Header - Clean, minimal, no animations */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-primary" />
                <div>
                  <h3 className="font-comodo text-base font-medium text-zinc-900">Asso</h3>
                  <p className="text-xs text-zinc-500">Assistente Ebartex</p>
                </div>
              </div>
              <button
                onClick={handleChatModalClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages - Clean styling with fade-in animations */}
            <div className="max-h-[360px] min-h-[320px] overflow-y-auto bg-zinc-50 p-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 flex chat-message-in ${msg.type === 'asso' ? 'justify-start' : 'justify-end'}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.type === 'asso'
                        ? 'rounded-tl-none bg-white text-zinc-800 border border-zinc-200'
                        : 'rounded-tr-none bg-primary text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator - shows when Asso is typing */}
              {isTyping && (
                <div className="mb-3 flex justify-start chat-message-in">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white border border-zinc-200 px-4 py-3">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Typewriter effect - live text being typed */}
              {isTypewriting && typewriterText && (
                <div className="mb-3 flex justify-start chat-message-in">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white text-zinc-800 border border-zinc-200 px-4 py-2.5 text-sm">
                    {typewriterText}
                    <span className="typing-cursor inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}
              
              {/* Menu Options - Animated staggered entrance */}
              {chatStep === 'menu' && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setChatMessages(prev => [...prev, { type: 'user', text: 'Voglio leggere le FAQ' }]);
                      setTimeout(() => {
                        handleChatModalClose();
                        window.location.href = '/aiuto';
                      }, 300);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 menu-option-in"
                    style={{ animationDelay: '0ms' }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">Leggi le FAQ</p>
                      <p className="text-xs text-zinc-500">Trova risposte rapide</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setChatMessages(prev => [...prev, { type: 'user', text: 'Voglio segnalare un bug' }]);
                      setChatStep('bug');
                      setShowChatModal(false);
                      setShowCodingCompanion(true);
                      setCodingStatus('compiling');
                      setIsCodingTransition(true);

                      if (codingTransitionTimeoutRef.current !== null) {
                        window.clearTimeout(codingTransitionTimeoutRef.current);
                      }

                      codingTransitionTimeoutRef.current = window.setTimeout(() => {
                        setIsCodingTransition(false);
                        setIsModalOpen(true);
                        codingTransitionTimeoutRef.current = null;
                      }, CODING_PREVIEW_MS);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 menu-option-in"
                    style={{ animationDelay: '80ms' }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Bug className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">Segnala un bug</p>
                      <p className="text-xs text-zinc-500">Descrivi un problema tecnico</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setChatMessages(prev => [...prev, { type: 'user', text: 'Voglio contattare il supporto' }]);
                      setChatStep('contact');
                      setTimeout(() => {
                        setShowChatModal(false);
                        window.location.href = '/aiuto?tab=contact';
                      }, 300);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50 menu-option-in"
                    style={{ animationDelay: '160ms' }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">Contatta supporto</p>
                      <p className="text-xs text-zinc-500">Scrivi al nostro team</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Footer - Clean */}
            <div className="border-t border-zinc-200 bg-white px-4 py-3">
              <p className="text-center text-xs text-zinc-400">
                Asso è qui per aiutarti. Scegli un&apos;opzione sopra.
              </p>
            </div>
          </div>
        </div>
      )}

      <KakeguruiArena
        key={arenaMatchId ?? 'arena-idle'}
        open={isArenaOpen}
        onClose={() => {
          setIsArenaOpen(false);
          setArenaMatchId(null);
          setArenaGateMessage('Pronto: puoi premere Play');
        }}
        playerName={authUser?.name?.trim() || 'Tu'}
        opponentName={arenaOpponentName}
      />

      <KakeguruiP2P
        open={isP2POpen}
        onClose={() => {
          setIsP2POpen(false);
          setArenaGateMessage('Pronto: puoi premere Play');
        }}
      />

      {/* Float animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mascotteFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(1deg); }
          75% { transform: translateY(-2px) rotate(-1deg); }
        }
        @keyframes mascotteReappear {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          50% { opacity: 1; transform: scale(1.15) translateY(-8px); }
          70% { transform: scale(0.95) translateY(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes previewSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes previewFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }
        @keyframes bugModalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bugModalPanelIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes codingCompanionIn {
          from { opacity: 0; transform: translateY(8px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes codingLine1 {
          0%, 100% { width: 56%; opacity: 0.55; }
          50% { width: 74%; opacity: 0.9; }
        }
        @keyframes codingLine2 {
          0%, 100% { width: 72%; opacity: 0.5; }
          50% { width: 52%; opacity: 0.9; }
        }
        @keyframes codingLine3 {
          0%, 100% { width: 42%; opacity: 0.45; }
          50% { width: 62%; opacity: 0.88; }
        }
        @keyframes codingCursor {
          0%, 45% { opacity: 1; }
          46%, 100% { opacity: 0.25; }
        }
        @keyframes codingReceivedIn {
          from { opacity: 0; transform: translateY(4px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bugGlintSweep {
          0% { opacity: 0; transform: translateX(-3px); }
          45% { opacity: 0.9; }
          100% { opacity: 0; transform: translateX(4px); }
        }
        @keyframes codingMouthPulse {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.92; }
          50% { transform: translateY(-0.6px) scaleX(0.96); opacity: 1; }
        }
        @keyframes bugMouthSip {
          0%, 100% { transform: translateY(0) scale(1, 1); opacity: 0.92; }
          45% { transform: translateY(-0.4px) scale(0.9, 1.12); opacity: 1; }
        }
        .coding-companion {
          animation: codingCompanionIn 280ms ease-out;
        }
        .coding-line {
          height: 4px;
          border-radius: 9999px;
          margin-bottom: 6px;
          background: linear-gradient(90deg, rgba(255, 115, 0, 0.92), rgba(243, 199, 106, 0.9));
        }
        .coding-line-1 {
          animation: codingLine1 1800ms ease-in-out infinite;
        }
        .coding-line-2 {
          animation: codingLine2 1700ms ease-in-out infinite;
        }
        .coding-line-3 {
          margin-bottom: 0;
          animation: codingLine3 1900ms ease-in-out infinite;
        }
        .coding-cursor {
          animation: codingCursor 1200ms step-end infinite;
        }
        .coding-received {
          animation: codingReceivedIn 220ms ease-out;
        }
        .bug-glint {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
        }
        .face-fixed-neon svg {
          filter: drop-shadow(0 0 1px ${selectedFaceColor.glowStrong}) drop-shadow(0 0 2px ${selectedFaceColor.glowMid});
        }
        .face-fixed-neon .face-halo {
          opacity: 1;
          stroke: #1e3a8a !important;
          stroke-width: 0.9 !important;
        }
        .face-fixed-neon .face-line {
          stroke: ${selectedFaceColor.line} !important;
        }
        .face-fixed-neon .pupil {
          fill: ${selectedFaceColor.pupil} !important;
          stroke: none !important;
        }
        .face-fixed-neon .pupil-highlight {
          fill: ${selectedFaceColor.highlight} !important;
          stroke: none !important;
        }
        .face-glint-active .bug-glint {
          animation: bugGlintSweep 700ms ease-out 120ms 1 both;
        }
        .bug-glint-2 {
          animation-delay: 260ms;
        }
        .coding-mouth {
          transform-box: fill-box;
          transform-origin: center;
          animation: codingMouthPulse 1.1s ease-in-out infinite;
        }
        .bug-mouth {
          transform-box: fill-box;
          transform-origin: center;
          animation: bugMouthSip 1.05s ease-in-out infinite;
        }
        @keyframes chatMessageIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .chat-message-in {
          animation: chatMessageIn 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 16px;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #a1a1aa;
          border-radius: 50%;
          animation: typingBounce 1.1s ease-in-out infinite;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0ms; }
        .typing-indicator span:nth-child(2) { animation-delay: 150ms; }
        .typing-indicator span:nth-child(3) { animation-delay: 300ms; }
        @keyframes menuOptionIn {
          from { opacity: 0; transform: translateX(-16px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .menu-option-in {
          animation: menuOptionIn 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        @keyframes hintPopIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.92); }
          70% { opacity: 1; transform: translateX(-50%) translateY(-3px) scale(1.02); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .hint-bubble {
          animation: hintPopIn 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes backSparkleRotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .mascotte-back-sparkle {
          animation: backSparkleRotate 4s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.5));
        }
        .mascotte-flip-face {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        @keyframes flipParticleBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--particle-dx), var(--particle-dy)) scale(0);
          }
        }
        .flip-particle {
          border-radius: 50%;
          animation: flipParticleBurst 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          filter: blur(0.5px);
          box-shadow: 0 0 4px currentColor;
        }
        @keyframes dressingSparkle {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(0deg); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.15) rotate(90deg); }
          65% { opacity: 1; transform: translate(-50%, -50%) scale(0.9) rotate(200deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(320deg); }
        }
        .dressing-sparkle {
          animation: dressingSparkle 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 10px currentColor);
          transform-origin: center;
          opacity: 0;
          will-change: transform, opacity;
        }
        @keyframes achievementIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes achievementOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        @keyframes comboPopIn {
          0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.15) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes flipBtnIn {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        .mascotte-flip-btn {
          animation: flipBtnIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes unlockFlash {
          0% { opacity: 0; transform: scale(0.7) translateY(10px); filter: brightness(2); }
          15% { opacity: 1; transform: scale(1.08) translateY(-2px); filter: brightness(1.5); }
          30% { opacity: 1; transform: scale(1) translateY(0); filter: brightness(1); }
          80% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.95) translateY(-12px); }
        }
        .unlock-badge {
          box-shadow: 0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2);
        }
        @keyframes albumSlideIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .holo-overlay {
          animation: holoShimmer 3s ease-in-out infinite;
        }
        @keyframes holoShimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes mascotteBackflip {
          0% { transform: rotateY(0deg) scale(1); filter: drop-shadow(0 12px 32px rgba(255,115,0,0.35)); }
          20% { transform: rotateY(0deg) translateY(-30px) scale(1.1); filter: drop-shadow(0 20px 40px rgba(255,215,0,0.6)); }
          50% { transform: rotateY(180deg) translateY(-40px) scale(1.15); filter: drop-shadow(0 24px 48px rgba(255,215,0,0.8)); }
          80% { transform: rotateY(360deg) translateY(-15px) scale(1.05); filter: drop-shadow(0 16px 36px rgba(255,215,0,0.5)); }
          100% { transform: rotateY(360deg) translateY(0) scale(1); filter: drop-shadow(0 12px 32px rgba(255,115,0,0.35)); }
        }
        .mascotte-backflip {
          animation: mascotteBackflip 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
        }
        @keyframes goldenConfettiFall {
          0% { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.5); }
          10% { opacity: 1; transform: translateY(-20px) rotate(40deg) scale(1); }
          100% { opacity: 0; transform: translateY(-220px) rotate(720deg) scale(0.3); }
        }
        .golden-confetti {
          animation: goldenConfettiFall 2s ease-out forwards;
        }
        @property --shiny-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes shinyBorderSpin {
          to { --shiny-angle: 360deg; }
        }
        .shiny-border-anim {
          animation: shinyBorderSpin 1.5s linear infinite, shinyPulse 0.8s ease-in-out infinite alternate;
        }
        @keyframes shinyPulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .mascotte-shiny {
          filter: drop-shadow(0 12px 32px rgba(168,85,247,0.4)) drop-shadow(0 0 20px rgba(236,72,153,0.3)) drop-shadow(0 4px 12px rgba(59,130,246,0.3)) !important;
        }
        @keyframes bandSheenSweep {
          0% { transform: translateX(-120%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        .mascotte-band-sheen {
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 46%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.45) 54%, transparent 70%);
          opacity: 0;
          transform: translateX(-120%);
        }
        [aria-label="Segnala un bug"]:hover .mascotte-band-sheen {
          animation: bandSheenSweep 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        /* Sleep Bubbles animation */
        @keyframes sleepBubbleFloat {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0) scale(0.7);
          }
          15% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
          85% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
            transform: translateY(-35px) translateX(8px) scale(1.05);
          }
        }
        @keyframes sleepBubbleWobble {
          0%, 100% {
            transform: rotate(-2deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }
        .sleep-bubbles-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .sleep-bubble {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%);
          border: 1.5px solid rgba(99, 102, 241, 0.3);
          box-shadow: 
            0 2px 8px rgba(99, 102, 241, 0.25),
            0 4px 12px rgba(99, 102, 241, 0.15),
            inset 0 1px 2px rgba(255, 255, 255, 0.6);
          animation: sleepBubbleFloat 2.8s ease-in-out infinite;
        }
        .sleep-bubble-large {
          width: 42px;
          height: 28px;
          border-radius: 20px 20px 20px 8px;
          animation-delay: 0ms;
        }
        .sleep-bubble-large::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 6px;
          width: 8px;
          height: 6px;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 50%;
        }
        .sleep-bubble-small {
          width: 26px;
          height: 20px;
          border-radius: 14px 14px 14px 4px;
          margin-left: 18px;
          animation-delay: 1.2s;
        }
        .sleep-bubble-small::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 4px;
          width: 5px;
          height: 4px;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 50%;
        }
        .sleep-bubble-text {
          font-weight: 700;
          color: #4f46e5;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }
        .sleep-bubble-large .sleep-bubble-text {
          font-size: 11px;
          letter-spacing: -0.3px;
        }
        .sleep-bubble-small .sleep-bubble-text {
          font-size: 9px;
        }
        /* ASSO pill badge animations */
        @keyframes asso-pulse {
          0%, 100% { box-shadow: 0 -1px 4px rgba(0,0,0,0.15), inset 0 -1px 0 rgba(255,255,255,0.25); }
          50% { box-shadow: 0 -1px 6px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.2); }
        }
        @keyframes asso-pulse-intense-orange {
          0%, 100% { box-shadow: 0 -1px 6px rgba(255,100,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(255,154,64,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(255,100,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(255,154,64,0.7), 0 0 24px rgba(255,115,0,0.3); }
        }
        @keyframes asso-pulse-intense-red {
          0%, 100% { box-shadow: 0 -1px 6px rgba(220,38,38,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(239,68,68,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(220,38,38,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(239,68,68,0.7), 0 0 24px rgba(220,38,38,0.3); }
        }
        @keyframes asso-pulse-intense-purple {
          0%, 100% { box-shadow: 0 -1px 6px rgba(124,58,237,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(167,139,250,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(124,58,237,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(167,139,250,0.7), 0 0 24px rgba(124,58,237,0.3); }
        }
        @keyframes asso-pulse-intense-gray {
          0%, 100% { box-shadow: 0 -1px 6px rgba(75,85,99,0.3), inset 0 -1px 0 rgba(255,255,255,0.3), 0 0 12px rgba(156,163,175,0.4); }
          50% { box-shadow: 0 -1px 10px rgba(75,85,99,0.5), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 18px rgba(156,163,175,0.6), 0 0 24px rgba(75,85,99,0.25); }
        }
        @keyframes asso-pulse-intense-pink {
          0%, 100% { box-shadow: 0 -1px 6px rgba(236,72,153,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(244,114,182,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(236,72,153,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(244,114,182,0.7), 0 0 24px rgba(236,72,153,0.3); }
        }
        @keyframes asso-shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .asso-pill-hovered > div {
          transform: scale(1.08);
          transition: transform 200ms ease-out;
        }
        .asso-pill-hovered > div > div:first-child {
          animation: asso-shimmer-fast 1s ease-in-out infinite !important;
        }
        /* State-specific hover pulse animations */
        .asso-pill-hovered .asso-pill-normal { animation: asso-pulse-intense-orange 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-bugReport,
        .asso-pill-hovered .asso-pill-bugFocus { animation: asso-pulse-intense-red 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-coding { animation: asso-pulse-intense-purple 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-sleeping { animation: asso-pulse-intense-gray 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-wink { animation: asso-pulse-intense-pink 0.8s ease-in-out infinite !important; }
        /* Promotional hint premium animations */
        @keyframes promoPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.98); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes promoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes promoShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes promoSparkle {
          0%, 100% { opacity: 0.6; transform: scale(0.9) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(15deg); }
        }
        @keyframes promoGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(255,115,0,0.4), 0 4px 16px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 12px 40px rgba(255,115,0,0.6), 0 6px 20px rgba(0,0,0,0.25), 0 0 30px rgba(255,154,64,0.3); }
        }
        /* Sleep mode dreamy animations */
        @keyframes sleepGlow {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.7; transform: scale(1.03); }
        }
        @keyframes sleepFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(0.5deg); }
          75% { transform: translateY(-2px) rotate(-0.5deg); }
        }
        @keyframes sleepShine {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes sleepTwinkle {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        /* Equipped wardrobe realism layers */
        .equipped-item-layer {
          position: relative;
          transition: filter 220ms ease, transform 220ms ease, opacity 220ms ease;
        }
        .equipped-item-layer::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 10px;
          background:
            radial-gradient(circle at 22% 16%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0) 52%),
            linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 35%, rgba(0,0,0,0.07) 100%);
          mix-blend-mode: screen;
          opacity: 0.62;
        }
        .equipped-item-layer::after {
          content: '';
          position: absolute;
          inset: -1px;
          pointer-events: none;
          border-radius: 11px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.24),
            inset 0 -1px 0 rgba(0,0,0,0.2);
          opacity: 0.6;
        }
        @keyframes equippedItemFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.8px); }
        }
        @keyframes equippedItemBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .equipped-item-float {
          animation: equippedItemFloat 3.8s ease-in-out infinite;
        }
        .equipped-item-breathe {
          animation: equippedItemBreathe 4.6s ease-in-out infinite;
        }
        .equipped-item-metallic::before {
          opacity: 0.78;
          background:
            linear-gradient(130deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.04) 42%, rgba(0,0,0,0.12) 100%),
            radial-gradient(circle at 28% 18%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0) 70%);
        }
        .equipped-item-glass::before {
          opacity: 0.74;
          background:
            linear-gradient(150deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.01) 55%, rgba(0,0,0,0.14) 100%);
        }
        .equipped-item-tech::after {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.24),
            0 0 0 1px rgba(34,211,238,0.15);
        }
        /* Peek animation for hidden mascot on mobile */
        @keyframes peekPulse {
          0%, 100% { opacity: 0.6; width: 8px; }
          50% { opacity: 1; width: 12px; }
        }
      `}} />
    </>
  );
}

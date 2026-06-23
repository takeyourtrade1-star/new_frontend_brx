'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CardLoader } from '@/components/dev/CardLoader';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ACCESSORY_ITEMS,
  ALL_WARDROBE_ITEMS,
  CLOTHING_ITEMS,
  DEFAULT_FACE_COLOR_ID,
  FACE_COLOR_OPTIONS,
  OBJECT_ITEMS,
  type Category,
  type EquippedItems,
  type WardrobeItem,
} from './mascotte-wardrobe';
import { AssoHintBubble } from '@/components/dev/AssoHintBubble';
import { AssoMobileHelpButton } from '@/components/dev/AssoMobileHelpButton';
import { useAssoBubbleQueue } from '@/hooks/useAssoBubbleQueue';
import { useAssoTypewriter } from '@/hooks/useAssoTypewriter';
import { ASSO_MESSAGE_CHAT_MS } from '@/lib/asso-messages';
import {
  ASSO_MOBILE_MAX_WIDTH,
  getAssoBubbleBottom,
} from '@/lib/asso-layout';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';
import { CardMascotteOverlays } from '@/components/dev/card-mascotte/CardMascotteOverlays';
import { CardMascotteWidget } from '@/components/dev/card-mascotte/CardMascotteWidget';
import { AssoChatModal } from '@/components/dev/card-mascotte/AssoChatModal';
import { BugReportModal } from '@/components/dev/card-mascotte/BugReportModal';
import { WardrobePanel } from '@/components/dev/card-mascotte/WardrobePanel';
import { CardMascotteStyles } from '@/components/dev/card-mascotte/CardMascotteStyles';
import {
  BUG_REPORT_STORAGE,
  CODING_PREVIEW_MS,
  EXPRESSION_TRANSITION_MS,
  SUBMIT_FEEDBACK_MS,
  WARDROBE_STORAGE_KEY,
  Z_INDEX,
} from '@/components/dev/card-mascotte/constants';
import { inferBugCategory, isValidFaceColorId } from '@/components/dev/card-mascotte/infer-bug-category';
import { getRecentLogs } from '@/lib/dev/log-capture';
import { useConsoleLogCapture } from '@/lib/hooks/use-console-log-capture';
import { useTimeouts } from '@/lib/hooks/use-timeout-fn';

export function CardMascotte() {
  const authUser = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  // FE-REV-016: timeout di animazioni (particelle flip, transizioni chat, flash/preview) con cleanup
  // automatico allo smontaggio, per evitare setState post-unmount.
  const scheduleTimeout = useTimeouts();

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
  const { hasConsoleLogs, setHasConsoleLogs, showConsoleLogs, setShowConsoleLogs } =
    useConsoleLogCapture(isModalOpen);
  const [submitted, setSubmitted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Flash animation state for screenshot
  const [showFlash, setShowFlash] = useState(false);

  // Screenshot preview thumbnail state
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(false);

  // Chat flow state
  const [chatStep, setChatStep] = useState<'greeting' | 'menu' | 'bug' | 'contact'>('greeting');
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'asso' | 'user', text: string }>>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // First interaction tracking for personalized greetings
  const [hasInteractedBefore, setHasInteractedBefore] = useState(false);

  const greetingTimeoutRef = useRef<number | null>(null);
  const chatWelcomeTextRef = useRef('');
  const chatTypewriterCompleteRef = useRef<() => void>(() => {});
  const chatTypewriter = useAssoTypewriter({
    onComplete: () => chatTypewriterCompleteRef.current(),
  });
  const [isCodingTransition, setIsCodingTransition] = useState(false);
  const [showCodingCompanion, setShowCodingCompanion] = useState(false);
  const [codingStatus, setCodingStatus] = useState<'compiling' | 'received'>('compiling');
  const [isBugFormFocused, setIsBugFormFocused] = useState(false);

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
  // FE-REV-015: ref del totale accumulato, così l'effect inattività non si rilega (teardown/rebind
  // dei 5 listener document) a ogni risveglio quando totalSleepMs viene aggiornato.
  const totalSleepMsRef = useRef(totalSleepMs);
  useEffect(() => {
    totalSleepMsRef.current = totalSleepMs;
  }, [totalSleepMs]);

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

  const cardRef = useRef<HTMLDivElement>(null);
  const faceContainerRef = useRef<HTMLDivElement>(null);
  const expressionTimeoutRef = useRef<number | null>(null);
  const codingTransitionTimeoutRef = useRef<number | null>(null);
  const submitFeedbackTimeoutRef = useRef<number | null>(null);

  // â”€â”€ Card flip (swipe gamification) â”€â”€
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

  const closeMascottePanels = useCallback(() => {
    setShowAlbum(false);
    setIsWardrobeOpen(false);
    setShowChatModal(false);
    setIsModalOpen(false);
    setIsFlipped(false);
  }, []);

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

  // FE-REV-014: l'espressione "shocked" del sigaro è ora gestita nella catena di priorità
  // unica (vedi effect "Keep expression in sync"), per non essere sovrascritta dall'effect overlay.

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
    try { navigator?.vibrate?.(pattern); } catch { }
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
    scheduleTimeout(() => setGoldenConfetti([]), 3500);
  }, [scheduleTimeout]);

  const triggerEasterEgg = useCallback(() => {
    setEasterEggActive(true);
    playFanfareSound();
    spawnGoldenConfetti();
    scheduleTimeout(() => setEasterEggActive(false), 2000);
  }, [playFanfareSound, spawnGoldenConfetti, scheduleTimeout]);

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
    } catch { }
  }, []);

  // Spawn particles â€” more particles for higher combos
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
    scheduleTimeout(() => setFlipParticles([]), 700);
  }, [scheduleTimeout]);

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
    try { localStorage.setItem(FLIP_STORAGE_KEY, String(newCount)); } catch { }

    // Pick random unlocked variant
    const available = BACK_VARIANTS.filter(v => newCount >= v.unlock);
    setBackVariant(BACK_VARIANTS.indexOf(available[Math.floor(Math.random() * available.length)]));
    setIsFlipping(true);
    setIsFlipped(prev => !prev);
    scheduleTimeout(() => setIsFlipping(false), 650);

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
      } catch { }
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
  }, [flipCount, comboCount, vibrate, spawnFlipParticles, playFlipSound, playShinySound, playAchievementSound, playUnlockSound, triggerEasterEgg, BACK_VARIANTS, scheduleTimeout]);

  // Share achievement
  const handleShare = useCallback(async () => {
    vibrate(15);
    const title = getCurrentTitle(flipCount);
    const text = `Ho raggiunto "${title}" con ${flipCount} flip su Ebartex! ðŸƒâœ¨`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ebartex Card Flip', text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedShare(true);
        scheduleTimeout(() => setCopiedShare(false), 1800);
      }
    } catch { }
  }, [flipCount, getCurrentTitle, vibrate, scheduleTimeout]);

  // â”€â”€ Touch swipe (mobile) â”€â”€
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

  // â”€â”€ Desktop flip: dedicated button (no more drag conflicts) â”€â”€
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

  // Mini mode: Asso shrinks to 30% when clicking the arrow
  const [isAssoMini, setIsAssoMini] = useState(false);

  const toggleAssoMini = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAssoMini((prev) => !prev);
  }, []);

  // Mobile detection state for flip behavior
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= ASSO_MOBILE_MAX_WIDTH);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Welcome message variants based on interaction history
  const welcomeMessages = useMemo(() => {
    if (!hasInteractedBefore) {
      // First time - short and direct
      return [
        "Ciao! Sono Asso. Cosa cerchi?",
        "Benvenuto! Sono Asso, pronto ad aiutarti.",
        "Asso al tuo servizio. Di cosa hai bisogno?"
      ];
    }
    // Returning user - very short
    return [
      "Bentornato! Cosa ti serve?",
      "Ciao di nuovo! Pronto.",
      "Eccomi! Dimmi tutto.",
      "Asso è qui. Parla."
    ];
  }, [hasInteractedBefore]);

  const handleClick = (e: React.MouseEvent) => {
    // Ignore clicks on buttons inside the card (share, album, flip)
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

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

    const selectedMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    chatWelcomeTextRef.current = selectedMessage;

    setIsTyping(true);

    if (greetingTimeoutRef.current !== null) {
      window.clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = null;
    }

    greetingTimeoutRef.current = window.setTimeout(() => {
      greetingTimeoutRef.current = null;
      setIsTyping(false);
      chatTypewriter.start(selectedMessage);

      try {
        localStorage.setItem('brx_asso_interacted', 'true');
        setHasInteractedBefore(true);
      } catch {
        // localStorage not available
      }
    }, ASSO_MESSAGE_CHAT_MS.typingIndicator);
  }, [welcomeMessages, chatTypewriter]);

  chatTypewriterCompleteRef.current = () => {
    const text = chatWelcomeTextRef.current;
    setChatMessages([{ type: 'asso', text }]);
    scheduleTimeout(() => setChatStep('menu'), ASSO_MESSAGE_CHAT_MS.menuAfterGreeting);
  };

  // Handle chat modal close
  const handleChatModalClose = useCallback(() => {
    setShowChatModal(false);
    setIsTyping(false);

    if (greetingTimeoutRef.current !== null) {
      window.clearTimeout(greetingTimeoutRef.current);
      greetingTimeoutRef.current = null;
    }

    chatTypewriter.cancel();
  }, [chatTypewriter]);

  const resetCodingCompanion = useCallback(() => {
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
  }, []);

  const handleChatFaqClick = useCallback(() => {
    setChatMessages(prev => [...prev, { type: 'user', text: t('asso.chat.intentFaq') }]);
    scheduleTimeout(() => {
      handleChatModalClose();
      window.location.href = '/aiuto';
    }, 300);
  }, [t, handleChatModalClose, scheduleTimeout]);

  const handleChatBugClick = useCallback(() => {
    setChatMessages(prev => [...prev, { type: 'user', text: t('asso.chat.intentBug') }]);
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
  }, [t]);

  const handleChatSupportClick = useCallback(() => {
    setChatMessages(prev => [...prev, { type: 'user', text: t('asso.chat.intentSupport') }]);
    setChatStep('contact');
    scheduleTimeout(() => {
      setShowChatModal(false);
      window.location.href = '/aiuto?tab=contact';
    }, 300);
  }, [t, scheduleTimeout]);

  const handleBugModalClose = useCallback(() => {
    setIsModalOpen(false);
    setScreenshot(null);
    setSubmitted(false);
    setShowConsoleLogs(false);
    setHasConsoleLogs(false);
    resetCodingCompanion();
  }, [resetCodingCompanion, setHasConsoleLogs, setShowConsoleLogs]);

  const handleBugModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setSubmitted(false);
    setScreenshot(null);
    setHasConsoleLogs(false);
    setShowConsoleLogs(false);
    setBugForm({ name: '', email: '', subject: '', message: '', bugType: 'functional', priority: 'medium', url: '' });
    resetCodingCompanion();
  }, [resetCodingCompanion, setHasConsoleLogs, setShowConsoleLogs]);

  const handleBugFormFocusCapture = useCallback(() => {
    setIsBugFormFocused(true);
  }, []);

  const handleBugFormBlurCapture = useCallback((e: React.FocusEvent<HTMLFormElement>) => {
    const nextFocused = e.relatedTarget as Node | null;
    if (!nextFocused || !e.currentTarget.contains(nextFocused)) {
      setIsBugFormFocused(false);
    }
  }, []);

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
      scheduleTimeout(() => setShowFlash(false), 300);

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

      // Capture screenshot — html2canvas caricato on-demand (chunk separato)
      const html2canvas = (await import('html2canvas')).default;
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
      scheduleTimeout(() => setShowScreenshotPreview(false), 2000);

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
      if (wardrobeDoneTimeoutRef.current !== null) {
        window.clearTimeout(wardrobeDoneTimeoutRef.current);
      }
    };
  }, []);

  // Keep expression in sync with current overlay state + sleep mode
  useEffect(() => {
    // Priority: cigar > sleep > coding > modal > chat > normal
    // FE-REV-014: il sigaro (bocca a "O") resta prioritario finché equipaggiato.
    const hasCigar = equippedItems.accessories.includes('cigar-xl');
    const nextExpression = hasCigar
      ? 'shocked'
      : isSleeping
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
  }, [isModalOpen, showChatModal, mascotteExpression, isCodingTransition, isBugFormFocused, isSleeping, equippedItems.accessories]);

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
  const assoMessagesEnabled =
    !isModalOpen && !showChatModal && !isExternalModalOpen;
  const assoBubble = useAssoBubbleQueue(assoMessagesEnabled);
  const scheduleCycleRef = useRef(assoBubble.scheduleCycle);
  const stopCycleRef = useRef(assoBubble.stopCycle);
  scheduleCycleRef.current = assoBubble.scheduleCycle;
  stopCycleRef.current = assoBubble.stopCycle;

  // Promotional hints - glassmorphism style matching mascot
  const promoHints = useMemo(() => [
    {
      id: 'tornei-live',
      text: 'Tornei live e spedizioni BRX Express. Scopri di più.',
      route: getTournamentsPortalUrl('/'),
      // Glass tint color (accent only, not solid)
      accent: '#10B981',
      icon: 'swap',
    },
    {
      id: 'aste',
      text: 'Hai già partecipato ad un\'Asta?',
      route: '/aste',
      // Glass tint color (accent only, not solid)
      accent: '#06B6D4',
      icon: 'auction',
    },
    {
      id: 'bug',
      text: 'Trovato un bug? Segnalalo qui.',
      route: '#bug-report',
      // Minimal - no accent color, just glass
      accent: null,
      icon: 'bug',
    },
  ], []);

  // Filter promos to exclude current page (smart rotation)
  const activePromoHints = useMemo(() => {
    if (!pathname) return promoHints;
    return promoHints.filter((promo) => {
      if (promo.route.startsWith('http')) return true;
      return !pathname.startsWith(promo.route);
    });
  }, [pathname, promoHints]);

  const styleReactionMessages = useMemo(() => ({
    outfit: [
      'Nuovo look.',
      'Stile on point.',
      'Outfit spacca.',
      'Flex assicurato.',
    ],
    color: [
      'Colore top.',
      'Palette perfetta.',
      'Energia nuova.',
      'Chef\'s kiss.',
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

    assoBubble.enqueue({
      id: `style-${source}-${Date.now()}`,
      text: pool[nextIndex],
      accent: '#FF7300',
      kind: 'styleReaction',
      priority: true,
    });
  }, [styleReactionMessages, assoBubble]);

  // Ciclo messaggi promo in coda (typewriter + hold + pausa)
  useEffect(() => {
    const hintsEnabled =
      !isModalOpen && !showChatModal && activePromoHints.length > 0;
    if (!hintsEnabled) {
      stopCycleRef.current();
      return;
    }

    let promoIdx = 0;
    scheduleCycleRef.current(() => {
      const promo = activePromoHints[promoIdx % activePromoHints.length];
      promoIdx += 1;
      return {
        id: `promo-${promo.id}-${promoIdx}`,
        text: promo.text,
        accent: promo.accent,
        kind: isSleeping ? 'sleepDream' : 'promo',
        promoId: promo.id,
        route: promo.route,
      };
    });

    return () => stopCycleRef.current();
  }, [activePromoHints, isModalOpen, showChatModal, isSleeping]);

  // Listen for sticky bar visibility changes
  useEffect(() => {
    const handleStickyBarShow = (e: CustomEvent) => {
      setIsStickyBarVisible(e.detail.visible);
    };

    window.addEventListener('stickyBarVisibilityChange' as any, handleStickyBarShow as any);
    return () => window.removeEventListener('stickyBarVisibilityChange' as any, handleStickyBarShow as any);
  }, []);

  // No separate sleep promo cycle - uses same index as awake state

  const isOverlayVisible = showChatModal || isModalOpen || isCodingTransition || showCodingCompanion || isExternalModalOpen;
  const isStyleReactionActive = assoBubble.current?.kind === 'styleReaction';

  const handleAssoPromoClick = useCallback(() => {
    const msg = assoBubble.current;
    if (!msg) return;
    if (msg.promoId === 'bug' || msg.route === '#bug-report') {
      setIsModalOpen(true);
    } else if (msg.route?.startsWith('http')) {
      window.open(msg.route, '_blank', 'noopener,noreferrer');
    } else if (msg.route) {
      router.push(msg.route);
    }
  }, [assoBubble, router]);

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
    } catch { }
  }, [isSleepMuted]);

  // Stop snore sound
  const stopSnoreSound = useCallback(() => {
    try {
      if (snoreOscillatorRef.current) {
        snoreOscillatorRef.current.stop();
        snoreOscillatorRef.current = null;
      }
    } catch { }
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
          const newTotal = totalSleepMsRef.current + sleepDuration;
          setTotalSleepMs(newTotal);
          try {
            localStorage.setItem('brx_asso_sleep_ms', String(newTotal));
          } catch { }
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
    // FE-REV-015: rimosso anche totalSleepMs dalle deps (letto via totalSleepMsRef) per non rilegare i listener.
  }, [isOverlayVisible, isFlipped, playSnoreSound, stopSnoreSound]);

  // Toggle sleep mute and persist to localStorage
  const toggleSleepMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isSleepMuted;
    setIsSleepMuted(newMuted);
    try {
      localStorage.setItem('brx_asso_sleep_muted', String(newMuted));
    } catch { }
    vibrate(10);
  }, [isSleepMuted, vibrate]);

  // Su mobile: bottone Aiuto apre la stessa chat di Asso
  const handleMobileHelpClick = useCallback(() => {
    playOpenSound();
    setShowCardLoader(true);
  }, [playOpenSound]);

  // Safe render - don't render if not mounted (hydration mismatch protection)
  if (!isMounted) {
    return null;
  }

  // If there was a critical error, don't render
  if (hasError) {
    console.error('ðŸŽ´ CardMascotte has error, not rendering');
    return null;
  }

  if (isMobileView) {
    return (
      <>
        {!showChatModal && !isModalOpen && !showCardLoader && (
          <AssoMobileHelpButton isStickyBarVisible={isStickyBarVisible} onClick={handleMobileHelpClick} />
        )}
        {showCardLoader && (
          <CardLoader onComplete={handleCardLoaderComplete} duration={3900} />
        )}
        {showChatModal && (
          <AssoChatModal
            zIndex={Z_INDEX.modal}
            t={t}
            chatMessages={chatMessages}
            isTyping={isTyping}
            chatTypewriter={chatTypewriter}
            chatStep={chatStep}
            showFooter={!isMobileView}
            onClose={handleChatModalClose}
            onFaqClick={handleChatFaqClick}
            onBugClick={handleChatBugClick}
            onSupportClick={handleChatSupportClick}
          />
        )}
        {isModalOpen && (
          <BugReportModal
            variant="mobile"
            zIndex={Z_INDEX.modal}
            t={t}
            submitted={submitted}
            bugForm={bugForm}
            setBugForm={setBugForm}
            onSubmit={handleSubmit}
            onClose={handleBugModalClose}
            onCancel={handleBugModalCancel}
            screenshot={screenshot}
            onRemoveScreenshot={removeScreenshot}
            onCaptureScreenshot={captureScreenshot}
            isCapturing={isCapturing}
            hasConsoleLogs={hasConsoleLogs}
            showConsoleLogs={showConsoleLogs}
            setShowConsoleLogs={setShowConsoleLogs}
          />
        )}
        <CardMascotteStyles selectedFaceColor={selectedFaceColor} />
      </>
    );
  }

  return (
    <>
      {/* Card Loader - Shows when mascot is clicked */}
      {showCardLoader && (
        <CardLoader onComplete={handleCardLoaderComplete} duration={3900} />
      )}

      <CardMascotteOverlays
        t={t}
        isStickyBarVisible={isStickyBarVisible}
        showFlash={showFlash}
        showScreenshotPreview={showScreenshotPreview}
        screenshot={screenshot}
        newUnlock={newUnlock}
        showAlbum={showAlbum}
        isFlipped={isFlipped}
        backVariants={BACK_VARIANTS}
        flipCount={flipCount}
        showAchievement={showAchievement}
        showCombo={showCombo}
        comboCount={comboCount}
        isSleeping={isSleeping}
        isOverlayVisible={isOverlayVisible}
        isMobileView={isMobileView}
        flipParticles={flipParticles}
        dressingSparkles={dressingSparkles}
        goldenConfetti={goldenConfetti}
        afterScreenshot={
          !isModalOpen && !showChatModal && !isAssoMini ? (
            <AssoHintBubble
              visible={assoBubble.isVisible}
              message={assoBubble.current}
              displayedText={assoBubble.displayedText}
              isTyping={assoBubble.isTyping}
              isSleeping={isSleeping}
              isStyleReaction={isStyleReactionActive}
              bubbleBottom={getAssoBubbleBottom(isStickyBarVisible)}
              onDismiss={assoBubble.dismiss}
              onSkipTyping={assoBubble.skipTyping}
              onPromoClick={handleAssoPromoClick}
            />
          ) : null
        }
        afterAlbum={
          isWardrobeOpen ? (
            <WardrobePanel
              zIndex={Z_INDEX.tooltip + 3}
              isStickyBarVisible={isStickyBarVisible}
              t={t}
              wardrobeCategory={wardrobeCategory}
              setWardrobeCategory={setWardrobeCategory}
              equippedItems={equippedItems}
              setEquippedItems={setEquippedItems}
              pendingStyleReactionSourceRef={pendingStyleReactionSourceRef}
              visibleWardrobeItems={visibleWardrobeItems}
              wardrobeThumbById={wardrobeThumbById}
              isWardrobeItemEquipped={isWardrobeItemEquipped}
              toggleWardrobeItem={toggleWardrobeItem}
              clearWardrobeItems={clearWardrobeItems}
              handleWardrobeDone={handleWardrobeDone}
            />
          ) : null
        }
      />

      <CardMascotteWidget
        t={t}
        cardRef={cardRef}
        faceContainerRef={faceContainerRef}
        backFaceRef={backFaceRef}
        dressingSparklesTimeoutRef={dressingSparklesTimeoutRef}
        isAssoMini={isAssoMini}
        setIsAssoMini={setIsAssoMini}
        handleClick={handleClick}
        handleKeyDown={handleKeyDown}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
        handleCardMouseMove={handleCardMouseMove}
        handleCardMouseLeave={handleCardMouseLeave}
        setIsCardHovered={setIsCardHovered}
        justReappeared={justReappeared}
        easterEggActive={easterEggActive}
        isShiny={isShiny}
        isOverlayVisible={isOverlayVisible}
        isStickyBarVisible={isStickyBarVisible}
        isExternalModalOpen={isExternalModalOpen}
        isFlipping={isFlipping}
        isFlipped={isFlipped}
        tilt={tilt}
        isMobileView={isMobileView}
        isModalOpen={isModalOpen}
        mascotteExpression={mascotteExpression}
        selectedFaceColor={selectedFaceColor}
        equippedWardrobeItems={equippedWardrobeItems}
        equippedItems={equippedItems}
        isCardHovered={isCardHovered}
        handleFlipButtonClick={handleFlipButtonClick}
        toggleAssoMini={toggleAssoMini}
        backVariants={BACK_VARIANTS}
        backVariant={backVariant}
        holoPos={holoPos}
        flipCount={flipCount}
        handleAlbumToggle={handleAlbumToggle}
        showAlbum={showAlbum}
        setIsWardrobeOpen={setIsWardrobeOpen}
        setIsFlipping={setIsFlipping}
        setIsFlipped={setIsFlipped}
        setDressingSparkles={setDressingSparkles}
        showCodingCompanion={showCodingCompanion}
        codingStatus={codingStatus}
      />

      {isModalOpen && (
        <BugReportModal
          variant="desktop"
          zIndex={Z_INDEX.modal}
          t={t}
          submitted={submitted}
          bugForm={bugForm}
          setBugForm={setBugForm}
          onSubmit={handleSubmit}
          onClose={handleBugModalClose}
          onCancel={handleBugModalCancel}
          screenshot={screenshot}
          onRemoveScreenshot={removeScreenshot}
          onCaptureScreenshot={captureScreenshot}
          isCapturing={isCapturing}
          hasConsoleLogs={hasConsoleLogs}
          showConsoleLogs={showConsoleLogs}
          setShowConsoleLogs={setShowConsoleLogs}
          onFormFocusCapture={handleBugFormFocusCapture}
          onFormBlurCapture={handleBugFormBlurCapture}
        />
      )}

      {showChatModal && (
        <AssoChatModal
          zIndex={Z_INDEX.modal}
          t={t}
          chatMessages={chatMessages}
          isTyping={isTyping}
          chatTypewriter={chatTypewriter}
          chatStep={chatStep}
          showFooter={!isMobileView}
          onClose={handleChatModalClose}
          onFaqClick={handleChatFaqClick}
          onBugClick={handleChatBugClick}
          onSupportClick={handleChatSupportClick}
        />
      )}

      <CardMascotteStyles selectedFaceColor={selectedFaceColor} />
    </>
  );
}

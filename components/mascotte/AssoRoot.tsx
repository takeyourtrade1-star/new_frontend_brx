'use client';

// Container della mascotte Asso (PLAN/13). Sostituisce il vecchio
// components/dev/CardMascotte.tsx (1935 righe, ~45 useState): stato in una
// state machine (machine.ts), audio singleton (audio.ts), persistenza unica
// (persistence.ts), listener globali a costo ~zero in idle.

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';
import { getRecentLogs } from '@/lib/dev/log-capture';
import { useConsoleLogCapture } from '@/lib/hooks/use-console-log-capture';
import { useTimeouts } from '@/lib/hooks/use-timeout-fn';
import { useAssoBubbleQueue } from '@/hooks/useAssoBubbleQueue';
import { useAssoTypewriter } from '@/hooks/useAssoTypewriter';
import { ASSO_MESSAGE_CHAT_MS } from '@/lib/asso-messages';
import {
  ASSO_MOBILE_MAX_WIDTH,
  PROMO_POPUP_EVENT,
  STICKY_BOTTOM_BAR_EVENT,
  dispatchAssoFightStarted,
  getAssoBubbleBottom,
  type PromoPopupDetail,
} from '@/lib/asso-layout';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AssoCard } from './AssoCard';
import { AssoChatModal, type AssoChatMessage, type AssoChatStep } from './AssoChatModal';
import { AssoFightOverlay } from './AssoFightOverlay';
import { AssoHintBubble } from './AssoHintBubble';
import { AssoMobileHelpButton } from './AssoMobileHelpButton';
import { AssoOverlays } from './AssoOverlays';
import { AssoStyles } from './AssoStyles';
import { BugReportModal, type BugFormState } from './BugReportModal';
import {
  isAssoMuted,
  playFightSound,
  playFlipSound,
  playOpenSound,
  playShutterSound,
  playSuccessSound,
  setAssoMuted,
  suspendAssoAudio,
} from './audio';
import {
  ASSO_INITIAL_STATE,
  assoReducer,
  deriveExpression,
  isOverlayVisible,
} from './machine';
import {
  ASSO_DEFAULT_PERSISTED,
  loadAssoState,
  saveAssoState,
  type AssoPersistedState,
} from './persistence';
import { getFaceColor } from './faceColors';
import type { EquippedItems, WardrobeItemMeta } from './wardrobe/manifest';
import { MAX_EQUIPPED_OBJECTS } from './wardrobe/manifest';
import {
  BACK_VARIANTS,
  CODING_PREVIEW_MS,
  FIGHT_RETRY_MS,
  FIGHT_SESSION_KEY,
  FIGHT_TOTAL_MS,
  FIGHT_TRIGGER_MAX_MS,
  FIGHT_TRIGGER_MIN_MS,
  SLEEP_DELAY_MS,
  SUBMIT_FEEDBACK_MS,
  Z_INDEX,
  type DressingSparkle,
  type FlipParticle,
} from './constants';

// Pannello guardaroba: chunk separato, caricato solo all'apertura (PLAN/13.4).
const WardrobePanel = dynamic(() => import('./wardrobe/WardrobePanel'), {
  ssr: false,
  loading: () => null,
});

const EMPTY_BUG_FORM: BugFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
  bugType: 'functional',
  priority: 'medium',
  url: '',
};

const WELCOME_FIRST_KEYS: MessageKey[] = ['asso.welcome.first.0', 'asso.welcome.first.1', 'asso.welcome.first.2'];
const WELCOME_BACK_KEYS: MessageKey[] = ['asso.welcome.returning.0', 'asso.welcome.returning.1', 'asso.welcome.returning.2', 'asso.welcome.returning.3'];
const STYLE_REACTION_KEYS: Record<'outfit' | 'color', MessageKey[]> = {
  outfit: ['asso.reaction.outfit.0', 'asso.reaction.outfit.1', 'asso.reaction.outfit.2', 'asso.reaction.outfit.3'],
  color: ['asso.reaction.color.0', 'asso.reaction.color.1', 'asso.reaction.color.2', 'asso.reaction.color.3'],
};

export function AssoRoot() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const scheduleTimeout = useTimeouts();

  const [machine, dispatch] = useReducer(assoReducer, ASSO_INITIAL_STATE);
  const overlayVisible = isOverlayVisible(machine);
  const expression = deriveExpression(machine);

  // ── Persistenza (chiave unica brx_asso_v1, PLAN/13.10) ──────────────────
  const [persisted, setPersisted] = useState<AssoPersistedState>(ASSO_DEFAULT_PERSISTED);
  const persistedLoadedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const loaded = loadAssoState();
    setPersisted(loaded);
    setAssoMuted(loaded.muted);
    persistedLoadedRef.current = true;
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (persistedLoadedRef.current) saveAssoState(persisted);
  }, [persisted]);

  const equipped = persisted.wardrobe;
  const faceColor = getFaceColor(equipped.faceColor);

  // ── Viewport / layout ────────────────────────────────────────────────────
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth <= ASSO_MOBILE_MAX_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail;
      setIsStickyBarVisible(Boolean(detail?.visible));
    };
    window.addEventListener(STICKY_BOTTOM_BAR_EVENT, handler);
    return () => window.removeEventListener(STICKY_BOTTOM_BAR_EVENT, handler);
  }, []);

  // Popup promo nell'angolo (es. "I Tornei sono arrivati"): finché è visibile
  // Asso passa in mini e si alza appena sopra, così non si sovrappongono.
  const [promoPopup, setPromoPopup] = useState<{ visible: boolean; height: number }>({
    visible: false,
    height: 0,
  });
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PromoPopupDetail>).detail;
      setPromoPopup({ visible: Boolean(detail?.visible), height: detail?.height ?? 0 });
    };
    window.addEventListener(PROMO_POPUP_EVENT, handler);
    return () => window.removeEventListener(PROMO_POPUP_EVENT, handler);
  }, []);

  // ── Modale esterna (dock offerta asta) ──────────────────────────────────
  const [justReappeared, setJustReappeared] = useState(false);
  const externalOpenRef = useRef(false);
  useEffect(() => {
    const check = () => {
      const isOpen = document.body.classList.contains('auction-bid-modal-open');
      if (isOpen === externalOpenRef.current) return;
      externalOpenRef.current = isOpen;
      dispatch({ type: 'SET_EXTERNAL_MODAL', open: isOpen });
      if (!isOpen) {
        setJustReappeared(true);
        scheduleTimeout(() => setJustReappeared(false), 600);
      }
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [scheduleTimeout]);

  // ── Refs card ────────────────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);

  // ── Tilt 3D + holo (hover sulla card) ────────────────────────────────────
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    // Clamp ±8°: sufficiente per la profondità, meno "ballerino" del vecchio ±12°.
    setTilt({ x: Math.max(-8, Math.min(8, dy * -8)), y: Math.max(-8, Math.min(8, dx * 8)) });
    if (backFaceRef.current) {
      const br = backFaceRef.current.getBoundingClientRect();
      setHoloPos({
        x: ((e.clientX - br.left) / br.width) * 100,
        y: ((e.clientY - br.top) / br.height) * 100,
      });
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  // ── Pupille che seguono il mouse (PLAN/13.3) ─────────────────────────────
  // Un solo listener rAF-throttled che scrive 2 CSS custom properties sulla
  // card; le pupille le leggono in CSS (.asso-pupil-follow). Niente
  // querySelectorAll né style-write per evento come nel vecchio codice.
  useEffect(() => {
    if (isMobileView) return;
    let raf = 0;
    let lastEvent: MouseEvent | null = null;

    const apply = () => {
      raf = 0;
      const card = cardRef.current;
      const e = lastEvent;
      if (!card || !e || document.hidden) return;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const factor = Math.min(1, dist / 300);
      card.style.setProperty('--asso-pupil-x', `${(Math.cos(angle) * 4 * factor).toFixed(2)}px`);
      card.style.setProperty('--asso-pupil-y', `${(Math.sin(angle) * 4 * factor).toFixed(2)}px`);
    };

    const onMove = (e: MouseEvent) => {
      lastEvent = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobileView]);

  // ── Sonno per inattività (PLAN/13.3) ─────────────────────────────────────
  const allowSleep = !overlayVisible && !machine.flipped && !isMobileView;
  useEffect(() => {
    if (isMobileView) return;
    let timer: number | null = null;
    let lastArm = 0;

    const reset = () => {
      dispatch({ type: 'WAKE' }); // no-op (nessun render) se già sveglio
      if (!allowSleep) {
        if (timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
        return;
      }
      const now = Date.now();
      if (now - lastArm < 1000 && timer !== null) return; // throttle riarmo
      lastArm = now;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => dispatch({ type: 'SLEEP' }), SLEEP_DELAY_MS);
    };

    const events = ['mousemove', 'pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((event) => document.addEventListener(event, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((event) => document.removeEventListener(event, reset));
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [allowSleep, isMobileView]);

  // Tab nascosta: sospendi l'AudioContext condiviso.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) suspendAssoAudio();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const vibrate = useCallback((pattern: number | number[]) => {
    try { navigator?.vibrate?.(pattern); } catch { /* non supportato */ }
  }, []);

  // ── Flip + varianti retro (gamification mantenuta: flip/shiny/unlock) ────
  const [isFlipping, setIsFlipping] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [flipParticles, setFlipParticles] = useState<FlipParticle[]>([]);
  const [backVariant, setBackVariant] = useState(0);
  const [newUnlock, setNewUnlock] = useState<string | null>(null);
  const particleIdRef = useRef(0);

  const spawnFlipParticles = useCallback((boosted: boolean) => {
    const colors = ['#FF7300', '#FFB366', '#FDE68A', '#FF9A40', '#FBBF24'];
    const count = boosted ? 14 : 8;
    const particles = Array.from({ length: count }, (_, i) => {
      particleIdRef.current += 1;
      const rad = ((360 / count) * i + Math.random() * 30) * (Math.PI / 180);
      const dist = 40 + Math.random() * 20;
      return {
        id: particleIdRef.current,
        x: 48 + (Math.random() - 0.5) * 20,
        y: 64 + (Math.random() - 0.5) * 20,
        dx: Math.cos(rad) * dist,
        dy: Math.sin(rad) * dist,
        size: 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setFlipParticles(particles);
    scheduleTimeout(() => setFlipParticles([]), 700);
  }, [scheduleTimeout]);

  const doFlip = useCallback(() => {
    const rolledShiny = Math.random() < 0.05;
    if (rolledShiny) {
      setIsShiny(true);
      scheduleTimeout(() => setIsShiny(false), 3500);
    }
    playFlipSound();
    vibrate(rolledShiny ? [50, 30, 50] : 25);
    spawnFlipParticles(rolledShiny);

    setPersisted((prev) => {
      const flips = prev.flips + 1;
      const justUnlocked = BACK_VARIANTS.find((v) => v.unlock === flips && v.unlock > 0);
      const available = BACK_VARIANTS.filter((v) => flips >= v.unlock);
      if (justUnlocked && !prev.unlockedVariants.includes(justUnlocked.unlock)) {
        setBackVariant(BACK_VARIANTS.indexOf(justUnlocked));
        setNewUnlock(justUnlocked.label);
        scheduleTimeout(() => setNewUnlock(null), 3000);
        return { ...prev, flips, unlockedVariants: [...prev.unlockedVariants, justUnlocked.unlock] };
      }
      setBackVariant(BACK_VARIANTS.indexOf(available[Math.floor(Math.random() * available.length)]));
      return { ...prev, flips };
    });

    setIsFlipping(true);
    dispatch({ type: 'SET_FLIPPED', flipped: !machine.flipped });
    scheduleTimeout(() => setIsFlipping(false), 650);
  }, [machine.flipped, scheduleTimeout, spawnFlipParticles, vibrate]);

  const handleFlipButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({ type: 'CLOSE_WARDROBE' });
    doFlip();
  }, [doFlip]);

  // ── Guardaroba ───────────────────────────────────────────────────────────
  const [dressingSparkles, setDressingSparkles] = useState<DressingSparkle[]>([]);
  const pendingStyleReactionRef = useRef<'outfit' | 'color' | null>(null);
  const styleReactionLastIndexRef = useRef(-1);

  const setEquipped = useCallback((updater: (prev: EquippedItems) => EquippedItems) => {
    setPersisted((prev) => ({ ...prev, wardrobe: updater(prev.wardrobe) }));
  }, []);

  const toggleWardrobeItem = useCallback((item: WardrobeItemMeta) => {
    pendingStyleReactionRef.current = 'outfit';
    setEquipped((prev) => {
      if (item.category === 'clothing') {
        return { ...prev, clothing: prev.clothing === item.id ? null : item.id };
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
      return {
        ...prev,
        objects: exists
          ? prev.objects.filter((id) => id !== item.id)
          : [...prev.objects, item.id].slice(-MAX_EQUIPPED_OBJECTS),
      };
    });
  }, [setEquipped]);

  const setFaceColor = useCallback((id: string) => {
    pendingStyleReactionRef.current = 'color';
    setEquipped((prev) => ({ ...prev, faceColor: id }));
  }, [setEquipped]);

  const resetWardrobe = useCallback(() => {
    pendingStyleReactionRef.current = 'outfit';
    setEquipped(() => ({ ...ASSO_DEFAULT_PERSISTED.wardrobe }));
  }, [setEquipped]);

  const openWardrobe = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_WARDROBE' });
    if (machine.panel !== 'wardrobe') {
      setIsFlipping(true);
      scheduleTimeout(() => setIsFlipping(false), 650);
      const palette = ['#FF7300', '#FFA246', '#FFB26B', '#fcd34d', '#ffffff'];
      setDressingSparkles(Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        left: 18 + Math.random() * 60,
        top: 12 + Math.random() * 74,
        delay: i * 55 + Math.floor(Math.random() * 60),
        size: 9 + Math.random() * 7,
        color: palette[Math.floor(Math.random() * palette.length)],
      })));
      scheduleTimeout(() => setDressingSparkles([]), 1300);
    }
  }, [machine.panel, scheduleTimeout]);

  // ── Bubble promo + reazioni stile ────────────────────────────────────────
  const assoBubble = useAssoBubbleQueue(!overlayVisible && !isMobileView);
  const scheduleCycleRef = useRef(assoBubble.scheduleCycle);
  const stopCycleRef = useRef(assoBubble.stopCycle);
  scheduleCycleRef.current = assoBubble.scheduleCycle;
  stopCycleRef.current = assoBubble.stopCycle;

  const triggerStyleReaction = useCallback((source: 'outfit' | 'color') => {
    const pool = STYLE_REACTION_KEYS[source];
    let next = Math.floor(Math.random() * pool.length);
    if (next === styleReactionLastIndexRef.current) next = (next + 1) % pool.length;
    styleReactionLastIndexRef.current = next;
    assoBubble.enqueue({
      id: `style-${source}-${Date.now()}`,
      text: t(pool[next]),
      accent: '#FF7300',
      kind: 'styleReaction',
      priority: true,
    });
  }, [assoBubble, t]);

  const handleWardrobeDone = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const source = pendingStyleReactionRef.current;
    pendingStyleReactionRef.current = null;
    dispatch({ type: 'CLOSE_WARDROBE' });
    if (source) scheduleTimeout(() => triggerStyleReaction(source), 180);
  }, [scheduleTimeout, triggerStyleReaction]);

  useEffect(() => {
    if (!isMounted || isMobileView || overlayVisible) {
      stopCycleRef.current();
      return;
    }
    const promos = [
      { id: 'tornei-live', textKey: 'asso.promo.tournaments' as MessageKey, route: getTournamentsPortalUrl('/'), accent: '#10B981' },
      { id: 'aste', textKey: 'asso.promo.auctions' as MessageKey, route: '/aste', accent: '#06B6D4' },
      { id: 'bug', textKey: 'asso.promo.bug' as MessageKey, route: '#bug-report', accent: null },
    ].filter((promo) => promo.route.startsWith('http') || !pathname?.startsWith(promo.route));

    if (promos.length === 0) {
      stopCycleRef.current();
      return;
    }

    let idx = Math.floor(Math.random() * promos.length);
    scheduleCycleRef.current(() => {
      const promo = promos[idx % promos.length];
      idx += 1;
      return {
        id: `promo-${promo.id}-${idx}`,
        text: t(promo.textKey),
        accent: promo.accent,
        kind: machine.sleeping ? 'sleepDream' : 'promo',
        promoId: promo.id,
        route: promo.route,
      };
    });

    return () => stopCycleRef.current();
  }, [isMounted, isMobileView, overlayVisible, pathname, machine.sleeping, t]);

  const handleAssoPromoClick = useCallback(() => {
    const msg = assoBubble.current;
    if (!msg) return;
    if (msg.promoId === 'bug' || msg.route === '#bug-report') {
      dispatch({ type: 'OPEN_BUG_DIRECT' });
    } else if (msg.route?.startsWith('http')) {
      window.open(msg.route, '_blank', 'noopener,noreferrer');
    } else if (msg.route) {
      router.push(msg.route);
    }
  }, [assoBubble, router]);

  // ── Auto-scontro casuale (Asso si sdoppia e combatte contro di sé) ───────
  // Timer indipendente dal ciclo promo: scatta 45–90s dopo il mount, solo se
  // Asso non è occupato (niente pannelli, non flipped, non mini, tab visibile).
  // Se dorme lo sveglia (START_FIGHT azzera sleeping) e chiude i popup promo
  // nell'angolo via ASSO_FIGHT_STARTED_EVENT. Se le condizioni non reggono
  // riarma e riprova; max 1 volta per sessione.
  const fightTriggeredRef = useRef(false);
  const fightTimerRef = useRef<number | null>(null);
  const fightGuardRef = useRef<() => boolean>(() => false);
  fightGuardRef.current = () =>
    !overlayVisible &&
    machine.panel === 'none' &&
    !machine.flipped &&
    !machine.mini &&
    !machine.fighting &&
    !machine.externalModalOpen &&
    document.visibilityState !== 'hidden';

  useEffect(() => {
    if (!isMounted || isMobileView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    const arm = (delay: number) => {
      fightTimerRef.current = window.setTimeout(() => {
        fightTimerRef.current = null;
        if (cancelled || fightTriggeredRef.current) return;
        if (!fightGuardRef.current()) {
          arm(FIGHT_RETRY_MS);
          return;
        }
        try {
          if (sessionStorage.getItem(FIGHT_SESSION_KEY)) {
            fightTriggeredRef.current = true;
            return;
          }
          sessionStorage.setItem(FIGHT_SESSION_KEY, '1');
        } catch {
          // sessionStorage non disponibile: la lotta parte comunque.
        }
        fightTriggeredRef.current = true;
        dispatchAssoFightStarted();
        dispatch({ type: 'START_FIGHT' });
        playFightSound();
      }, delay);
    };

    arm(FIGHT_TRIGGER_MIN_MS + Math.random() * (FIGHT_TRIGGER_MAX_MS - FIGHT_TRIGGER_MIN_MS));
    return () => {
      cancelled = true;
      if (fightTimerRef.current !== null) window.clearTimeout(fightTimerRef.current);
    };
  }, [isMounted, isMobileView]);

  // Fine lotta: fa riapparire la card dopo FIGHT_TOTAL_MS.
  useEffect(() => {
    if (!machine.fighting) return;
    const endTimer = window.setTimeout(() => {
      dispatch({ type: 'END_FIGHT' });
    }, FIGHT_TOTAL_MS);
    return () => window.clearTimeout(endTimer);
  }, [machine.fighting]);

  // Transizione fighting→false: annuncio Tornei con bubble cliccabile (portal).
  // Passa da un ref: enqueue deve girare DOPO il commit (enabled del ciclo promo).
  const assoBubbleEnqueueRef = useRef(assoBubble.enqueue);
  assoBubbleEnqueueRef.current = assoBubble.enqueue;
  const wasFightingRef = useRef(false);
  useEffect(() => {
    if (wasFightingRef.current && !machine.fighting) {
      assoBubbleEnqueueRef.current({
        id: `fight-tornei-${Date.now()}`,
        text: t('asso.promo.tournamentsFight'),
        accent: '#10B981',
        kind: 'promo',
        priority: true,
        promoId: 'tornei-live',
        route: getTournamentsPortalUrl('/'),
      });
    }
    wasFightingRef.current = machine.fighting;
  }, [machine.fighting, t]);

  // ── Chat (senza CardLoader: click → chat subito, PLAN/13.8) ──────────────
  const [chatMessages, setChatMessages] = useState<AssoChatMessage[]>([]);
  const [chatStep, setChatStep] = useState<AssoChatStep>('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const chatWelcomeTextRef = useRef('');

  const chatTypewriter = useAssoTypewriter({
    onComplete: () => {
      setChatMessages([{ type: 'asso', text: chatWelcomeTextRef.current }]);
      scheduleTimeout(() => setChatStep('menu'), ASSO_MESSAGE_CHAT_MS.menuAfterGreeting);
    },
  });
  const chatTypewriterRef = useRef(chatTypewriter);
  chatTypewriterRef.current = chatTypewriter;

  const openChat = useCallback(() => {
    playOpenSound();
    dispatch({ type: 'OPEN_CHAT' });
    setChatMessages([]);
    setChatStep('greeting');
    const pool = persisted.interacted ? WELCOME_BACK_KEYS : WELCOME_FIRST_KEYS;
    const welcome = t(pool[Math.floor(Math.random() * pool.length)]);
    chatWelcomeTextRef.current = welcome;
    setIsTyping(true);
    scheduleTimeout(() => {
      setIsTyping(false);
      chatTypewriterRef.current.start(welcome);
    }, ASSO_MESSAGE_CHAT_MS.typingIndicator);
    setPersisted((prev) => (prev.interacted ? prev : { ...prev, interacted: true }));
  }, [persisted.interacted, scheduleTimeout, t]);

  const handleChatModalClose = useCallback(() => {
    dispatch({ type: 'CLOSE_CHAT' });
    setIsTyping(false);
    chatTypewriterRef.current.cancel();
  }, []);

  const handleChatFaqClick = useCallback(() => {
    setChatMessages((prev) => [...prev, { type: 'user', text: t('asso.chat.intentFaq') }]);
    scheduleTimeout(() => {
      handleChatModalClose();
      window.location.href = '/aiuto';
    }, 300);
  }, [t, handleChatModalClose, scheduleTimeout]);

  const codingTimeoutRef = useRef<number | null>(null);
  const handleChatBugClick = useCallback(() => {
    setChatMessages((prev) => [...prev, { type: 'user', text: t('asso.chat.intentBug') }]);
    setChatStep('bug');
    dispatch({ type: 'START_BUG_TRANSITION' });
    if (codingTimeoutRef.current !== null) window.clearTimeout(codingTimeoutRef.current);
    codingTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: 'BUG_MODAL_READY' });
      codingTimeoutRef.current = null;
    }, CODING_PREVIEW_MS);
  }, [t]);

  const handleChatSupportClick = useCallback(() => {
    setChatMessages((prev) => [...prev, { type: 'user', text: t('asso.chat.intentSupport') }]);
    setChatStep('contact');
    scheduleTimeout(() => {
      handleChatModalClose();
      window.location.href = '/aiuto?tab=contact';
    }, 300);
  }, [t, handleChatModalClose, scheduleTimeout]);

  useEffect(() => () => {
    if (codingTimeoutRef.current !== null) window.clearTimeout(codingTimeoutRef.current);
  }, []);

  // ── Bug report + screenshot ──────────────────────────────────────────────
  const [bugForm, setBugForm] = useState<BugFormState>(EMPTY_BUG_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const [bugSubmitError, setBugSubmitError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(false);
  const [captureHidden, setCaptureHidden] = useState(false);

  const isBugModalOpen = machine.panel === 'bug' && !captureHidden;
  const { hasConsoleLogs, setHasConsoleLogs, showConsoleLogs, setShowConsoleLogs } =
    useConsoleLogCapture(isBugModalOpen);

  const resetBugState = useCallback(() => {
    setSubmitted(false);
    setIsSubmittingBug(false);
    setBugSubmitError(null);
    setScreenshot(null);
    setBugForm(EMPTY_BUG_FORM);
    setHasConsoleLogs(false);
    setShowConsoleLogs(false);
  }, [setHasConsoleLogs, setShowConsoleLogs]);

  const handleBugModalClose = useCallback(() => {
    dispatch({ type: 'CLOSE_BUG' });
    resetBugState();
  }, [resetBugState]);

  const handleBugSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingBug) return;
    setIsSubmittingBug(true);
    setBugSubmitError(null);
    try {
      const pageUrl = bugForm.url.trim() || window.location.href;
      const response = await fetch('/api/support/bug-reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          name: bugForm.name,
          email: bugForm.email,
          subject: bugForm.subject,
          message: bugForm.message,
          bugType: bugForm.bugType,
          priority: bugForm.priority,
          pageUrl,
          ...(screenshot ? { screenshot } : {}),
        }),
      });
      const result = (await response.json().catch(() => null)) as { reportId?: unknown } | null;
      if (!response.ok || (typeof result?.reportId !== 'string' && typeof result?.reportId !== 'number')) {
        setBugSubmitError(t('marketplace.report.errorGeneric'));
        return;
      }

      playSuccessSound();
      dispatch({ type: 'BUG_SUBMITTED' });
      setSubmitted(true);
      scheduleTimeout(() => {
        dispatch({ type: 'CLOSE_BUG' });
        resetBugState();
      }, SUBMIT_FEEDBACK_MS);
    } catch {
      setBugSubmitError(t('marketplace.report.errorGeneric'));
    } finally {
      setIsSubmittingBug(false);
    }
  }, [bugForm, isSubmittingBug, resetBugState, scheduleTimeout, screenshot, t]);

  const captureScreenshot = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      setShowFlash(true);
      playShutterSound();
      scheduleTimeout(() => setShowFlash(false), 300);

      setCaptureHidden(true);
      if (cardRef.current) {
        cardRef.current.style.visibility = 'hidden';
        cardRef.current.style.opacity = '0';
      }
      await new Promise((resolve) => setTimeout(resolve, 400));

      // html2canvas on-demand (chunk separato)
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
          const clonedMascotte = clonedDoc.querySelector('[data-asso-mascot="true"]');
          if (clonedMascotte) (clonedMascotte as HTMLElement).style.display = 'none';
        },
      });

      setScreenshot(canvas.toDataURL('image/jpeg', 0.85));
      setShowScreenshotPreview(true);
      scheduleTimeout(() => setShowScreenshotPreview(false), 2000);
      setHasConsoleLogs(getRecentLogs(60).length > 0);
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      if (cardRef.current) {
        cardRef.current.style.visibility = '';
        cardRef.current.style.opacity = '';
      }
      setCaptureHidden(false);
      setIsCapturing(false);
    }
  }, [isCapturing, scheduleTimeout, setHasConsoleLogs]);

  // ── Attivazione card ─────────────────────────────────────────────────────
  const handleActivate = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (machine.flipped) {
      dispatch({ type: 'CLOSE_WARDROBE' });
      doFlip();
      return;
    }
    openChat();
  }, [machine.flipped, doFlip, openChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (machine.flipped) {
      dispatch({ type: 'CLOSE_WARDROBE' });
      doFlip();
    } else {
      openChat();
    }
  }, [machine.flipped, doFlip, openChat]);

  const toggleMini = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_MINI' });
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isAssoMuted();
    setAssoMuted(next);
    setPersisted((prev) => ({ ...prev, muted: next }));
    vibrate(10);
  }, [vibrate]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!isMounted) return null;

  const isStyleReactionActive = assoBubble.current?.kind === 'styleReaction';

  // Mini forzata dal popup promo; il bottom la porta subito sopra il popup
  // (16px = bottom del popup, 12px di respiro).
  const isMiniEffective = machine.mini || promoPopup.visible;
  const promoBottomPx = promoPopup.visible ? 16 + promoPopup.height + 12 : null;

  const chatModal = machine.panel === 'chat' && (
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
  );

  const bugModal = isBugModalOpen && (
    <BugReportModal
      variant={isMobileView ? 'mobile' : 'desktop'}
      zIndex={Z_INDEX.modal}
      t={t}
      submitted={submitted}
      isSubmitting={isSubmittingBug}
      submitError={bugSubmitError}
      bugForm={bugForm}
      setBugForm={setBugForm}
      onSubmit={handleBugSubmit}
      onClose={handleBugModalClose}
      onCancel={handleBugModalClose}
      screenshot={screenshot}
      onRemoveScreenshot={() => setScreenshot(null)}
      onCaptureScreenshot={captureScreenshot}
      isCapturing={isCapturing}
      hasConsoleLogs={hasConsoleLogs}
      showConsoleLogs={showConsoleLogs}
      setShowConsoleLogs={setShowConsoleLogs}
      onFormFocusCapture={() => dispatch({ type: 'SET_BUG_FORM_FOCUSED', focused: true })}
      onFormBlurCapture={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !e.currentTarget.contains(next)) {
          dispatch({ type: 'SET_BUG_FORM_FOCUSED', focused: false });
        }
      }}
    />
  );

  if (isMobileView) {
    return (
      <>
        {machine.panel === 'none' && (
          <AssoMobileHelpButton isStickyBarVisible={isStickyBarVisible} onClick={openChat} />
        )}
        {chatModal}
        {bugModal}
        <AssoStyles faceColor={faceColor} />
      </>
    );
  }

  return (
    <>
      <AssoOverlays
        t={t}
        isStickyBarVisible={isStickyBarVisible}
        showFlash={showFlash}
        showScreenshotPreview={showScreenshotPreview}
        screenshot={screenshot}
        newUnlock={newUnlock}
        isSleeping={machine.sleeping}
        showSleepBubbles={!overlayVisible && !machine.flipped && !isMiniEffective}
        flipParticles={flipParticles}
        dressingSparkles={dressingSparkles}
        hintBubble={
          // Nascosta anche col guardaroba aperto: si sovrapporrebbe al pannello.
          !overlayVisible && !isMiniEffective && machine.panel !== 'wardrobe' ? (
            <AssoHintBubble
              visible={assoBubble.isVisible}
              message={assoBubble.current}
              displayedText={assoBubble.displayedText}
              isTyping={assoBubble.isTyping}
              isSleeping={machine.sleeping}
              isStyleReaction={isStyleReactionActive}
              bubbleBottom={getAssoBubbleBottom(isStickyBarVisible)}
              onDismiss={assoBubble.dismiss}
              onSkipTyping={assoBubble.skipTyping}
              onPromoClick={handleAssoPromoClick}
            />
          ) : null
        }
        wardrobePanel={
          machine.panel === 'wardrobe' ? (
            <WardrobePanel
              zIndex={Z_INDEX.tooltip + 3}
              isStickyBarVisible={isStickyBarVisible}
              t={t}
              equipped={equipped}
              onToggleItem={toggleWardrobeItem}
              onSetFaceColor={setFaceColor}
              onReset={resetWardrobe}
              onDone={handleWardrobeDone}
            />
          ) : null
        }
      />

      {/* Auto-scontro: arena con i due lottatori al posto della card */}
      {machine.fighting && (
        <AssoFightOverlay faceColor={faceColor} isStickyBarVisible={isStickyBarVisible} />
      )}

      <AssoCard
        t={t}
        cardRef={cardRef}
        backFaceRef={backFaceRef}
        expression={expression}
        faceColor={faceColor}
        equipped={equipped}
        isMini={isMiniEffective}
        setIsMini={(value) => {
          const mini = typeof value === 'function' ? value(machine.mini) : value;
          dispatch({ type: 'SET_MINI', mini });
        }}
        bottomOverridePx={promoBottomPx}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        isFlipped={machine.flipped}
        isFlipping={isFlipping}
        isSleeping={machine.sleeping}
        isShiny={isShiny}
        isOverlayVisible={overlayVisible}
        isStickyBarVisible={isStickyBarVisible}
        isExternalModalOpen={machine.externalModalOpen}
        isBugModalOpen={isBugModalOpen}
        justReappeared={justReappeared}
        isFighting={machine.fighting}
        tilt={tilt}
        holoPos={holoPos}
        backVariant={backVariant}
        flipCount={persisted.flips}
        muted={persisted.muted}
        showCodingCompanion={machine.codingCompanion}
        codingStatus={machine.codingStatus}
        onActivate={handleActivate}
        onKeyDown={handleKeyDown}
        onFlip={handleFlipButtonClick}
        onToggleMini={toggleMini}
        onOpenWardrobe={openWardrobe}
        onToggleMute={toggleMute}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      />

      {chatModal}
      {bugModal}
      <AssoStyles faceColor={faceColor} />
    </>
  );
}

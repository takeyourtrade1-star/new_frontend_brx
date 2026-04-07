'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Camera, ImageIcon, FileText, Bug, CheckCircle2, HelpCircle, MessageSquare } from 'lucide-react';
import html2canvas from 'html2canvas';

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

function startConsoleCapture() {
  capturedLogs = [];
  const MAX_LOGS = 200;

  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
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
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
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
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    if (shouldExcludeLog(message)) return;
    capturedLogs.push({
      type: 'warn',
      message,
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };
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

const faceSVG = `<svg viewBox="0 0 100 100" fill="none" stroke="#4a5548" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="35" cy="39" r="11" stroke-width="2.6"/>
  <circle class="pupil" cx="35" cy="39" r="6" fill="#4a5548" stroke="none"/>
  <circle cx="32" cy="36" r="2" fill="#faf9f6" stroke="none"/>
  <circle cx="65" cy="39" r="11" stroke-width="2.6"/>
  <circle class="pupil" cx="65" cy="39" r="6" fill="#4a5548" stroke="none"/>
  <circle cx="62" cy="36" r="2" fill="#faf9f6" stroke="none"/>
  <path d="M 33 63 Q 50 79 67 63" stroke-width="3.4" fill="none"/>
</svg>`;

const faceBugReportSVG = `<svg viewBox="0 0 100 100" fill="none" stroke="#4a5548" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="34" cy="40" r="10" stroke-width="2.2"/>
  <circle class="pupil" cx="34" cy="40" r="4.2" fill="#4a5548" stroke="none"/>
  <circle cx="31.5" cy="37" r="1.4" fill="#faf9f6" stroke="none"/>
  <circle cx="66" cy="40" r="10" stroke-width="2.2"/>
  <circle class="pupil" cx="66" cy="40" r="4.2" fill="#4a5548" stroke="none"/>
  <circle cx="63.5" cy="37" r="1.4" fill="#faf9f6" stroke="none"/>
  <rect x="20" y="29" width="60" height="23" rx="4.5" stroke-width="2.1" fill="none" stroke="#4a5548"/>
  <line x1="50" y1="33" x2="50" y2="48" stroke-width="1.7" stroke="#4a5548"/>
  <line x1="20" y1="41" x2="16" y2="39" stroke-width="1.8" stroke="#4a5548"/>
  <line x1="80" y1="41" x2="84" y2="39" stroke-width="1.8" stroke="#4a5548"/>
  <path class="bug-glint bug-glint-1" d="M 28 34 L 34 31" stroke="#faf9f6" stroke-width="1.4"/>
  <path class="bug-glint bug-glint-2" d="M 62 35 L 68 32" stroke="#faf9f6" stroke-width="1.4"/>
  <ellipse class="bug-mouth" cx="50" cy="65" rx="6.2" ry="2.6" stroke-width="2.8" fill="none"/>
</svg>`;

const faceBugFocusSVG = `<svg viewBox="0 0 100 100" fill="none" stroke="#4a5548" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M 24 30 Q 32 24 40 28" stroke-width="2.2"/>
  <path d="M 60 28 Q 68 24 76 30" stroke-width="2.2"/>
  <circle cx="34" cy="40" r="10" stroke-width="2.2"/>
  <circle cx="34" cy="40" r="3.8" fill="#4a5548" stroke="none"/>
  <circle cx="31.5" cy="37" r="1.3" fill="#faf9f6" stroke="none"/>
  <circle cx="66" cy="40" r="10" stroke-width="2.2"/>
  <circle cx="66" cy="40" r="3.8" fill="#4a5548" stroke="none"/>
  <circle cx="63.5" cy="37" r="1.3" fill="#faf9f6" stroke="none"/>
  <rect x="20" y="29" width="60" height="23" rx="4.5" stroke-width="2.1" fill="none" stroke="#4a5548"/>
  <line x1="50" y1="33" x2="50" y2="48" stroke-width="1.7" stroke="#4a5548"/>
  <line x1="20" y1="41" x2="16" y2="39" stroke-width="1.8" stroke="#4a5548"/>
  <line x1="80" y1="41" x2="84" y2="39" stroke-width="1.8" stroke="#4a5548"/>
  <path class="bug-glint bug-glint-1" d="M 28 34 L 34 31" stroke="#faf9f6" stroke-width="1.4"/>
  <path class="bug-glint bug-glint-2" d="M 62 35 L 68 32" stroke="#faf9f6" stroke-width="1.4"/>
  <ellipse class="bug-mouth" cx="50" cy="65" rx="5.7" ry="2.3" stroke-width="2.7" fill="none"/>
</svg>`;

const faceWinkSVG = `<svg viewBox="0 0 100 100" fill="none" stroke="#4a5548" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M 24 40 Q 34 31 44 40" stroke-width="3.6"/>
  <circle cx="67" cy="39" r="11" stroke-width="2.6"/>
  <circle class="pupil" cx="67" cy="39" r="6" fill="#4a5548" stroke="none"/>
  <circle cx="64" cy="36" r="2" fill="#faf9f6" stroke="none"/>
  <path d="M 38 63 Q 54 74 69 61" stroke-width="3.4" fill="none"/>
</svg>`;

const faceCodingSVG = `<svg viewBox="0 0 100 100" fill="none" stroke="#4a5548" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="35" cy="38" r="14" stroke-width="2.5"/>
  <circle class="pupil" cx="35" cy="38" r="4" fill="#4a5548" stroke="none"/>
  <circle cx="65" cy="38" r="14" stroke-width="2.5"/>
  <circle class="pupil" cx="65" cy="38" r="4" fill="#4a5548" stroke="none"/>
  <path class="coding-mouth" d="M 35 66 L 65 66" stroke-width="3" fill="none"/>
  <!-- Glasses/monitor frame -->
  <rect x="20" y="24" width="60" height="28" rx="3" stroke-width="2.5" fill="none" stroke="#4a5548"/>
  <line x1="50" y1="24" x2="50" y2="52" stroke-width="2" stroke="#4a5548"/>
</svg>`;

export function CardMascotte() {
  // Safe mount check
  const [isMounted, setIsMounted] = useState(false);
  const [hasError] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
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
  const [chatMessages, setChatMessages] = useState<Array<{type: 'ciro' | 'user', text: string}>>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isCodingTransition, setIsCodingTransition] = useState(false);
  const [showCodingCompanion, setShowCodingCompanion] = useState(false);
  const [codingStatus, setCodingStatus] = useState<'compiling' | 'received'>('compiling');
  const [isBugFormFocused, setIsBugFormFocused] = useState(false);

  // Hint bubble visibility state
  const [showHint, setShowHint] = useState(false);

  // Mascotte expression state
  const [mascotteExpression, setMascotteExpression] = useState<'normal' | 'bugReport' | 'bugFocus' | 'wink' | 'coding'>('normal');

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

  const handleClick = () => {
    playOpenSound();
    setIsCodingTransition(false);
    setShowCodingCompanion(false);
    setCodingStatus('compiling');
    setShowChatModal(true);
    setChatStep('greeting');
    // Reset messages immediately to prevent showing stale messages from previous session
    setChatMessages([]);
    // Show typing indicator while waiting for greeting
    setIsTyping(true);
    // Initialize greeting message
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages([{ type: 'ciro', text: "Ciao! Sono Ciro, la mascotte di Ebartex. Come posso aiutarti oggi?" }]);
      setTimeout(() => setChatStep('menu'), 1500);
    }, 500);
  };

  // Handle chat modal close
  const handleChatModalClose = () => {
    setShowChatModal(false);
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
      handleClick();
    }
  };

  // Start console capture on mount
  useEffect(() => {
    startConsoleCapture();
  }, []);

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
    };
  }, []);

  // Keep expression in sync with current overlay state
  useEffect(() => {
    const nextExpression = isCodingTransition ? 'bugReport' : isModalOpen ? (isBugFormFocused ? 'bugFocus' : 'bugReport') : showChatModal ? 'wink' : 'normal';

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
  }, [isModalOpen, showChatModal, mascotteExpression, isCodingTransition, isBugFormFocused]);

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

  // Show hint bubble after delay on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowHint(true);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const isOverlayVisible = showChatModal || isModalOpen || isCodingTransition || showCodingCompanion || isExternalModalOpen;

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

      {/* Hint Bubble - Outside card so it stays visible when mascot is hidden */}
      {showHint && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: Z_INDEX.tooltip,
            bottom: '155px',
            right: '96px',
            transform: isModalOpen ? 'translateX(50%) scale(0.9)' : 'translateX(50%) scale(1)',
            opacity: isModalOpen ? 0 : 1,
            transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
          }}
        >
          <div className="relative rounded-xl border border-primary/60 bg-primary/70 px-3 py-2 text-center text-xs font-semibold text-white shadow-lg shadow-primary/30 backdrop-blur-md backdrop-saturate-150">
            Vuoi segnalare un bug?
            <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-primary/60 bg-primary/70 backdrop-blur-md" />
          </div>
        </div>
      )}

      {/* Card Mascotte */}
      <div
        ref={cardRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`fixed cursor-pointer select-none transition-all duration-300 ${justReappeared ? 'mascotte-reappear' : ''}`}
        style={{
          zIndex: isOverlayVisible ? Z_INDEX.mascotteOverlay : Z_INDEX.mascotteBase,
          bottom: '20px',
          right: '48px',
          width: '96px',
          height: '128px',
          filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3))',
          animation: justReappeared 
            ? 'mascotteReappear 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, mascotteFloat 3s ease-in-out infinite 500ms'
            : 'mascotteFloat 3s ease-in-out infinite',
          // Hide mascot when external modal is open (AuctionBidModal)
          opacity: isExternalModalOpen ? 0 : 1,
          pointerEvents: isExternalModalOpen ? 'none' : 'auto',
          transform: isExternalModalOpen ? 'scale(0.8)' : 'scale(1)',
        }}
        role="button"
        tabIndex={0}
        aria-label="Segnala un bug"
        title="Segnala un bug"
      >
        {/* Active auction indicator badge */}
        {!isExternalModalOpen && !isModalOpen && (
          <div 
            className="absolute -top-1 -right-1 z-[10] flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-md"
            title="Asta in corso"
          >
            <span className="text-[8px] font-bold text-white">A</span>
          </div>
        )}
        {/* Card container */}
        <div className="relative h-full w-full overflow-visible rounded-xl">
          {/* Color aura for card contour */}
          <div
            className="pointer-events-none absolute rounded-xl border border-primary/35 shadow-lg shadow-primary/35"
            style={{ inset: '4px', zIndex: 0 }}
          />

          {/* Card border */}
          <div
            className="pointer-events-none absolute rounded-lg border-2 border-primary/90 shadow-lg shadow-primary/30"
            style={{ inset: '6px', zIndex: 2 }}
          >
            <div
              className="absolute rounded-md border border-marquee/55"
              style={{ inset: '3px' }}
            />
          </div>

          {/* Corner decorations */}
          <div className="absolute left-[8px] top-[8px] z-[3] h-4 w-4">
            <div className="absolute left-0 top-0 h-0.5 w-2.5 bg-marquee" />
            <div className="absolute left-0 top-0 h-2.5 w-0.5 bg-marquee" />
          </div>
          <div className="absolute right-[8px] top-[8px] z-[3] h-4 w-4">
            <div className="absolute right-0 top-0 h-0.5 w-2.5 bg-marquee" />
            <div className="absolute right-0 top-0 h-2.5 w-0.5 bg-marquee" />
          </div>
          <div className="absolute bottom-[8px] left-[8px] z-[3] h-4 w-4">
            <div className="absolute bottom-0 left-0 h-0.5 w-2.5 bg-marquee" />
            <div className="absolute bottom-0 left-0 h-2.5 w-0.5 bg-marquee" />
          </div>
          <div className="absolute bottom-[8px] right-[8px] z-[3] h-4 w-4">
            <div className="absolute bottom-0 right-0 h-0.5 w-2.5 bg-marquee" />
            <div className="absolute bottom-0 right-0 h-2.5 w-0.5 bg-marquee" />
          </div>

          {/* Card face */}
          <div
            ref={faceContainerRef}
            className={`absolute flex items-center justify-center transition-all duration-300 ${isModalOpen ? 'face-glint-active' : ''}`}
            style={{
              inset: '14px',
              zIndex: 1,
              transform: mascotteExpression === 'wink' ? 'translateY(-2px) rotate(-2deg)' : 'translateY(-1px)',
            }}
            dangerouslySetInnerHTML={{ 
              __html: mascotteExpression === 'bugFocus' ? faceBugFocusSVG :
                      mascotteExpression === 'bugReport' ? faceBugReportSVG : 
                      mascotteExpression === 'wink' ? faceWinkSVG : 
                      mascotteExpression === 'coding' ? faceCodingSVG : 
                      faceSVG 
            }}
          />
        </div>

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
                  <p className="mt-1 text-xs text-gray-500">L'URL ci aiuta a identificare esattamente dove si è verificato il problema.</p>
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

      {/* Chat Modal - Ciro Assistant */}
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
                  <h3 className="font-comodo text-base font-medium text-zinc-900">Ciro</h3>
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
                  className={`mb-3 flex chat-message-in ${msg.type === 'ciro' ? 'justify-start' : 'justify-end'}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.type === 'ciro'
                        ? 'rounded-tl-none bg-white text-zinc-800 border border-zinc-200'
                        : 'rounded-tr-none bg-primary text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator - shows when Ciro is typing */}
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
                Ciro è qui per aiutarti. Scegli un'opzione sopra.
              </p>
            </div>
          </div>
        </div>
      )}

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
      `}} />
    </>
  );
}

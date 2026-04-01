'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bug, X, Send, ExternalLink, Camera, ImageIcon, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';

// Storage keys for bug report data
const BUG_REPORT_STORAGE = {
  SCREENSHOT: 'brx_bug_screenshot',
  CONSOLE_LOGS: 'brx_bug_console_logs',
  CATEGORY: 'brx_bug_category',
  TIMESTAMP: 'brx_bug_timestamp',
};

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

// Start capturing console logs
function startConsoleCapture() {
  capturedLogs = [];
  const MAX_LOGS = 100;
  
  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    capturedLogs.push({
      type: 'log',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };
  
  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    capturedLogs.push({
      type: 'error',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };
  
  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    capturedLogs.push({
      type: 'warn',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      timestamp: Date.now(),
    });
    if (capturedLogs.length > MAX_LOGS) capturedLogs.shift();
  };
}

// Get recent logs (last 30 seconds)
function getRecentLogs(seconds: number = 30): ConsoleLog[] {
  const cutoff = Date.now() - (seconds * 1000);
  return capturedLogs.filter(log => log.timestamp >= cutoff);
}

// Infer bug category from URL
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

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [hasConsoleLogs, setHasConsoleLogs] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Start console capture on mount
  useEffect(() => {
    startConsoleCapture();
  }, []);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const bugCategory = inferBugCategory(currentUrl);
  
  // Build detailed URL with all data
  const detailedBugUrl = `/aiuto?tab=bug&url=${encodeURIComponent(currentUrl)}&category=${bugCategory}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Invio del feedback - in produzione questo chiamerebbe un'API
    console.log('Bug report:', message);
    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setMessage('');
    }, 2000);
  };

  const handleDetailedBug = () => {
    // Save screenshot to localStorage if present
    if (screenshot) {
      try {
        localStorage.setItem(BUG_REPORT_STORAGE.SCREENSHOT, screenshot);
      } catch (e) {
        console.error('Failed to save screenshot:', e);
      }
    }
    
    // Save console logs
    const recentLogs = getRecentLogs(30);
    if (recentLogs.length > 0) {
      try {
        localStorage.setItem(BUG_REPORT_STORAGE.CONSOLE_LOGS, JSON.stringify(recentLogs));
        localStorage.setItem(BUG_REPORT_STORAGE.TIMESTAMP, Date.now().toString());
      } catch (e) {
        console.error('Failed to save logs:', e);
      }
    }
    
    // Save inferred category
    localStorage.setItem(BUG_REPORT_STORAGE.CATEGORY, bugCategory);
    
    setIsOpen(false);
    setMessage('');
    setScreenshot(null);
    setHasConsoleLogs(false);
  };

  const captureScreenshot = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    
    // Nascondi il modal temporaneamente per catturare la pagina sotto
    setIsOpen(false);
    
    // Aspetta che il modal si chiuda e il browser renderizzi
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Nascondi anche il pulsante fisso
      if (buttonRef.current) {
        buttonRef.current.style.opacity = '0';
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowHeight: document.documentElement.scrollHeight,
        height: document.documentElement.scrollHeight,
        backgroundColor: null,
        scale: window.devicePixelRatio > 1 ? 1 : 1,
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setScreenshot(dataUrl);
      
      // Check for console logs
      const logs = getRecentLogs(30);
      setHasConsoleLogs(logs.length > 0);
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      // Ripristina il pulsante
      if (buttonRef.current) {
        buttonRef.current.style.opacity = '1';
      }
      
      // Riapri il modal con lo screenshot
      setIsOpen(true);
      setIsCapturing(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
  };

  return (
    <>
      {/* Pulsante fisso - Pallino arancione */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:brightness-110 active:scale-95"
        aria-label="Segnala un bug"
        title="Segnala un bug"
      >
        <Bug className="h-6 w-6" />
      </button>

      {/* Modal per il feedback */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
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
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descrivi il problema che hai riscontrato..."
                  className="mb-3 min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-black placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />

                {/* Screenshot preview */}
                {screenshot && (
                  <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
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

                {/* Console logs indicator */}
                {hasConsoleLogs && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-700">
                      Log console recenti disponibili nel report dettagliato
                    </span>
                  </div>
                )}

                {/* Azioni secondarie */}
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
                  
                  <Link
                    href={detailedBugUrl}
                    onClick={handleDetailedBug}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Bug dettagliato
                    <span className="text-[10px] text-gray-400">({bugCategory})</span>
                  </Link>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setScreenshot(null);
                    }}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Invia
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
    </>
  );
}

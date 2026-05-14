'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const FLASH_DURATION_MS = 4500;
const ERROR_DURATION_MS = 5000;
const EXIT_DURATION_MS = 240;

export function AuthToast({ headerHeight }: { headerHeight: number }) {
  const flashMessage = useAuthStore((s) => s.flashMessage);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const authError = useAuthStore((s) => s.authError);
  const setAuthError = useAuthStore((s) => s.setAuthError);

  const [flashExiting, setFlashExiting] = useState(false);
  const [errorExiting, setErrorExiting] = useState(false);
  const lastFlashRef = useRef<string | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  // Flash message: track enter/exit animation
  useEffect(() => {
    if (flashMessage) {
      lastFlashRef.current = flashMessage;
      setFlashExiting(false);
    } else if (lastFlashRef.current != null) {
      setFlashExiting(true);
    }
  }, [flashMessage]);

  // Flash message: auto-dismiss
  useEffect(() => {
    if (!flashMessage) return;
    const timer = setTimeout(() => setFlashMessage(null), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [flashMessage, setFlashMessage]);

  // Flash message: remove from DOM after exit animation
  useEffect(() => {
    if (!flashExiting) return;
    const timer = setTimeout(() => {
      setFlashExiting(false);
      lastFlashRef.current = null;
    }, EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [flashExiting]);

  // Auth error: track enter/exit animation
  useEffect(() => {
    if (authError) {
      lastErrorRef.current = authError;
      setErrorExiting(false);
    } else if (lastErrorRef.current != null) {
      setErrorExiting(true);
    }
  }, [authError]);

  // Auth error: auto-dismiss
  useEffect(() => {
    if (!authError) return;
    const timer = setTimeout(() => setAuthError(null), ERROR_DURATION_MS);
    return () => clearTimeout(timer);
  }, [authError, setAuthError]);

  // Auth error: remove from DOM after exit animation
  useEffect(() => {
    if (!errorExiting) return;
    const timer = setTimeout(() => {
      setErrorExiting(false);
      lastErrorRef.current = null;
    }, EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [errorExiting]);

  const showFlash = !!(flashMessage || flashExiting);
  const showError = !!(authError || errorExiting);

  if (!showFlash && !showError) return null;

  // Fallback offset when header not yet measured
  const topOffset = headerHeight > 0 ? headerHeight + 10 : 82;

  return (
    <>
      <style>{`
        @keyframes auth-toast-in {
          0%   { opacity: 0; transform: translate(-50%, -10px); }
          100% { opacity: 1; transform: translate(-50%, 0px); }
        }
        @keyframes auth-toast-out {
          0%   { opacity: 1; transform: translate(-50%, 0px); }
          100% { opacity: 0; transform: translate(-50%, -6px); }
        }
        .auth-toast-enter { animation: auth-toast-in  0.30s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .auth-toast-exit  { animation: auth-toast-out 0.20s ease-in forwards; }
      `}</style>

      {showFlash && (
        <div
          className={cn(
            'fixed left-1/2 z-[140] w-[min(88vw,500px)]',
            flashExiting ? 'auth-toast-exit' : 'auth-toast-enter'
          )}
          style={{ top: topOffset }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-full border border-emerald-200/80 bg-white/80 px-5 py-2.5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-4px_rgba(16,185,129,0.14),0_2px_10px_rgba(0,0,0,0.06)]">
            <Check
              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[13.5px] font-semibold tracking-[0.01em] text-emerald-700 truncate">
              {flashMessage ?? lastFlashRef.current}
            </span>
          </div>
        </div>
      )}

      {showError && (
        <div
          className={cn(
            'fixed left-1/2 z-[140] w-[min(88vw,500px)]',
            errorExiting ? 'auth-toast-exit' : 'auth-toast-enter'
          )}
          style={{ top: topOffset }}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3 rounded-full border border-red-200/80 bg-white/80 px-5 py-2.5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-4px_rgba(239,68,68,0.14),0_2px_10px_rgba(0,0,0,0.06)]">
            <AlertCircle
              className="h-3.5 w-3.5 shrink-0 text-red-500"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[13.5px] font-semibold tracking-[0.01em] text-red-600 truncate">
              {authError ?? lastErrorRef.current}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

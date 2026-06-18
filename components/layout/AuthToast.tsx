'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const FLASH_DURATION_MS = 4500;
const ERROR_DURATION_MS = 5000;
const EXIT_DURATION_MS = 240;
/** Sotto header (z-100) e menu nav (z-110+), sopra il contenuto pagina. */
const AUTH_TOAST_Z = 90;

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
        <ToastPill
          variant="success"
          message={flashMessage ?? lastFlashRef.current ?? ''}
          exiting={flashExiting}
          topOffset={topOffset}
        />
      )}

      {showError && (
        <ToastPill
          variant="error"
          message={authError ?? lastErrorRef.current ?? ''}
          exiting={errorExiting}
          topOffset={topOffset}
        />
      )}
    </>
  );
}

function ToastPill({
  variant,
  message,
  exiting,
  topOffset,
}: {
  variant: 'success' | 'error';
  message: string;
  exiting: boolean;
  topOffset: number;
}) {
  const isError = variant === 'error';
  const Icon = isError ? AlertCircle : Check;

  return (
    // Outer wrapper is shrink-to-fit (no fixed width) so the pill hugs its
    // content and stays horizontally centered via the -50% transform.
    <div
      className={cn(
        'fixed left-1/2 w-auto max-w-[min(92vw,440px)]',
        exiting ? 'auth-toast-exit' : 'auth-toast-enter'
      )}
      style={{ top: topOffset, zIndex: AUTH_TOAST_Z }}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div
        className={cn(
          'inline-flex max-w-full items-center justify-center gap-2 rounded-full border bg-white/80 px-4 py-2 backdrop-blur-2xl backdrop-saturate-150',
          isError
            ? 'border-red-200/80 shadow-[0_8px_32px_-4px_rgba(239,68,68,0.14),0_2px_10px_rgba(0,0,0,0.06)]'
            : 'border-emerald-200/80 shadow-[0_8px_32px_-4px_rgba(16,185,129,0.14),0_2px_10px_rgba(0,0,0,0.06)]'
        )}
      >
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            isError ? 'text-red-500' : 'text-emerald-500'
          )}
          strokeWidth={2.5}
          aria-hidden
        />
        <span
          className={cn(
            'min-w-0 truncate text-[13.5px] font-semibold tracking-[0.01em]',
            isError ? 'text-red-600' : 'text-emerald-700'
          )}
        >
          {message}
        </span>
      </div>
    </div>
  );
}

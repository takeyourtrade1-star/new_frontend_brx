'use client';

/**
 * Popup di "gate" per autenticazione contestuale.
 *
 * Mostrato quando un utente NON loggato tenta un'azione che richiede login
 * (es. fare un'offerta su un'asta). Tre step gestiti internamente:
 *   1. email     → l'utente scrive l'email e sceglie "Accedi" o "Registrati"
 *   2. password  → input password + link "Accedi con codice monouso"
 *   3. code      → 8 caratteri ricevuti via email + countdown reinvia
 *
 * Login (password o codice) avviene IN-MODAL: nessuna navigazione, scroll
 * preservato. La registrazione naviga a /registrati?returnTo=... per usare
 * il form esteso esistente, e dopo il successo riporta alla pagina di partenza.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail, X, AlertCircle, Lock, KeyRound } from 'lucide-react';
import { EmailCodeInput } from '@/components/auth/email-code-input';
import {
  useLogin,
  useRequestLoginCode,
  useVerifyLoginCode,
} from '@/lib/hooks/use-auth';
import { parseAuthError } from '@/lib/api/auth-error';

type Step = 'email' | 'password' | 'code';

export interface LoginGateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** URL su cui tornare dopo la registrazione. Se assente usa l'URL corrente. */
  returnTo?: string;
  /** Titolo personalizzato (default: "Accedi o registrati per offrire") */
  title?: string;
  /** Sottotitolo personalizzato sotto al titolo */
  subtitle?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBase =
  'h-[52px] w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all disabled:opacity-50';

export function LoginGateModal({
  open,
  onClose,
  onSuccess,
  returnTo,
  title = 'Accedi o registrati per offrire',
  subtitle = 'Bastano pochi secondi per partecipare all\u2019asta.',
}: LoginGateModalProps) {
  const router = useRouter();
  const loginMutation = useLogin();
  const requestCodeMutation = useRequestLoginCode();
  const verifyCodeMutation = useVerifyLoginCode();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const resolveReturnTo = useCallback((): string => {
    if (returnTo) return returnTo;
    if (typeof window === 'undefined') return '/';
    return window.location.pathname + window.location.search;
  }, [returnTo]);

  const resetState = useCallback(() => {
    setStep('email');
    setPassword('');
    setCode('');
    setError(null);
    setEmailError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(resetState, 200);
      return () => clearTimeout(t);
    }
  }, [open, resetState]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (step === 'email') {
      const t = setTimeout(() => emailInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    if (step === 'password') {
      const t = setTimeout(() => passwordInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, step]);

  useEffect(() => {
    if (step !== 'code' || countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((p) => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [step, countdown]);

  const formattedCountdown = useMemo(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [countdown]);

  const trimmedEmail = email.trim().toLowerCase();
  const isValidEmail = EMAIL_REGEX.test(trimmedEmail);

  const goLogin = useCallback(() => {
    if (!isValidEmail) {
      setEmailError('Inserisci un indirizzo email valido.');
      return;
    }
    setEmailError(null);
    setError(null);
    setStep('password');
  }, [isValidEmail]);

  const goRegister = useCallback(() => {
    const url = new URL('/registrati', window.location.origin);
    if (isValidEmail) url.searchParams.set('email', trimmedEmail);
    url.searchParams.set('returnTo', resolveReturnTo());
    onClose();
    router.push(url.pathname + url.search);
  }, [isValidEmail, trimmedEmail, resolveReturnTo, router, onClose]);

  const submitPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password) {
        setError('Inserisci la password.');
        return;
      }
      setError(null);
      try {
        const result = await loginMutation.mutateAsync({
          email: trimmedEmail,
          password,
        });
        if (result.mfaRequired) {
          onClose();
          router.push('/login/verify-mfa');
          return;
        }
        onSuccess?.();
        onClose();
      } catch (err) {
        setError(parseAuthError(err).message);
      }
    },
    [password, trimmedEmail, loginMutation, onClose, onSuccess, router]
  );

  const requestCode = useCallback(async () => {
    setError(null);
    setCode('');
    try {
      await requestCodeMutation.mutateAsync(trimmedEmail);
      setStep('code');
      setCountdown(300);
    } catch (err) {
      setError(parseAuthError(err).message);
    }
  }, [trimmedEmail, requestCodeMutation]);

  const verifyCode = useCallback(
    async (value: string) => {
      setError(null);
      try {
        const result = await verifyCodeMutation.mutateAsync({
          email: trimmedEmail,
          code: value,
        });
        if (result.mfaRequired) {
          onClose();
          router.push('/login/verify-mfa');
          return;
        }
        onSuccess?.();
        onClose();
      } catch (err) {
        setError(parseAuthError(err).message);
      }
    },
    [trimmedEmail, verifyCodeMutation, onClose, onSuccess, router]
  );

  const resendCode = useCallback(async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      await requestCodeMutation.mutateAsync(trimmedEmail);
      setCountdown(300);
    } catch (err) {
      setError(parseAuthError(err).message);
    }
  }, [trimmedEmail, requestCodeMutation, countdown]);

  if (!open) return null;

  const isLoginPending = loginMutation.isPending;
  const isRequestPending = requestCodeMutation.isPending;
  const isVerifyPending = verifyCodeMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-[fadeIn_0.18s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-gate-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/60 bg-white/95 shadow-[0_32px_64px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-xl animate-[fadeInUp_0.22s_cubic-bezier(0.16,1,0.3,1)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#86868b] transition hover:bg-black/5 hover:text-[#1d1d1f]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-7 pb-7 pt-9 sm:px-9 sm:pb-9 sm:pt-10">
          {step === 'email' && (
            <div className="flex flex-col">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE0CC] to-[#FFB785] text-[#FF7300]">
                  <Mail className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2
                  id="login-gate-title"
                  className="text-[20px] font-bold tracking-tight text-[#1d1d1f] sm:text-[22px]"
                >
                  {title}
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.45] text-[#86868b]">
                  {subtitle}
                </p>
              </div>

              <label
                htmlFor="login-gate-email"
                className="mb-1.5 pl-1 text-[12px] font-semibold uppercase tracking-wide text-[#86868b]"
              >
                Email
              </label>
              <input
                ref={emailInputRef}
                id="login-gate-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goLogin();
                }}
                className={inputBase}
              />
              {emailError && (
                <p className="mt-2 flex items-center gap-1.5 pl-1 text-[12px] text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {emailError}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={goRegister}
                  disabled={!isValidEmail}
                  className="rounded-full border border-black/10 bg-white px-4 py-3.5 text-[14px] font-semibold text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Registrati
                </button>
                <button
                  type="button"
                  onClick={goLogin}
                  disabled={!isValidEmail}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  Accedi
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-5 text-center text-[11.5px] leading-[1.5] text-[#86868b]">
                Continuando accetti i Termini di Servizio e la Privacy Policy di
                Ebartex.
              </p>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={submitPassword} className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                }}
                className="mb-4 inline-flex w-fit items-center gap-1 text-[12.5px] font-medium text-[#86868b] transition hover:text-[#1d1d1f]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Indietro
              </button>

              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-[#1d1d1f]">
                  <Lock className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2 className="text-[19px] font-bold tracking-tight text-[#1d1d1f] sm:text-[21px]">
                  Bentornato
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.45] text-[#86868b]">
                  Inserisci la password di{' '}
                  <span className="font-semibold text-[#1d1d1f]">
                    {trimmedEmail}
                  </span>
                </p>
              </div>

              <label
                htmlFor="login-gate-password"
                className="mb-1.5 pl-1 text-[12px] font-semibold uppercase tracking-wide text-[#86868b]"
              >
                Password
              </label>
              <input
                ref={passwordInputRef}
                id="login-gate-password"
                type="password"
                autoComplete="current-password"
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className={inputBase}
                disabled={isLoginPending}
              />

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <p className="text-[12.5px] leading-snug text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoginPending || !password}
                className="mt-5 w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoginPending ? 'Accesso in corso\u2026' : 'Accedi'}
              </button>

              <div className="mt-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-black/8" />
                <span className="text-[10.5px] font-medium uppercase tracking-[0.15em] text-[#86868b]">
                  oppure
                </span>
                <span className="h-px flex-1 bg-black/8" />
              </div>

              <button
                type="button"
                onClick={requestCode}
                disabled={isRequestPending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-3 text-[14px] font-semibold text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {isRequestPending
                  ? 'Invio codice\u2026'
                  : 'Accedi con codice monouso'}
              </button>

              <p className="mt-4 text-center text-[12.5px] text-[#515154]">
                <a
                  href="/recupera-credenziali"
                  className="font-medium text-[#0066cc] hover:underline"
                >
                  Password dimenticata?
                </a>
              </p>
            </form>
          )}

          {step === 'code' && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setStep('password');
                  setError(null);
                  setCode('');
                }}
                className="mb-4 inline-flex w-fit items-center gap-1 text-[12.5px] font-medium text-[#86868b] transition hover:text-[#1d1d1f]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Indietro
              </button>

              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-[#1d1d1f]">
                  <Mail className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2 className="text-[19px] font-bold tracking-tight text-[#1d1d1f] sm:text-[21px]">
                  Controlla la tua email
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.45] text-[#86868b]">
                  Abbiamo inviato un codice a 8 caratteri a{' '}
                  <span className="font-semibold text-[#1d1d1f]">
                    {trimmedEmail}
                  </span>
                </p>
              </div>

              <EmailCodeInput
                value={code}
                onChange={setCode}
                onComplete={(v) => {
                  if (v.length === 8) verifyCode(v);
                }}
                disabled={isVerifyPending}
              />

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <p className="text-[12.5px] leading-snug text-red-600">{error}</p>
                </div>
              )}

              <p className="mt-4 text-center text-[12px] text-[#86868b]">
                {countdown > 0
                  ? `Reinvia disponibile tra ${formattedCountdown}`
                  : 'Non hai ricevuto il codice?'}
              </p>

              <button
                type="button"
                onClick={resendCode}
                disabled={isRequestPending || countdown > 0}
                className="mt-1 text-center text-[13px] font-medium text-[#0066cc] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
              >
                Reinvia codice
              </button>

              <button
                type="button"
                onClick={() => {
                  if (code.length === 8) verifyCode(code);
                }}
                disabled={isVerifyPending || code.length !== 8}
                className="mt-5 w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isVerifyPending ? 'Accesso in corso\u2026' : 'Accedi'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

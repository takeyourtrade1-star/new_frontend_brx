'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useCurrentUser, useEnableMFA, useVerifyMFASetup, useDisableMFA } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, ShieldCheck, ShieldOff, Copy, Check, ArrowLeft, Smartphone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const STEP_KEYS = [
  'accountPage.sec2faStep1',
  'accountPage.sec2faStep2',
  'accountPage.sec2faStep3',
  'accountPage.sec2faStep4',
  'accountPage.sec2faStep5',
] as const;

// Schema validazione MFA code (6 cifre)
const mfaCodeSchema = z.object({
  mfa_code: z
    .string()
    .min(6, 'Il codice deve essere di 6 cifre')
    .max(6, 'Il codice deve essere di 6 cifre')
    .regex(/^\d+$/, 'Il codice deve contenere solo numeri'),
});

type MFACodeFormValues = z.infer<typeof mfaCodeSchema>;

// Schema validazione password per disabilitare MFA
const disableMFASchema = z.object({
  password: z.string().min(1, 'La password è obbligatoria'),
});

type DisableMFAFormValues = z.infer<typeof disableMFASchema>;

function StatusCard({ isEnabled }: { isEnabled: boolean }) {
  return (
    <div
      className={`border p-5 rounded-[20px] ${
        isEnabled ? 'border-[#FF7300] bg-[#FF7300]/5' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
          style={{ backgroundColor: isEnabled ? '#FF7300' : '#D1D5DB' }}
        >
          {isEnabled ? (
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2} />
          ) : (
            <ShieldOff className="h-6 w-6 text-white" strokeWidth={2} />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1D1D1F]">
            {isEnabled ? 'Autenticazione a due fattori attiva' : 'Autenticazione a due fattori non attiva'}
          </h2>
          <p className="mt-1 text-sm text-[#86868B]">
            {isEnabled
              ? 'Il tuo account è protetto con 2FA. Ogni accesso richiederà un codice dalla tua app di autenticazione.'
              : 'Attiva 2FA per aggiungere un livello di sicurezza aggiuntivo al tuo account.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="border border-red-100 bg-red-50 p-4 rounded-[16px]">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

export function SicurezzaContent() {
  const { t } = useTranslation();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();

  const enableMFAMutation = useEnableMFA();
  const verifyMFAMutation = useVerifyMFASetup();
  const disableMFAMutation = useDisableMFA();

  const [setupData, setSetupData] = useState<{ qr_code_url: string; secret: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [disableError, setDisableError] = useState<string | null>(null);

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
    setValue: setVerifyValue,
    watch: watchVerifyCode,
    reset: resetVerify,
  } = useForm<MFACodeFormValues>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { mfa_code: '' },
  });

  const {
    register: registerDisable,
    handleSubmit: handleSubmitDisable,
    formState: { errors: disableErrors },
    reset: resetDisable,
  } = useForm<DisableMFAFormValues>({
    resolver: zodResolver(disableMFASchema),
    defaultValues: { password: '' },
  });

  const isMFAEnabled = user?.mfa_enabled ?? false;
  const verifyMfaCode = watchVerifyCode('mfa_code');
  const verifyDigits = useMemo(() => {
    const raw = (verifyMfaCode ?? '').toString();
    const only = raw.replace(/\D/g, '').slice(0, 6);
    return only.padEnd(6, ' ').split('').slice(0, 6);
  }, [verifyMfaCode]);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleEnableMFA = async () => {
    setSetupError(null);
    setSetupData(null);
    resetVerify();

    try {
      const data = await enableMFAMutation.mutateAsync();
      setSetupData(data);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || "Errore durante l'attivazione MFA";
      setSetupError(message);
    }
  };

  const onSubmitVerify = async (formData: MFACodeFormValues) => {
    setVerifyError(null);
    try {
      await verifyMFAMutation.mutateAsync({ mfa_code: formData.mfa_code });
      setSetupData(null);
      resetVerify();
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Codice MFA non valido';
      setVerifyError(message);
    }
  };

  const onSubmitDisable = async (formData: DisableMFAFormValues) => {
    setDisableError(null);
    try {
      await disableMFAMutation.mutateAsync({ password: formData.password });
      resetDisable();
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Errore durante la disattivazione MFA';
      setDisableError(message);
    }
  };

  const copySecret = useCallback(() => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [setupData?.secret]);

  const cancelSetup = () => {
    setSetupData(null);
    setSetupError(null);
    setVerifyError(null);
    resetVerify();
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] px-4 py-10">
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#FF7300]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mt-4 bg-white rounded-[24px] border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.06)] px-6 sm:px-8 py-10">
          <h1 className="mb-8 text-2xl font-bold text-[#1D1D1F]">
            {t('sidebar.security')}
          </h1>

          <StatusCard isEnabled={isMFAEnabled} />

          <hr className="my-8 border-t border-gray-200" />

          {!isMFAEnabled ? (
            <>
              {!setupData && (
                <>
                  <section className="mb-8">
                    <h2 className="mb-3 text-xl font-semibold text-[#1D1D1F]">
                      {t('accountPage.sec2faTitle')}
                    </h2>
                    <p className="text-sm text-[#86868B]">{t('accountPage.sec2faIntro')}</p>
                  </section>

                  <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold text-[#1D1D1F]">
                      {t('accountPage.sec2faHowTitle')}
                    </h2>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-[#86868B]">
                      {STEP_KEYS.map((key) => (
                        <li key={key}>{t(key)}</li>
                      ))}
                    </ol>
                  </section>

                  <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold text-[#1D1D1F]">
                      {t('accountPage.secDownloadAuthTitle')}
                    </h2>
                    <p className="mb-4 text-sm text-[#86868B]">{t('accountPage.secDownloadAuthText')}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <a
                        href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 border border-gray-200 bg-white p-4 rounded-[16px] transition-all hover:border-[#FF7300] hover:shadow-sm"
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                          style={{ backgroundColor: '#FF7300' }}
                        >
                          <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1D1D1F]">Google Authenticator</p>
                          <p className="text-xs text-[#86868B]">Android & iOS</p>
                        </div>
                      </a>
                      <a
                        href="https://apps.apple.com/app/google-authenticator/id388497605"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 border border-gray-200 bg-white p-4 rounded-[16px] transition-all hover:border-[#FF7300] hover:shadow-sm"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gray-500">
                          <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1D1D1F]">Authy</p>
                          <p className="text-xs text-[#86868B]">Android & iOS</p>
                        </div>
                      </a>
                    </div>
                  </section>

                  {setupError && <ErrorMessage message={setupError} />}

                  <section className="mt-6">
                    <Button
                      onClick={handleEnableMFA}
                      disabled={enableMFAMutation.isPending}
                      className="h-12 w-full rounded-[16px] bg-[#FF7300] text-white font-semibold hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enableMFAMutation.isPending ? 'Caricamento...' : 'Attiva MFA'}
                    </Button>
                  </section>
                </>
              )}

              {setupData && (
                <section className="space-y-8">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelSetup}
                      className="inline-flex items-center gap-2 text-[#007AFF] hover:opacity-80"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Indietro
                    </button>
                  </div>

                  <div>
                    <h2 className="mb-2 text-xl font-semibold text-[#1D1D1F]">
                      Configura autenticatore
                    </h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
                    <div className="bg-[#F2F2F7] rounded-[16px] p-4 flex flex-col items-center">
                      <p className="mb-3 text-sm font-semibold text-[#86868B]">
                        {t('accountPage.secScanQr')}
                      </p>
                      <div className="h-[160px] w-[160px] rounded-[14px] bg-white flex items-center justify-center border border-black/5">
                        <img
                          src={setupData.qr_code_url}
                          alt="QR Code MFA"
                          className="h-[140px] w-[140px] object-contain"
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#86868B]">
                          Oppure inserisci manualmente
                        </p>
                        <div className="flex items-center gap-3 bg-[#F2F2F7] border border-black/5 rounded-[16px] p-3">
                          <code className="flex-1 break-all text-sm font-mono text-[#1D1D1F]">
                            {setupData.secret}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={copySecret}
                            className="h-9 w-9 rounded-[12px] bg-white border border-black/5 hover:bg-white/80"
                          >
                            {copiedSecret ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-[#1D1D1F]" />
                            )}
                          </Button>
                        </div>
                        {copiedSecret && <p className="mt-2 text-xs text-green-600">Copiato!</p>}
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#86868B]">
                          {t('accountPage.secEnterCode')}
                        </p>

                        {verifyError && <ErrorMessage message={verifyError} />}

                        <form onSubmit={handleSubmitVerify(onSubmitVerify)} className="space-y-4">
                          <input type="hidden" {...registerVerify('mfa_code')} />

                          <div className="flex items-center justify-between gap-3">
                            {verifyDigits.map((digit, idx) => {
                              const filled = digit.trim().length > 0;
                              return (
                                <input
                                  key={idx}
                                  ref={(el) => {
                                    otpRefs.current[idx] = el;
                                  }}
                                  value={filled ? digit : ''}
                                  inputMode="numeric"
                                  aria-label={`MFA digit ${idx + 1}`}
                                  disabled={verifyMFAMutation.isPending}
                                  className="w-12 h-12 rounded-[12px] bg-[#F2F2F7] border border-transparent text-center text-2xl font-semibold text-[#1D1D1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300] focus-visible:ring-offset-2 focus-visible:ring-offset-white transition"
                                  onChange={(e) => {
                                    const nextDigit = e.target.value.replace(/\D/g, '').slice(-1);
                                    if (!nextDigit) {
                                      const arr = verifyDigits.map((d, i) => (i === idx ? ' ' : d));
                                      const next = arr.map((d) => d.trim()).join('');
                                      setVerifyValue('mfa_code', next.slice(0, 6));
                                      return;
                                    }

                                    const arr = verifyDigits.map((d, i) => {
                                      if (i === idx) return nextDigit;
                                      return d.trim() ? d.trim() : ' ';
                                    });
                                    const next = arr.map((d) => d.trim()).join('');
                                    setVerifyValue('mfa_code', next.slice(0, 6), { shouldValidate: true });
                                    if (idx < 5) otpRefs.current[idx + 1]?.focus();
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Backspace') {
                                      const current = verifyDigits[idx]?.trim();
                                      if (!current && idx > 0) otpRefs.current[idx - 1]?.focus();
                                    }
                                  }}
                                  onPaste={(e) => {
                                    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                    if (!pasted) return;
                                    setVerifyValue('mfa_code', pasted, { shouldValidate: true });
                                    const lastIdx = Math.min(5, pasted.length - 1);
                                    otpRefs.current[lastIdx]?.focus();
                                    e.preventDefault();
                                  }}
                                />
                              );
                            })}
                          </div>

                          {verifyErrors.mfa_code && (
                            <p className="text-xs text-red-500">{verifyErrors.mfa_code.message}</p>
                          )}

                          <Button
                            type="submit"
                            disabled={verifyMFAMutation.isPending}
                            className="h-12 w-full rounded-[16px] bg-[#FF7300] text-white font-semibold hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyMFAMutation.isPending ? 'Verifica...' : t('accountPage.secConfirm')}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="max-w-md mx-auto space-y-6">
              <h2 className="text-xl font-semibold text-[#1D1D1F]">
                Disattiva autenticazione a due fattori
              </h2>

              <p className="text-sm text-[#86868B]">
                Per disattivare MFA, inserisci la tua password di conferma.
              </p>

              {disableError && <ErrorMessage message={disableError} />}

              <form onSubmit={handleSubmitDisable(onSubmitDisable)} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#86868B]"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Inserisci la tua password"
                    className="h-12 rounded-[14px] bg-[#F2F2F7] border border-black/5 focus-visible:ring-2 focus-visible:ring-[#FF7300]"
                    disabled={disableMFAMutation.isPending}
                    {...registerDisable('password')}
                  />
                  {disableErrors.password && (
                    <p className="mt-2 text-xs text-red-500">{disableErrors.password.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={disableMFAMutation.isPending}
                    className="h-12 w-full rounded-[16px] border border-red-200 bg-white text-[#FF3B30] font-semibold hover:bg-red-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disableMFAMutation.isPending ? 'Disattivazione...' : 'Disattiva MFA'}
                  </Button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

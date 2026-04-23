'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  CheckCircle2,
  Loader2,
  Crown,
  Swords,
  ArrowRight,
  ArrowLeft,
  ClipboardPaste,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  ChevronDown,
  RefreshCw,
  Send,
  Share2,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { P2PRoom as P2PRoomState, P2PActions } from '@/hooks/useP2PRoom';
import { QrScanner } from '@/components/game/QrScanner';

type Flow = 'idle' | 'host' | 'guest';
type CopyKind = 'invite' | 'answer' | null;
type ScannerTarget = 'invite' | 'answer' | null;

interface P2PLobbyProps {
  onConnected?: () => void;
  room: P2PRoomState;
  actions: P2PActions;
}

/* ── Motion presets ─────────────────────────────────────────────────── */
const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

/* ═══════════════════════════════════════════════════════════════════════
   P2PLobby — UI-only redesign. Connection logic stays in useP2PRoom.
   ═══════════════════════════════════════════════════════════════════════ */
export function P2PLobby({ onConnected, room, actions }: P2PLobbyProps) {
  const [flow, setFlow] = useState<Flow>('idle');
  const [joinSignal, setJoinSignal] = useState('');
  const [answerSignal, setAnswerSignal] = useState('');
  const [copied, setCopied] = useState<CopyKind>(null);
  const [showFullInvite, setShowFullInvite] = useState(false);
  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<ScannerTarget>(null);
  const [canShare, setCanShare] = useState(false);
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  /* ── Feature detection: Web Share API ─────────────────────────────── */
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  /* ── Flow inference (robust vs. mid-connection refreshes) ─────────── */
  const activeFlow: Flow = useMemo(() => {
    if (room.isHost) return 'host';
    if (room.state === 'joining' || (room.state === 'waiting' && !room.isHost)) return 'guest';
    return flow;
  }, [room.isHost, room.state, flow]);

  /* ── Connected notify (safe side-effect via effect) ───────────────── */
  useEffect(() => {
    if (room.state === 'connected') onConnected?.();
  }, [room.state, onConnected]);

  /* ── Reset local UI when room returns to idle ─────────────────────── */
  useEffect(() => {
    if (room.state === 'idle') {
      setJoinSignal('');
      setAnswerSignal('');
      setShowFullInvite(false);
      setShowFullAnswer(false);
    }
  }, [room.state]);

  /* ── Handlers (delegate to actions — logic untouched) ─────────────── */
  const handleStartHost = async () => {
    setFlow('host');
    await actions.createRoom();
  };

  const handleStartGuest = () => setFlow('guest');

  const handleJoin = async () => {
    const code = joinSignal.trim();
    if (!code) return;
    await actions.joinRoom(code);
  };

  const handleApplyAnswer = async () => {
    const code = answerSignal.trim();
    if (!code) return;
    await actions.submitAnswer(code);
    setAnswerSignal('');
  };

  const handleBack = () => {
    if (room.state !== 'idle') actions.disconnect();
    setFlow('idle');
    setJoinSignal('');
    setAnswerSignal('');
    setShowFullInvite(false);
    setShowFullAnswer(false);
  };

  const handleRetry = () => {
    actions.disconnect();
    setFlow('idle');
    setJoinSignal('');
    setAnswerSignal('');
  };

  const handleCopy = useCallback(async (kind: Exclude<CopyKind, null>) => {
    if (!room.localSignal) return;
    try {
      await navigator.clipboard.writeText(room.localSignal);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard might be blocked — user can copy manually */
    }
  }, [room.localSignal]);

  const handlePasteInto = async (setter: (v: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text.trim());
        setPasteHint(null);
      }
    } catch {
      setPasteHint('Premi Ctrl+V nel campo sopra per incollare manualmente');
      setTimeout(() => setPasteHint(null), 4000);
    }
  };

  /* ── Web Share API (native share sheet, fallback to copy) ─────────── */
  const handleShare = useCallback(async (kind: Exclude<CopyKind, null>) => {
    if (!room.localSignal) return;
    const payload =
      kind === 'invite'
        ? {
            title: 'Sfida 1v1 — Carta Forbice Sasso',
            text: `Unisciti alla mia sfida su Ebartex! Incolla questo invito nel gioco:\n\n${room.localSignal}`,
          }
        : {
            title: 'Risposta alla sfida 1v1',
            text: `Ecco la mia risposta, incollala per avviare il duello:\n\n${room.localSignal}`,
          };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* user cancelled or share failed — silent fallback */
      }
    }
    await handleCopy(kind);
  }, [room.localSignal, handleCopy]);

  /* ── QR Scanner wiring (auto-fire on success) ─────────────────────── */
  const handleScanResult = useCallback(async (raw: string) => {
    const code = raw.trim();
    const target = scannerTarget;
    setScannerTarget(null);
    if (!code) return;

    if (target === 'invite') {
      setJoinSignal(code);
      await actions.joinRoom(code);
    } else if (target === 'answer') {
      setAnswerSignal(code);
      await actions.submitAnswer(code);
    }
  }, [scannerTarget, actions]);

  /* ── Stepper state (3 semantic steps) ─────────────────────────────── */
  const currentStep: 1 | 2 | 3 = (() => {
    if (room.state === 'connected') return 3;
    if (room.state === 'waiting' && room.localSignal) return 2;
    return 1;
  })();

  const steps: { id: 1 | 2 | 3; label: string; hint: string }[] =
    activeFlow === 'guest'
      ? [
          { id: 1, label: 'Invito', hint: 'Ricevi dall\u2019host' },
          { id: 2, label: 'Risposta', hint: 'Inviala indietro' },
          { id: 3, label: 'Duello', hint: 'Pronti a sfidare' },
        ]
      : [
          { id: 1, label: 'Invito', hint: 'Crea e condividi' },
          { id: 2, label: 'Risposta', hint: 'Incollala qui' },
          { id: 3, label: 'Duello', hint: 'Pronti a sfidare' },
        ];

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-[#1D3160]/70 via-[#2a4080]/45 to-[#1D3160]/75 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden />

        <div className="relative p-5 sm:p-7 max-h-[82dvh] overflow-y-auto">

          {/* ── HERO ── */}
          <header className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-gradient-to-br from-primary/30 to-primary/10 shadow-[0_8px_24px_rgba(255,115,0,0.25)]">
                <Swords className="h-5 w-5 text-primary" />
                <motion.span
                  className="absolute inset-0 rounded-2xl border border-primary/40"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                />
              </div>
              <div>
                <h2 className="font-display text-lg uppercase tracking-[0.18em] text-white">Duello 1v1</h2>
                <p className="text-xs text-white/60">Peer&#8209;to&#8209;peer diretto, zero server</p>
              </div>
            </div>

            {room.roomCode && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/70">
                <span className="opacity-60">Stanza</span>
                <span className="text-white">#{room.roomCode}</span>
              </div>
            )}
          </header>

          {/* ── STEPPER (hidden on initial choose screen) ── */}
          {activeFlow !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="grid grid-cols-3 gap-2">
                {steps.map((step, idx) => {
                  const isDone = step.id < currentStep;
                  const isActive = step.id === currentStep;
                  const isError = room.state === 'error' && step.id === currentStep;

                  const dotClass = isError
                    ? 'border-red-400/70 bg-red-500/20 text-red-300'
                    : isDone
                      ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-300'
                      : isActive
                        ? 'border-primary bg-primary/25 text-primary shadow-[0_0_14px_rgba(255,115,0,0.35)]'
                        : 'border-white/15 bg-white/5 text-white/40';

                  return (
                    <div key={step.id} className="relative">
                      {idx < steps.length - 1 && (
                        <div className="pointer-events-none absolute left-[calc(50%+1.125rem)] top-[0.95rem] h-px w-[calc(100%-2.25rem)] bg-white/15" />
                      )}
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition ${dotClass}`}>
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : isActive && !isError ? (
                            <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>{step.id}</motion.span>
                          ) : step.id}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{step.label}</p>
                        <p className="mt-0.5 hidden text-[9px] leading-tight text-white/45 sm:block">{step.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── CONTENT ── */}
          <AnimatePresence mode="wait">

            {/* ═══ CHOOSE ROLE ═══ */}
            {activeFlow === 'idle' && room.state === 'idle' && (
              <motion.section key="choose" {...fadeSlide} className="space-y-4">
                <div className="text-center">
                  <h3 className="font-display text-base uppercase tracking-[0.2em] text-white/90">Come vuoi giocare?</h3>
                  <p className="mt-1 text-xs text-white/55">Scegli un ruolo per iniziare la sfida</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <motion.button
                    onClick={handleStartHost}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-4 text-left transition hover:border-primary/70 hover:shadow-[0_14px_40px_rgba(255,115,0,0.3)]"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/25 blur-2xl transition-opacity group-hover:opacity-90" />
                    <div className="relative grid h-11 w-11 place-items-center rounded-xl border border-primary/40 bg-primary/20 text-primary shadow-inner">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div className="relative">
                      <p className="font-display text-sm uppercase tracking-wider text-white">Crea partita</p>
                      <p className="mt-1 text-xs leading-snug text-white/60">Generi un invito da inviare al tuo amico via chat, SMS o email</p>
                    </div>
                    <div className="relative mt-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Inizia <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={handleStartGuest}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 via-cyan-500/10 to-transparent p-4 text-left transition hover:border-cyan-400/60 hover:shadow-[0_14px_40px_rgba(34,211,238,0.25)]"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/25 blur-2xl transition-opacity group-hover:opacity-90" />
                    <div className="relative grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-inner">
                      <Send className="h-5 w-5" />
                    </div>
                    <div className="relative">
                      <p className="font-display text-sm uppercase tracking-wider text-white">Unisciti</p>
                      <p className="mt-1 text-xs leading-snug text-white/60">Hai ricevuto un invito? Incollalo qui per connetterti</p>
                    </div>
                    <div className="relative mt-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Incolla invito <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </motion.button>
                </div>
              </motion.section>
            )}

            {/* ═══ CREATING / JOINING LOADER ═══ */}
            {(room.state === 'creating' || room.state === 'joining') && (
              <motion.section key="loading" {...fadeSlide} className="py-10 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                  className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-primary/10"
                >
                  <Loader2 className="h-6 w-6 text-primary" />
                </motion.div>
                <p className="font-display text-sm uppercase tracking-wider text-white">
                  {room.state === 'creating' ? 'Preparo l’invito' : 'Apro il canale'}
                </p>
                <p className="mt-1 text-xs text-white/55">Solo un istante&hellip;</p>
              </motion.section>
            )}

            {/* ═══ GUEST: paste invite ═══ */}
            {activeFlow === 'guest' && room.state === 'idle' && (
              <motion.section key="guest-idle" {...fadeSlide} className="space-y-4">
                <div>
                  <h3 className="font-display text-sm uppercase tracking-wider text-white">1. Incolla l&apos;invito dell&apos;host</h3>
                  <p className="mt-1 text-xs text-white/55">Il tuo amico te l&apos;ha inviato tramite chat. Incolla qui il codice completo.</p>
                </div>

                <div className="relative rounded-2xl border border-white/15 bg-white/[0.04] p-3 transition focus-within:border-cyan-400/60 focus-within:bg-white/[0.06]">
                  <textarea
                    value={joinSignal}
                    onChange={(e) => setJoinSignal(e.target.value)}
                    placeholder="Incolla qui l'invito ricevuto..."
                    rows={4}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full resize-none bg-transparent font-mono text-[11px] leading-relaxed text-white/90 placeholder:text-white/30 focus:outline-none"
                  />
                  {joinSignal && (
                    <button
                      type="button"
                      onClick={() => setJoinSignal('')}
                      className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/40 hover:bg-white/10 hover:text-white/80"
                    >
                      Pulisci
                    </button>
                  )}
                </div>

                {pasteHint && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                    <p className="text-[11px] text-amber-200">{pasteHint}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePasteInto(setJoinSignal)}
                    className="h-10 border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                  >
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    Incolla
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScannerTarget('invite')}
                    className="h-10 border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-white"
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scansiona QR
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={handleJoin}
                  disabled={!joinSignal.trim()}
                  className="h-11 w-full bg-primary font-semibold text-white shadow-[0_10px_28px_rgba(255,115,0,0.35)] hover:bg-primary/90 disabled:opacity-40 disabled:shadow-none"
                >
                  Apri partita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="mx-auto flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80"
                >
                  <ArrowLeft className="h-3 w-3" /> Torna alla scelta
                </button>
              </motion.section>
            )}

            {/* ═══ HOST: waiting (invite + answer form) ═══ */}
            {room.isHost && room.state === 'waiting' && room.localSignal && (
              <motion.section key="host-waiting" {...fadeSlide} className="space-y-5">

                {/* Step 1: share invite */}
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-black text-white">1</span>
                    <h3 className="font-display text-sm uppercase tracking-wider text-white">Invia l&apos;invito al tuo amico</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr] md:items-center">
                    <div className="mx-auto rounded-2xl border border-white/15 bg-white p-3 shadow-inner md:mx-0">
                      <QRCodeSVG value={room.localSignal} size={148} level="L" includeMargin={false} />
                    </div>

                    <div className="flex flex-col gap-2">
                      {canShare ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            onClick={() => handleShare('invite')}
                            className="h-11 justify-center bg-primary font-semibold text-white shadow-[0_10px_28px_rgba(255,115,0,0.35)] hover:bg-primary/90"
                          >
                            <Share2 className="mr-2 h-4 w-4" /> Condividi
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCopy('invite')}
                            className="h-11 justify-center border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                          >
                            {copied === 'invite' ? (
                              <><CheckCircle2 className="mr-2 h-4 w-4" /> Copiato!</>
                            ) : (
                              <><Copy className="mr-2 h-4 w-4" /> Copia</>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleCopy('invite')}
                          className="h-11 w-full justify-center bg-primary font-semibold text-white shadow-[0_10px_28px_rgba(255,115,0,0.35)] hover:bg-primary/90"
                        >
                          {copied === 'invite' ? (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Copiato!</>
                          ) : (
                            <><Copy className="mr-2 h-4 w-4" /> Copia invito</>
                          )}
                        </Button>
                      )}

                      <p className="text-[11px] leading-snug text-white/55">
                        Mandalo via <span className="text-white/75">WhatsApp, Telegram, email</span> o fagli scansionare il QR.
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowFullInvite((v) => !v)}
                        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/80"
                      >
                        <QrCode className="h-3 w-3" />
                        {showFullInvite ? 'Nascondi codice' : 'Mostra codice testuale'}
                        <ChevronDown className={`h-3 w-3 transition-transform ${showFullInvite ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFullInvite && (
                      <motion.div
                        key="invite-full"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <pre className="mt-3 max-h-28 select-all overflow-auto rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-white/70 whitespace-pre-wrap break-all">
                          {room.localSignal}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Step 2: paste answer */}
                <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-400 text-[11px] font-black text-[#0a1530]">2</span>
                    <h3 className="font-display text-sm uppercase tracking-wider text-white">Incolla la risposta del tuo amico</h3>
                  </div>

                  <p className="mb-2 text-[11px] leading-snug text-white/55">
                    Dopo che avrà aperto l&apos;invito, ti rimanderà un codice risposta. Incollalo qui per chiudere il cerchio.
                  </p>

                  <div className="relative rounded-xl border border-white/15 bg-white/[0.04] p-3 transition focus-within:border-cyan-400/60 focus-within:bg-white/[0.06]">
                    <textarea
                      value={answerSignal}
                      onChange={(e) => setAnswerSignal(e.target.value)}
                      placeholder="Incolla qui la risposta ricevuta..."
                      rows={3}
                      spellCheck={false}
                      autoComplete="off"
                      className="w-full resize-none bg-transparent font-mono text-[11px] leading-relaxed text-white/90 placeholder:text-white/30 focus:outline-none"
                    />
                    {answerSignal && (
                      <button
                        type="button"
                        onClick={() => setAnswerSignal('')}
                        className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/40 hover:bg-white/10 hover:text-white/80"
                      >
                        Pulisci
                      </button>
                    )}
                  </div>

                  {pasteHint && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-amber-300" />
                      <p className="text-[11px] text-amber-200">{pasteHint}</p>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handlePasteInto(setAnswerSignal)}
                      className="h-10 border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                    >
                      <ClipboardPaste className="mr-2 h-4 w-4" />
                      Incolla
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScannerTarget('answer')}
                      className="h-10 border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-white"
                    >
                      <ScanLine className="mr-2 h-4 w-4" />
                      Scansiona QR
                    </Button>
                  </div>

                  <Button
                    type="button"
                    onClick={handleApplyAnswer}
                    disabled={!answerSignal.trim()}
                    className="mt-2 h-11 w-full bg-cyan-500 font-semibold text-[#0a1530] shadow-[0_10px_28px_rgba(34,211,238,0.35)] hover:bg-cyan-400 disabled:opacity-40 disabled:shadow-none"
                  >
                    Connetti <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Waiting banner */}
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] text-white/60">
                  <motion.span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  In attesa che il tuo avversario risponda&hellip;
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  className="mx-auto flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80"
                >
                  <ArrowLeft className="h-3 w-3" /> Annulla partita
                </button>
              </motion.section>
            )}

            {/* ═══ GUEST: waiting (show answer to send back) ═══ */}
            {!room.isHost && room.state === 'waiting' && room.localSignal && (
              <motion.section key="guest-waiting" {...fadeSlide} className="space-y-5">
                <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-display text-sm uppercase tracking-wider text-white">Risposta pronta! Invia all&apos;host</h3>
                  </div>

                  <p className="mb-4 text-[11px] leading-snug text-white/55">
                    Copia questo codice e rimandalo al tuo amico tramite la stessa chat. Appena lo incolla, si apre la partita.
                  </p>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr] md:items-center">
                    <div className="mx-auto rounded-2xl border border-white/15 bg-white p-3 shadow-inner md:mx-0">
                      <QRCodeSVG value={room.localSignal} size={140} level="L" includeMargin={false} />
                    </div>

                    <div className="flex flex-col gap-2">
                      {canShare ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            onClick={() => handleShare('answer')}
                            className="h-11 justify-center bg-cyan-500 font-semibold text-[#0a1530] shadow-[0_10px_28px_rgba(34,211,238,0.35)] hover:bg-cyan-400"
                          >
                            <Share2 className="mr-2 h-4 w-4" /> Condividi
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCopy('answer')}
                            className="h-11 justify-center border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                          >
                            {copied === 'answer' ? (
                              <><CheckCircle2 className="mr-2 h-4 w-4" /> Copiato!</>
                            ) : (
                              <><Copy className="mr-2 h-4 w-4" /> Copia</>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleCopy('answer')}
                          className="h-11 w-full justify-center bg-cyan-500 font-semibold text-[#0a1530] shadow-[0_10px_28px_rgba(34,211,238,0.35)] hover:bg-cyan-400"
                        >
                          {copied === 'answer' ? (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Copiato!</>
                          ) : (
                            <><Copy className="mr-2 h-4 w-4" /> Copia risposta</>
                          )}
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowFullAnswer((v) => !v)}
                        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/80"
                      >
                        <QrCode className="h-3 w-3" />
                        {showFullAnswer ? 'Nascondi codice' : 'Mostra codice testuale'}
                        <ChevronDown className={`h-3 w-3 transition-transform ${showFullAnswer ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFullAnswer && (
                      <motion.div
                        key="answer-full"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <pre className="mt-3 max-h-28 select-all overflow-auto rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-white/70 whitespace-pre-wrap break-all">
                          {room.localSignal}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] text-white/60">
                  <motion.span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  In attesa che l&apos;host confermi&hellip;
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  className="mx-auto flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80"
                >
                  <ArrowLeft className="h-3 w-3" /> Annulla
                </button>
              </motion.section>
            )}

            {/* ═══ CONNECTED ═══ */}
            {room.state === 'connected' && (
              <motion.section
                key="connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                className="py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 14 }}
                  className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border-2 border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_32px_rgba(16,185,129,0.4)]"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </motion.div>
                <h3 className="font-display text-lg uppercase tracking-[0.2em] text-white">Connessi!</h3>
                <p className="mt-1 text-xs text-white/60">
                  Latenza <span className="font-mono text-emerald-300">{room.latency}ms</span> &#8212; il match sta per cominciare
                </p>
                <motion.div
                  className="mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-primary to-cyan-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </motion.div>
              </motion.section>
            )}

            {/* ═══ ERROR ═══ */}
            {room.state === 'error' && (
              <motion.section key="error" {...fadeSlide} className="space-y-4 py-4 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-red-400/50 bg-red-500/15">
                  <AlertTriangle className="h-6 w-6 text-red-300" />
                </div>
                <div>
                  <h3 className="font-display text-sm uppercase tracking-wider text-white">Connessione fallita</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    {room.error || 'Qualcosa non ha funzionato. Riprova.'}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleRetry}
                  className="bg-primary font-semibold text-white shadow-[0_10px_28px_rgba(255,115,0,0.35)] hover:bg-primary/90"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Riprova
                </Button>
              </motion.section>
            )}

          </AnimatePresence>

          {/* ── Footer trust ── */}
          <footer className="mt-5 flex items-center justify-center gap-1.5 border-t border-white/10 pt-3 text-[10px] text-white/40">
            <ShieldCheck className="h-3 w-3" />
            <span>Connessione P2P criptata &#8212; nessun dato transita per server</span>
          </footer>
        </div>
      </motion.div>

      {/* ── QR Scanner overlay (native BarcodeDetector) ── */}
      <QrScanner
        open={scannerTarget !== null}
        onClose={() => setScannerTarget(null)}
        onScan={handleScanResult}
        title={scannerTarget === 'answer' ? 'Scansiona risposta' : 'Scansiona invito'}
        hint={scannerTarget === 'answer'
          ? 'Inquadra il QR generato dal tuo avversario'
          : 'Inquadra il QR mostrato dall\u2019host'}
      />
    </div>
  );
}

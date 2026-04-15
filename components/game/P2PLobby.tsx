'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Users, Wifi, WifiOff, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { P2PRoom as P2PRoomState, P2PActions } from '@/hooks/useP2PRoom';

type RoleMode = 'host' | 'guest';
type StepState = 'upcoming' | 'current' | 'done' | 'error';

interface LobbyStep {
  id: number;
  title: string;
  hint: string;
  state: StepState;
}

interface P2PLobbyProps {
  onConnected?: () => void;
  room: P2PRoomState;
  actions: P2PActions;
}

export function P2PLobby({ onConnected, room, actions }: P2PLobbyProps) {
  const [mode, setMode] = useState<RoleMode>('host');
  const [joinSignal, setJoinSignal] = useState('');
  const [answerSignal, setAnswerSignal] = useState('');
  const [copied, setCopied] = useState(false);

  const activeMode: RoleMode = room.isHost ? 'host' : mode;

  const hostProgress = (() => {
    if (room.state === 'connected') return 4;
    if (room.remoteSignal) return 3;
    if (room.localSignal || room.state === 'waiting' || room.state === 'creating') return 2;
    return 1;
  })();

  const guestProgress = (() => {
    if (room.state === 'connected') return 4;
    if (!room.isHost && room.localSignal) return 3;
    if (room.state === 'joining' || joinSignal.trim().length > 0) return 2;
    return 1;
  })();

  const buildSteps = (): LobbyStep[] => {
    const hostSteps: Omit<LobbyStep, 'state'>[] = [
      { id: 1, title: 'Host', hint: 'Crea la stanza' },
      { id: 2, title: 'Condividi', hint: 'Invia codice o QR' },
      { id: 3, title: 'Risposta', hint: 'Incolla codice guest' },
      { id: 4, title: 'Connesso', hint: 'Pronti a giocare' },
    ];

    const guestSteps: Omit<LobbyStep, 'state'>[] = [
      { id: 1, title: 'Guest', hint: 'Ricevi codice host' },
      { id: 2, title: 'Incolla', hint: 'Inserisci codice host' },
      { id: 3, title: 'Invia', hint: 'Manda risposta host' },
      { id: 4, title: 'Connesso', hint: 'Pronti a giocare' },
    ];

    const rawSteps = activeMode === 'host' ? hostSteps : guestSteps;
    const progress = activeMode === 'host' ? hostProgress : guestProgress;

    return rawSteps.map((step) => {
      let state: StepState = 'upcoming';
      if (room.state === 'error' && step.id === progress) {
        state = 'error';
      } else if (step.id < progress) {
        state = 'done';
      } else if (step.id === progress && room.state !== 'connected') {
        state = 'current';
      } else if (step.id === 4 && room.state === 'connected') {
        state = 'done';
      }

      return {
        ...step,
        state,
      };
    });
  };

  const steps = buildSteps();

  const handleCopySignal = async () => {
    if (room.localSignal) {
      await navigator.clipboard.writeText(room.localSignal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateRoom = async () => {
    setMode('host');
    await actions.createRoom();
  };

  const handleJoin = async () => {
    if (joinSignal.trim()) {
      setMode('guest');
      await actions.joinRoom(joinSignal.trim());
    }
  };

  const handleApplyAnswer = async () => {
    if (answerSignal.trim()) {
      setMode('host');
      await actions.submitAnswer(answerSignal.trim());
      setAnswerSignal('');
    }
  };

  // Handle connected state
  if (room.state === 'connected') {
    onConnected?.();
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex items-center gap-3 text-emerald-500">
          <CheckCircle className="h-8 w-8" />
          <span className="text-xl font-semibold">Connessione stabilita!</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Wifi className="h-4 w-4" />
          <span>Latenza: {room.latency}ms</span>
        </div>
        <p className="text-center text-zinc-500">
          Giocatore 2 connesso in rete locale. Il match può iniziare!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/60 p-5 sm:p-6 shadow-2xl max-h-[78vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Carta Forbice Sasso 1v1</h2>
            <p className="text-sm text-zinc-500">Nessun server richiesto</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-6 p-3 bg-zinc-900/50 rounded-lg">
          {room.state === 'idle' && (
            <>
              <WifiOff className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">In attesa di connessione</span>
            </>
          )}
          {(room.state === 'creating' || room.state === 'joining') && (
            <>
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-sm text-zinc-400">Creazione stanza...</span>
            </>
          )}
          {room.state === 'waiting' && (
            <>
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
              <span className="text-sm text-amber-500">In attesa del secondo giocatore</span>
            </>
          )}
          {room.state === 'error' && (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">{room.error || 'Errore di connessione'}</span>
            </>
          )}
        </div>

        {/* Visual stepper */}
        <div className="mb-5 rounded-xl border border-zinc-800/70 bg-zinc-900/35 p-2.5 sm:p-3">
          <div className="mb-2.5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode('host')}
              disabled={room.state !== 'idle' && room.state !== 'error' && room.state !== 'disconnected' && !room.isHost}
              className={`h-9 text-xs uppercase tracking-wide ${activeMode === 'host' ? 'border-primary/70 bg-primary/15 text-primary' : 'border-zinc-700 text-zinc-400'}`}
            >
              Modalita Host
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode('guest')}
              disabled={room.isHost && room.state !== 'idle' && room.state !== 'error' && room.state !== 'disconnected'}
              className={`h-9 text-xs uppercase tracking-wide ${activeMode === 'guest' ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-300' : 'border-zinc-700 text-zinc-400'}`}
            >
              Modalita Guest
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {steps.map((step, idx) => {
              const circleClass =
                step.state === 'done'
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : step.state === 'current'
                    ? 'border-primary bg-primary/20 text-primary'
                    : step.state === 'error'
                      ? 'border-red-400 bg-red-500/20 text-red-300'
                      : 'border-zinc-700 bg-zinc-900/40 text-zinc-500';

              return (
                <div key={step.id} className="relative">
                  {idx < steps.length - 1 && (
                    <div className="pointer-events-none absolute left-[calc(50%+0.875rem)] top-3.5 h-px w-[calc(100%-1.75rem)] bg-zinc-700/70" />
                  )}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${circleClass}`}>
                      {step.state === 'done' ? <CheckCircle className="h-4 w-4" /> : step.id}
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-300 sm:text-[11px]">{step.title}</p>
                    <p className="mt-0.5 hidden text-[10px] leading-tight text-zinc-500 sm:block">{step.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Room Section */}
        {activeMode === 'host' && !room.isHost && room.state === 'idle' && (
          <div className="space-y-4">
            <Button 
              onClick={handleCreateRoom}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <Users className="h-5 w-5 mr-2" />
              Crea Stanza (Host)
            </Button>
            <p className="text-center text-xs text-zinc-500">Dopo la creazione, condividi il codice completo al Guest.</p>
          </div>
        )}

        {activeMode === 'guest' && room.state === 'idle' && (
          <div className="space-y-3">
            <label className="text-sm text-zinc-400">Incolla il codice completo di connessione host:</label>
            <div className="flex gap-2">
              <Input
                value={joinSignal}
                onChange={(e) => setJoinSignal(e.target.value)}
                placeholder="Codice lungo (non il codice stanza a 6 cifre)"
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button 
                onClick={handleJoin}
                disabled={!joinSignal.trim()}
                className="bg-zinc-700 hover:bg-zinc-600"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Waiting for guest - Show QR and code */}
        {room.isHost && room.localSignal && (
          <div className="space-y-6">
            {/* Room Code Display */}
            <div className="text-center space-y-2">
              <label className="text-sm text-zinc-400 uppercase tracking-wider">Codice Stanza (solo ID)</label>
              <div className="text-4xl font-mono font-bold text-primary tracking-widest">
                {room.roomCode}
              </div>
              <p className="text-xs text-zinc-500">Identificativo visuale: per connetterti usa il codice completo qui sotto</p>
            </div>

            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Passo 3 (Host)</p>
              <label className="text-sm text-zinc-300">Incolla qui la risposta del guest per completare la connessione:</label>
              <div className="flex gap-2">
                <Input
                  value={answerSignal}
                  onChange={(e) => setAnswerSignal(e.target.value)}
                  placeholder="Codice risposta guest (lungo)"
                  className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                />
                <Button
                  onClick={handleApplyAnswer}
                  disabled={!answerSignal.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG 
                  value={room.localSignal}
                  size={180}
                  level="L"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Full Signal Copy */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Codice completo (per copia-incolla):</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-zinc-800 rounded-lg text-[11px] text-zinc-400 font-mono whitespace-pre-wrap break-all min-h-[88px] max-h-52 overflow-y-auto">
                  {room.localSignal}
                </div>
                <Button 
                  onClick={handleCopySignal}
                  className="h-auto bg-zinc-700 hover:bg-zinc-600"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-center text-xs text-zinc-600">
              In attesa che il secondo giocatore si connetta...
            </div>
          </div>
        )}

        {/* Joining - Show answer code to copy back */}
        {!room.isHost && room.state === 'waiting' && room.localSignal && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span>Risposta generata! Inviala all&apos;Host.</span>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG 
                  value={room.localSignal}
                  size={160}
                  level="L"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Copia questo codice e invialo all&apos;Host:</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-zinc-800 rounded-lg text-[11px] text-zinc-400 font-mono whitespace-pre-wrap break-all min-h-[88px] max-h-52 overflow-y-auto">
                  {room.localSignal}
                </div>
                <Button 
                  onClick={handleCopySignal}
                  className="h-auto bg-zinc-700 hover:bg-zinc-600"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {room.state === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <Button 
              onClick={() => {
                actions.disconnect();
                setMode('host');
              }}
              variant="outline"
              className="border-zinc-700 text-zinc-400"
            >
              Riprova
            </Button>
          </div>
        )}

        {/* Network info */}
        <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-600 text-center">
          Connessione P2P diretta • Dati non passano per server
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Users, Wifi, WifiOff, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { P2PRoom as P2PRoomState, P2PActions } from '@/hooks/useP2PRoom';

interface P2PLobbyProps {
  onConnected?: () => void;
  room: P2PRoomState;
  actions: P2PActions;
}

export function P2PLobby({ onConnected, room, actions }: P2PLobbyProps) {
  const [joinSignal, setJoinSignal] = useState('');
  const [answerSignal, setAnswerSignal] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopySignal = async () => {
    if (room.localSignal) {
      await navigator.clipboard.writeText(room.localSignal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (joinSignal.trim()) {
      await actions.joinRoom(joinSignal.trim());
    }
  };

  const handleApplyAnswer = async () => {
    if (answerSignal.trim()) {
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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/60 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Partita 1v1 LAN</h2>
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

        {/* Create Room Section */}
        {!room.isHost && room.state === 'idle' && (
          <div className="space-y-4">
            <Button 
              onClick={actions.createRoom}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <Users className="h-5 w-5 mr-2" />
              Crea Stanza (Host)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900 text-zinc-500">oppure</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-zinc-400">Incolla il codice completo di connessione:</label>
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
                <div className="flex-1 p-3 bg-zinc-800 rounded-lg text-xs text-zinc-400 font-mono break-all max-h-20 overflow-y-auto">
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
                <div className="flex-1 p-3 bg-zinc-800 rounded-lg text-xs text-zinc-400 font-mono break-all max-h-20 overflow-y-auto">
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
              onClick={actions.disconnect}
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

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Peer from 'simple-peer';

type P2PState = 'idle' | 'creating' | 'waiting' | 'joining' | 'connected' | 'error' | 'disconnected';

type GameState = {
  type: 'game_state';
  player1Score: number;
  player2Score: number;
  currentRound: number;
  player1Card?: string;
  player2Card?: string;
  phase: 'betting' | 'reveal' | 'resolution';
  timestamp: number;
};

type P2PMessage = GameState | { type: 'ping'; timestamp: number } | { type: 'pong'; timestamp: number };

interface P2PRoom {
  state: P2PState;
  localSignal: string | null;
  remoteSignal: string | null;
  isHost: boolean;
  roomCode: string | null;
  peerId: string | null;
  error: string | null;
  latency: number;
}

interface P2PActions {
  createRoom: () => Promise<void>;
  joinRoom: (signal: string) => Promise<void>;
  submitAnswer: (signal: string) => Promise<void>;
  sendGameState: (state: Omit<GameState, 'type' | 'timestamp'>) => void;
  disconnect: () => void;
}

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeSignalForClipboard(signal: unknown): string {
  const json = JSON.stringify(signal);
  return toBase64Url(utf8Encoder.encode(json));
}

function isValidSignalData(value: unknown): value is Peer.SignalData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const signal = value as Record<string, unknown>;
  if (typeof signal.type !== 'string') {
    return false;
  }

  if ((signal.type === 'offer' || signal.type === 'answer') && typeof signal.sdp !== 'string') {
    return false;
  }

  return true;
}

function decodeSignalFromClipboard(signalString: string): Peer.SignalData {
  const trimmed = signalString.trim();

  // Common user mistake: entering the short 6-digit room id instead of full SDP signal.
  if (/^\d{6}$/.test(trimmed)) {
    throw new Error('Hai incollato il codice stanza (6 cifre). Serve il codice completo di connessione.');
  }

  // Accept raw JSON signals as a fallback for manual/debug flows.
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isValidSignalData(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to Base64 decode path.
    }
  }

  try {
    const json = utf8Decoder.decode(fromBase64Url(trimmed));
    const parsed = JSON.parse(json);
    if (!isValidSignalData(parsed)) {
      throw new Error('invalid signal shape');
    }
    return parsed;
  } catch {
    throw new Error('Codice di connessione non valido o corrotto. Copia e incolla nuovamente il testo completo.');
  }
}

export function useP2PRoom(onGameState?: (state: GameState) => void): [P2PRoom, P2PActions] {
  const [roomState, setRoomState] = useState<P2PRoom>({
    state: 'idle',
    localSignal: null,
    remoteSignal: null,
    isHost: false,
    roomCode: null,
    peerId: null,
    error: null,
    latency: 0,
  });

  const peerRef = useRef<Peer.Instance | null>(null);
  const dataChannelRef = useRef<any>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(0);

  // Generate 6-digit room code
  const generateRoomCode = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  // Create room (Host)
  const createRoom = useCallback(async () => {
    try {
      setRoomState(prev => ({ ...prev, state: 'creating', isHost: true }));

      const roomCode = generateRoomCode();

      const peer = new Peer({
        initiator: true,
        trickle: false,
      });

      peerRef.current = peer;

      peer.on('signal', (signal) => {
        const signalString = encodeSignalForClipboard(signal);
        setRoomState(prev => ({
          ...prev,
          state: 'waiting',
          localSignal: signalString,
          roomCode,
        }));
      });

      peer.on('connect', () => {
        setRoomState(prev => ({ ...prev, state: 'connected' }));
        
        // Start ping interval for latency measurement
        pingIntervalRef.current = setInterval(() => {
          const pingMsg: P2PMessage = { type: 'ping', timestamp: Date.now() };
          lastPingRef.current = Date.now();
          peer.send(JSON.stringify(pingMsg));
        }, 1000);
      });

      peer.on('data', (data) => {
        try {
          const message: P2PMessage = JSON.parse(data.toString());
          
          if (message.type === 'game_state' && onGameState) {
            onGameState(message);
          } else if (message.type === 'ping') {
            const pong: P2PMessage = { type: 'pong', timestamp: message.timestamp };
            peer.send(JSON.stringify(pong));
          } else if (message.type === 'pong') {
            const latency = Date.now() - message.timestamp;
            setRoomState(prev => ({ ...prev, latency }));
          }
        } catch (e) {
          console.error('Failed to parse P2P message:', e);
        }
      });

      peer.on('error', (err) => {
        setRoomState(prev => ({ ...prev, state: 'error', error: err.message }));
      });

      peer.on('close', () => {
        setRoomState(prev => ({ ...prev, state: 'disconnected' }));
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      });

    } catch (err: any) {
      setRoomState(prev => ({ ...prev, state: 'error', error: err.message }));
    }
  }, [generateRoomCode, onGameState]);

  // Join room (Guest)
  const joinRoom = useCallback(async (signalString: string) => {
    try {
      setRoomState(prev => ({ ...prev, state: 'joining', isHost: false }));

      const offer = decodeSignalFromClipboard(signalString);

      const peer = new Peer({
        initiator: false,
        trickle: false,
      });

      peerRef.current = peer;

      peer.on('signal', (signal) => {
        const answerString = encodeSignalForClipboard(signal);
        setRoomState(prev => ({
          ...prev,
          state: 'waiting',
          localSignal: answerString,
        }));
      });

      peer.on('connect', () => {
        setRoomState(prev => ({ ...prev, state: 'connected' }));

        // Start ping interval for latency measurement
        pingIntervalRef.current = setInterval(() => {
          const pingMsg: P2PMessage = { type: 'ping', timestamp: Date.now() };
          lastPingRef.current = Date.now();
          peer.send(JSON.stringify(pingMsg));
        }, 1000);
      });

      peer.on('data', (data) => {
        try {
          const message: P2PMessage = JSON.parse(data.toString());
          
          if (message.type === 'game_state' && onGameState) {
            onGameState(message);
          } else if (message.type === 'ping') {
            const pong: P2PMessage = { type: 'pong', timestamp: message.timestamp };
            peer.send(JSON.stringify(pong));
          } else if (message.type === 'pong') {
            const latency = Date.now() - message.timestamp;
            setRoomState(prev => ({ ...prev, latency }));
          }
        } catch (e) {
          console.error('Failed to parse P2P message:', e);
        }
      });

      peer.on('error', (err) => {
        setRoomState(prev => ({ ...prev, state: 'error', error: err.message }));
      });

      peer.on('close', () => {
        setRoomState(prev => ({ ...prev, state: 'disconnected' }));
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      });

      peer.signal(offer);

    } catch (err: any) {
      setRoomState(prev => ({ ...prev, state: 'error', error: err.message }));
    }
  }, [onGameState]);

  const submitAnswer = useCallback(async (signalString: string) => {
    try {
      if (!peerRef.current) {
        throw new Error('Nessuna stanza host attiva. Crea prima una stanza.');
      }

      if (!roomState.isHost) {
        throw new Error('Solo l\'host puo\' applicare il codice risposta del guest.');
      }

      const answer = decodeSignalFromClipboard(signalString);
      peerRef.current.signal(answer);
      setRoomState(prev => ({
        ...prev,
        remoteSignal: signalString.trim(),
      }));
    } catch (err: any) {
      setRoomState(prev => ({ ...prev, state: 'error', error: err.message }));
    }
  }, [roomState.isHost]);

  // Send game state
  const sendGameState = useCallback((state: Omit<GameState, 'type' | 'timestamp'>) => {
    if (peerRef.current && roomState.state === 'connected') {
      const message: GameState = {
        ...state,
        type: 'game_state',
        timestamp: Date.now(),
      };
      peerRef.current.send(JSON.stringify(message));
    }
  }, [roomState.state]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setRoomState({
      state: 'idle',
      localSignal: null,
      remoteSignal: null,
      isHost: false,
      roomCode: null,
      peerId: null,
      error: null,
      latency: 0,
    });
  }, []);

  return [
    roomState,
    {
      createRoom,
      joinRoom,
      submitAnswer,
      sendGameState,
      disconnect,
    },
  ];
}

export type { P2PRoom, P2PActions, GameState, P2PState };

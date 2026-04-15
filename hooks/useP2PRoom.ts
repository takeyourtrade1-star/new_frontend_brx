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
  sendGameState: (state: Omit<GameState, 'type' | 'timestamp'>) => void;
  disconnect: () => void;
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
        // MDN official solution: TextEncoder + String.fromCodePoint for proper UTF-8
        const jsonStr = JSON.stringify(signal);
        const bytes = new TextEncoder().encode(jsonStr);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
        const signalString = btoa(binString);
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

      // MDN official solution: TextDecoder + codePointAt for proper UTF-8
      const binString = atob(signalString);
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0) ?? 0);
      const offer = JSON.parse(new TextDecoder().decode(bytes));

      const peer = new Peer({
        initiator: false,
        trickle: false,
      });

      peerRef.current = peer;

      peer.on('signal', (signal) => {
        // MDN official solution: TextEncoder + String.fromCodePoint for proper UTF-8
        const jsonStr = JSON.stringify(signal);
        const bytes = new TextEncoder().encode(jsonStr);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
        const answerString = btoa(binString);
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
      sendGameState,
      disconnect,
    },
  ];
}

export type { P2PRoom, P2PActions, GameState, P2PState };

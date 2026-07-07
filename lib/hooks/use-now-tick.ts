import { useEffect, useState } from 'react';
import { calibrateServerClock, serverNowMs } from '@/lib/server-clock';

/**
 * Ticking "now" timestamp (intervallo configurabile, default 1s) per countdown live.
 * Usa l'ora sincronizzata col server: un orologio del dispositivo sballato di
 * minuti non falsa più i countdown (vedi lib/server-clock.ts).
 */
export function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => serverNowMs());
  useEffect(() => {
    calibrateServerClock();
    const id = setInterval(() => setNow(serverNowMs()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

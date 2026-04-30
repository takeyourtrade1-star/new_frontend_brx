/**
 * Generic countdown hook for OTP/token expiration UX.
 *
 * @param targetMs - target timestamp in milliseconds, or null to stop
 * @returns { formatted: "mm:ss", isExpired: boolean, secondsLeft: number }
 */
'use client';

import { useState, useEffect, useMemo } from 'react';

export function useCountdown(targetMs: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetMs) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  const secondsLeft = useMemo(() => {
    if (!targetMs) return 0;
    return Math.max(0, Math.ceil((targetMs - now) / 1000));
  }, [targetMs, now]);

  const isExpired = targetMs !== null && secondsLeft <= 0;

  const formatted = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  return { formatted, isExpired, secondsLeft };
}

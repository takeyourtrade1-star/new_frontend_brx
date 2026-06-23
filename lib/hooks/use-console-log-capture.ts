'use client';

import { useEffect, useState } from 'react';
import { startConsoleCapture, stopConsoleCapture } from '@/lib/dev/log-capture';

export function useConsoleLogCapture(isActive: boolean) {
  const [hasConsoleLogs, setHasConsoleLogs] = useState(false);
  const [showConsoleLogs, setShowConsoleLogs] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    startConsoleCapture({ reset: true });
    return () => {
      stopConsoleCapture();
    };
  }, [isActive]);

  return {
    hasConsoleLogs,
    setHasConsoleLogs,
    showConsoleLogs,
    setShowConsoleLogs,
  };
}

'use client';

import { useState, useEffect } from 'react';

interface UseIsIOSReturn {
  isIOS: boolean;
  isStandalone: boolean;
  isLoading: boolean;
}

export function useIsIOS(): UseIsIOSReturn {
  const [state, setState] = useState<UseIsIOSReturn>({
    isIOS: false,
    isStandalone: false,
    isLoading: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setState({ isIOS: false, isStandalone: false, isLoading: false });
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    const isIPad = /ipad/.test(userAgent);
    const isIPod = /ipod/.test(userAgent);
    const isMac = /macintosh|mac os x/.test(userAgent);

    // iPad con iPadOS 13+ usa desktop UA, quindi controlliamo touch + mac
    const isModernIPad = isMac && navigator.maxTouchPoints > 1;

    const isIOSDevice = isIPhone || isIPad || isIPod || isModernIPad;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setState({
      isIOS: isIOSDevice && !isStandaloneMode,
      isStandalone: isStandaloneMode,
      isLoading: false,
    });
  }, []);

  return state;
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { startProactiveRefresh } from '@/lib/api/refresh-token';
import { GameProvider, GameFromRouteSync } from '@/lib/contexts/GameContext';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { HtmlLangSync } from '@/components/HtmlLangSync';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasInitialized = useRef(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    // Inizializza l'autenticazione solo una volta all'avvio (client-side only)
    if (!hasInitialized.current && typeof window !== 'undefined') {
      hasInitialized.current = true;
      try {
        // Accediamo direttamente allo store per evitare problemi di serializzazione
        const store = useAuthStore.getState();
        if (store && typeof store.initializeAuth === 'function') {
          store.initializeAuth().then(() => {
            startProactiveRefresh();
          }).catch((err) => {
            console.error('Error initializing auth:', err);
            setInitError(err);
            // Non blocchiamo l'UI per errori di auth
          });
        }
      } catch (err) {
        console.error('Error accessing auth store:', err);
        setInitError(err as Error);
        // Non blocchiamo l'UI per errori di accesso allo store
      }
    }
  }, []);

  // Non bloccare il rendering se c'è un errore di inizializzazione
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            // Le query con polling non martellano il BFF quando il tab è in background.
            refetchIntervalInBackground: false,
          },
          mutations: {
            onError: (err) => console.error('[mutation]', err),
          },
        },
      })
  );

  return (
    // reducedMotion="user": tutti i componenti framer-motion rispettano
    // automaticamente prefers-reduced-motion (niente HOC per-file).
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthInitializer>
            <LanguageProvider>
              <HtmlLangSync />
              <GameProvider>
                <GameFromRouteSync />
                {children}
              </GameProvider>
            </LanguageProvider>
          </AuthInitializer>
        </ThemeProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

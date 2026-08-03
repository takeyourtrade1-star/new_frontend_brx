'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { purgeLegacyAuthStorage } from '@/lib/auth/legacy-token-storage';
import { purgePrivateBrowserState } from '@/lib/auth/private-browser-state';
import { principalTransitionRequiresPurge } from '@/lib/auth/principal-isolation';
import { GameProvider, GameFromRouteSync } from '@/lib/contexts/GameContext';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { HtmlLangSync } from '@/components/HtmlLangSync';

// Run during client bundle evaluation, before React effects and /me bootstrap.
purgeLegacyAuthStorage();

function AccountIsolationGuard({ queryClient }: { queryClient: QueryClient }) {
  const principal = useAuthStore((state) =>
    state.isAuthenticated && state.user?.id ? state.user.id : null,
  );
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const previous = useRef<{ principal: string | null; expired: boolean } | null>(null);

  // Layout phase prevents a stale account cache from being painted after a
  // logout/401/principal switch. The first mount starts with a fresh client.
  useLayoutEffect(() => {
    const prior = previous.current;
    if (
      prior &&
      principalTransitionRequiresPurge(
        prior.principal,
        principal,
        prior.expired,
        sessionExpired,
      )
    ) {
      queryClient.clear();
      purgePrivateBrowserState();
    }
    previous.current = { principal, expired: sessionExpired };
  }, [principal, queryClient, sessionExpired]);

  return null;
}

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
          store.initializeAuth().catch((err) => {
            console.error('[auth] initialization failed');
            setInitError(err);
            // Non blocchiamo l'UI per errori di auth
          });
        }
      } catch (err) {
        console.error('[auth] store access failed');
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
            onError: () => console.error('[mutation] request failed'),
          },
        },
      })
  );

  return (
    // reducedMotion="user": tutti i componenti framer-motion rispettano
    // automaticamente prefers-reduced-motion (niente HOC per-file).
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AccountIsolationGuard queryClient={queryClient} />
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

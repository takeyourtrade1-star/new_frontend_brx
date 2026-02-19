'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { GameProvider } from '@/lib/contexts/GameContext';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Inizializza l'autenticazione solo una volta all'avvio (client-side only)
    if (!hasInitialized.current && typeof window !== 'undefined') {
      hasInitialized.current = true;
      try {
        // Accediamo direttamente allo store per evitare problemi di serializzazione
        const store = useAuthStore.getState();
        if (store && typeof store.initializeAuth === 'function') {
          store.initializeAuth().catch((err) => {
            console.error('Error initializing auth:', err);
          });
        }
      } catch (err) {
        console.error('Error accessing auth store:', err);
      }
    }
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GameProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </GameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { GameProvider, GameFromRouteSync } from '@/lib/contexts/GameContext';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { HtmlLangSync } from '@/components/HtmlLangSync';

// Error Boundary for Auth-related errors
class AuthErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AuthErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render children anyway - don't block the UI for auth errors
      console.warn('[AuthErrorBoundary] Rendering children despite auth error');
      return this.props.children;
    }
    return this.props.children;
  }
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
          },
        },
      })
  );

  return (
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
  );
}

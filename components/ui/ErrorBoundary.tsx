'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { MissingPage } from '@/components/shared/MissingPage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary per sezioni dell'app (aste, search, product detail, ecc.).
 * Cattura errori di rendering nei figli e mostra un fallback grazioso.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Error objects and React component stacks may include request payloads or
    // user-provided props. Keep browser/telemetry logs free of that data.
    console.error('[ErrorBoundary] render failed');
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div role="alert" aria-live="assertive">
          <MissingPage
            className="min-h-[40vh] rounded-2xl border border-red-100 bg-red-50/50 py-8 dark:bg-red-950/20"
            title="Qualcosa è andato storto"
            description="Si è verificato un errore imprevisto. Prova a ricaricare la pagina o torna più tardi."
            actions={
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Riprova
              </button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

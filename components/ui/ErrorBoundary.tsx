'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
 * Cattura errori di rendering nei figli e mostra un fallback gracioso.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
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
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-global-bg-end">
            Qualcosa è andato storto
          </h2>
          <p className="max-w-sm text-sm text-gray-600">
            Si è verificato un errore imprevisto. Prova a ricaricare la pagina o torna più tardi.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

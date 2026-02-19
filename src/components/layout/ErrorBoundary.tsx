import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

interface State {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);

    // Auto-reload on stale chunk errors (e.g. after a new deployment)
    if (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    ) {
      window.location.reload();
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-lowest">
          <h1 className="text-2xl font-bold font-display text-primary">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Please try refreshing the page.
          </p>
          {this.state.error && (
            <div className="mt-4 w-full max-w-lg rounded-lg bg-error-container p-4">
              <p className="text-sm font-medium text-on-error-container">
                {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-on-error-container/80">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="state-layer touch-target mt-4 rounded-md bg-tertiary px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-tertiary/85"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

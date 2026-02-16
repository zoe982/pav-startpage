import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

interface State {
  readonly hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white">
          <h1 className="text-2xl font-bold text-pav-blue">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-pav-grey/60">
            Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
            }}
            className="mt-4 rounded-md bg-pav-terra px-4 py-2 text-sm font-medium text-white transition hover:bg-pav-terra-hover"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

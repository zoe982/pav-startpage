import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../../../src/components/layout/ErrorBoundary.tsx';

function GoodChild() {
  return <div>working</div>;
}

function BadChild(): never {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('working')).toBeInTheDocument();
  });

  it('renders error state when child throws', () => {
    render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Please try refreshing the page.')).toBeInTheDocument();
  });

  it('reloads the page when Try again is clicked', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Try again'));

    expect(reloadMock).toHaveBeenCalledOnce();
  });

  it('auto-reloads on stale chunk errors', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    function StaleChunkChild(): never {
      throw new Error(
        'Failed to fetch dynamically imported module: https://example.com/assets/Foo-abc123.js',
      );
    }

    render(
      <ErrorBoundary>
        <StaleChunkChild />
      </ErrorBoundary>,
    );

    expect(reloadMock).toHaveBeenCalledOnce();
  });
});

import type { JSX } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';

export function NotFoundPage(): JSX.Element {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-6xl font-bold text-pav-tan">404</h1>
        <p className="mt-4 text-lg text-on-surface-variant">Page not found</p>
        <Link
          to="/"
          className="state-layer touch-target mt-6 rounded-md bg-pav-terra px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-pav-terra-hover"
        >
          Go home
        </Link>
      </div>
    </AppShell>
  );
}

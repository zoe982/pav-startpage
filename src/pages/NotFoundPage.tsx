import type { JSX } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';

export function NotFoundPage(): JSX.Element {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <Link
          to="/"
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Go home
        </Link>
      </div>
    </AppShell>
  );
}

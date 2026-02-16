import type { JSX, ReactNode } from 'react';
import { Header } from './Header.tsx';

export function AppShell({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container-low">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

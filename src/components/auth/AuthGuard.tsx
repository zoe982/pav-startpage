import type { JSX } from 'react';
import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';

export function AuthGuard({ children }: { readonly children: ReactNode }): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

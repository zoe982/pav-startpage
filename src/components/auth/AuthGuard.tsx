import type { JSX } from 'react';
import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';

export function AuthGuard({ children }: { readonly children: ReactNode }): JSX.Element {
  const { isAuthenticated, isLoading, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pav-blue border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white gap-4">
          <div className="rounded-lg bg-red-50 p-4 max-w-md">
            <p className="text-sm font-medium text-red-800">{authError}</p>
          </div>
          <a href="/login" className="text-sm text-pav-blue hover:underline">Go to login</a>
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import type { JSX } from 'react';
import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';

export function AdminGuard({ children }: { readonly children: ReactNode }): JSX.Element {
  const { user, isAuthenticated, isLoading, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-lowest gap-4">
          <div className="rounded-lg bg-error-container p-4 max-w-md">
            <p className="text-sm font-medium text-on-error-container">{authError}</p>
          </div>
          <a href="/login" className="state-layer touch-target inline-flex items-center rounded-md px-3 py-2 text-sm text-primary hover:underline">Go to login</a>
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-lowest gap-2">
        <h1 className="text-xl font-bold text-primary">Access Denied</h1>
        <p className="text-sm text-on-surface-variant">
          Your account ({user?.email}) does not have admin access.
        </p>
        <a href="/" className="state-layer touch-target inline-flex items-center mt-2 rounded-md px-3 py-2 text-sm text-primary hover:underline">Back to home</a>
      </div>
    );
  }

  return <>{children}</>;
}

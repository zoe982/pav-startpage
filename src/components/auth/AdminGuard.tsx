import type { JSX } from 'react';
import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';

export function AdminGuard({ children }: { readonly children: ReactNode }): JSX.Element {
  const { user, isAuthenticated, isLoading, authError } = useAuth();

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

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white gap-2">
        <h1 className="text-xl font-bold text-pav-blue">Access Denied</h1>
        <p className="text-sm text-pav-grey/60">
          Your account ({user?.email}) does not have admin access.
        </p>
        <a href="/" className="mt-2 text-sm text-pav-blue hover:underline">Back to home</a>
      </div>
    );
  }

  return <>{children}</>;
}

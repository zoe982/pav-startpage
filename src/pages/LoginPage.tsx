import type { JSX } from 'react';
import { Navigate } from 'react-router';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton.tsx';
import { useAuth } from '../hooks/useAuth.ts';

export function LoginPage(): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pav-blue border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-pav-tan/30 bg-white p-8 shadow-lg">
        <div className="text-center">
          <img
            src="/pav-wordmark-horizontal.png"
            alt="Pet Air Valet"
            className="mx-auto h-16"
          />
          <p className="mt-4 text-sm text-pav-grey/60">
            Sign in with your PetAirValet Google account
          </p>
        </div>
        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}

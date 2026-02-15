import type { JSX } from 'react';
import { Navigate } from 'react-router';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton.tsx';
import { useAuth } from '../hooks/useAuth.ts';

export function LoginPage(): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PavInfo Start</h1>
          <p className="mt-2 text-sm text-gray-600">
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

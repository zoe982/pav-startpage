import type { JSX } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton.tsx';
import { useAuth } from '../hooks/useAuth.ts';

const ERROR_MESSAGES: Record<string, string> = {
  no_code: 'Google did not return an authorization code.',
  token_exchange: 'Failed to exchange token with Google.',
  invalid_token: 'Received an invalid token from Google.',
  unauthorized_domain: 'Your email domain is not authorized. Contact an admin.',
  unverified_email: 'Your Google email is not verified.',
  db_error: 'Database error during login. Try again or contact an admin.',
};

export function LoginPage(): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error');

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
        {errorCode && (
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-sm text-red-700">
              {ERROR_MESSAGES[errorCode] ?? `Login failed (${errorCode})`}
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}

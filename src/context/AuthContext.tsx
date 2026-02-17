import type { JSX } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth.ts';
import { fetchCurrentUser, logout as apiLogout } from '../api/auth.ts';
import { ApiError } from '../api/client.ts';

export interface AuthContextValue {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly authError: string | null;
  readonly logout: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Expected when not logged in
        setUser(null);
      } else if (error instanceof ApiError) {
        setAuthError(`Auth check failed: ${error.message} (HTTP ${error.status})`);
      } else {
        setAuthError(`Auth check failed: ${error instanceof Error ? error.message : 'Network error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      authError,
      logout,
      refreshUser,
    }),
    [user, isLoading, authError, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

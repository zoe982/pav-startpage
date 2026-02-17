import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../../src/context/AuthContext.tsx';
import { useContext } from 'react';
import { ApiError } from '../../src/api/client.ts';

vi.mock('../../src/api/auth.ts', () => ({
  fetchCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

import { fetchCurrentUser, logout as apiLogout } from '../../src/api/auth.ts';

function TestConsumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="user">{ctx.user?.name ?? 'none'}</span>
      <button onClick={ctx.logout}>logout</button>
      <button onClick={ctx.refreshUser}>refresh</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentUser).mockReset();
    vi.mocked(apiLogout).mockReset();
  });

  it('calls fetchCurrentUser on mount and sets user', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', pictureUrl: null, isAdmin: false, isInternal: false, appGrants: [] };
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('sets user to null on 401 ApiError', async () => {
    vi.mocked(fetchCurrentUser).mockRejectedValue(new ApiError(401, 'Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('does not clear user on non-401 error', async () => {
    // First call succeeds, then we'll trigger a refresh that fails with non-401
    const user = { id: '1', email: 'test@test.com', name: 'Test', pictureUrl: null, isAdmin: false, isInternal: false, appGrants: [] };
    vi.mocked(fetchCurrentUser).mockResolvedValueOnce(user);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test');
    });

    // Now mock a non-401 error and refresh
    vi.mocked(fetchCurrentUser).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      screen.getByText('refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    // User should still be set (non-401 doesn't clear it)
    expect(screen.getByTestId('user')).toHaveTextContent('Test');
  });

  it('calls apiLogout and clears user on logout', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', pictureUrl: null, isAdmin: false, isInternal: false, appGrants: [] };
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(apiLogout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test');
    });

    await act(async () => {
      screen.getByText('logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
    expect(apiLogout).toHaveBeenCalled();
  });
});

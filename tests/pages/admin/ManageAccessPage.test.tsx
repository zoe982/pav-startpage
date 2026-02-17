import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageAccessPage } from '../../../src/pages/admin/ManageAccessPage.tsx';
import { renderWithProviders, mockAdminUser } from '../../helpers.tsx';

vi.mock('../../../src/api/guests.ts', () => ({
  fetchGuests: vi.fn(),
  addGuest: vi.fn(),
  removeGrant: vi.fn(),
}));

vi.mock('../../../src/api/users.ts', () => ({
  fetchUsers: vi.fn(),
  updateAdminStatus: vi.fn(),
}));

import { fetchGuests, addGuest, removeGrant } from '../../../src/api/guests.ts';
import { fetchUsers, updateAdminStatus } from '../../../src/api/users.ts';

describe('ManageAccessPage', () => {
  const addToast = vi.fn();

  beforeEach(() => {
    vi.mocked(fetchGuests).mockReset();
    vi.mocked(addGuest).mockReset();
    vi.mocked(removeGrant).mockReset();
    vi.mocked(fetchUsers).mockReset();
    vi.mocked(updateAdminStatus).mockReset();
    addToast.mockReset();
  });

  function renderPage(): void {
    renderWithProviders(<ManageAccessPage />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      toast: { addToast },
      route: '/admin/access',
    });
  }

  it('shows loading skeleton while guests/users load', () => {
    vi.mocked(fetchGuests).mockReturnValue(new Promise(() => {}));
    vi.mocked(fetchUsers).mockReturnValue(new Promise(() => {}));

    const { container } = renderWithProviders(<ManageAccessPage />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      toast: { addToast },
      route: '/admin/access',
    });

    expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
  });

  it('shows load errors for guests and users', async () => {
    vi.mocked(fetchGuests).mockRejectedValue(new Error('guest load failed'));
    vi.mocked(fetchUsers).mockRejectedValue(new Error('user load failed'));

    renderPage();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to load guest grants', 'error');
    });
    expect(addToast).toHaveBeenCalledWith('Failed to load users', 'error');
  });

  it('adds a guest with selected apps and resets form', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'grant-1',
          email: 'guest@example.com',
          appKey: 'templates',
          grantedBy: 'admin-1',
          grantedByName: 'Admin',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    vi.mocked(fetchUsers).mockResolvedValue([]);
    vi.mocked(addGuest).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Guest' })).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('guest@example.com'), '  guest@example.com  ');
    await user.click(screen.getByTestId('app-option-wiki'));
    await user.click(screen.getByTestId('app-option-wiki'));
    await user.click(screen.getByTestId('app-option-templates'));
    await user.click(screen.getByTestId('add-guest-submit'));

    await waitFor(() => {
      expect(addGuest).toHaveBeenCalledWith('guest@example.com', ['templates']);
    });
    expect(addToast).toHaveBeenCalledWith('Guest added', 'success');
    expect(screen.getByPlaceholderText('guest@example.com')).toHaveValue('');
  });

  it('exits early when add guest is triggered with invalid form state', async () => {
    vi.mocked(fetchGuests).mockResolvedValue([]);
    vi.mocked(fetchUsers).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Guest' })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: 'Add Guest' }) as HTMLButtonElement;
    const reactPropsKey = Object.keys(addButton).find((key) => key.startsWith('__reactProps$'));
    if (!reactPropsKey) {
      throw new Error('Unable to access React props for add button');
    }

    const reactProps = (addButton as unknown as Record<string, { onClick?: () => void }>)[reactPropsKey];
    reactProps.onClick?.();

    expect(addGuest).not.toHaveBeenCalled();
  });

  it('shows specific error when add guest throws an Error instance', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests).mockResolvedValue([]);
    vi.mocked(fetchUsers).mockResolvedValue([]);
    vi.mocked(addGuest).mockRejectedValue(new Error('Duplicate guest'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Guest' })).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('guest@example.com'), 'guest@example.com');
    await user.click(screen.getByTestId('app-option-wiki'));
    await user.click(screen.getByTestId('add-guest-submit'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Duplicate guest', 'error');
    });
  });

  it('shows fallback error when add guest throws non-Error value', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests).mockResolvedValue([]);
    vi.mocked(fetchUsers).mockResolvedValue([]);
    vi.mocked(addGuest).mockRejectedValue('bad');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Guest' })).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('guest@example.com'), 'guest@example.com');
    await user.click(screen.getByTestId('app-option-wiki'));
    await user.click(screen.getByTestId('add-guest-submit'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to add guest', 'error');
    });
  });

  it('renders grouped guest grants and removes a grant successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests)
      .mockResolvedValueOnce([
        {
          id: 'grant-1',
          email: 'guest@example.com',
          appKey: 'wiki',
          grantedBy: 'admin-1',
          grantedByName: 'Admin',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'grant-2',
          email: 'guest@example.com',
          appKey: 'custom-app',
          grantedBy: 'admin-1',
          grantedByName: 'Admin',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(fetchUsers).mockResolvedValue([]);
    vi.mocked(removeGrant).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    });
    expect(screen.getByText('custom-app')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove custom-app access' }));

    await waitFor(() => {
      expect(removeGrant).toHaveBeenCalledWith('grant-2');
    });
    expect(addToast).toHaveBeenCalledWith('Grant removed', 'success');
  });

  it('shows error toast when removing a grant fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests).mockResolvedValue([
      {
        id: 'grant-1',
        email: 'guest@example.com',
        appKey: 'wiki',
        grantedBy: 'admin-1',
        grantedByName: 'Admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(fetchUsers).mockResolvedValue([]);
    vi.mocked(removeGrant).mockRejectedValue(new Error('remove failed'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove wiki access' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Remove wiki access' }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to remove grant', 'error');
    });
  });

  it('shows empty states for guests and admins tabs', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests).mockResolvedValue([]);
    vi.mocked(fetchUsers).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No guest access grants yet.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Admins' }));
    expect(screen.getByText('No users found.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guest Access' }));
    expect(screen.getByText('No guest access grants yet.')).toBeInTheDocument();
  });

  it('renders admin users and toggles admin status in both directions', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests).mockResolvedValue([]);
    vi.mocked(fetchUsers).mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'Alice',
        pictureUrl: 'https://example.com/alice.png',
        isAdmin: false,
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'Bob',
        pictureUrl: null,
        isAdmin: true,
      },
    ]);
    vi.mocked(updateAdminStatus).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Admins' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Admins' }));

    expect(document.querySelector('img[src="https://example.com/alice.png"]')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    await user.click(screen.getByTestId('admin-toggle-user-1'));
    await waitFor(() => {
      expect(updateAdminStatus).toHaveBeenCalledWith('user-1', true);
    });
    expect(addToast).toHaveBeenCalledWith('Admin status granted', 'success');

    await user.click(screen.getByTestId('admin-toggle-user-2'));
    await waitFor(() => {
      expect(updateAdminStatus).toHaveBeenCalledWith('user-2', false);
    });
    expect(addToast).toHaveBeenCalledWith('Admin status removed', 'success');
  });

  it('shows error toast when toggling admin fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGuests).mockResolvedValue([]);
    vi.mocked(fetchUsers).mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'Alice',
        pictureUrl: null,
        isAdmin: false,
      },
    ]);
    vi.mocked(updateAdminStatus).mockRejectedValue(new Error('toggle failed'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Admins' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Admins' }));
    await user.click(screen.getByTestId('admin-toggle-user-1'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to update admin status', 'error');
    });
  });
});

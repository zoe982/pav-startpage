import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App.tsx';

// Mock the auth API to control authentication state
vi.mock('../src/api/auth.ts', () => ({
  fetchCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

// Mock lazy-loaded admin pages - named exports that the lazy().then() re-exports
vi.mock('../src/pages/admin/AdminDashboard.tsx', () => ({
  AdminDashboard: () => <div>AdminDashboard</div>,
}));
vi.mock('../src/pages/admin/ManageLinksPage.tsx', () => ({
  ManageLinksPage: () => <div>ManageLinksPage</div>,
}));
vi.mock('../src/pages/admin/ManageWikiPage.tsx', () => ({
  ManageWikiPage: () => <div>ManageWikiPage</div>,
}));
vi.mock('../src/pages/admin/EditWikiPage.tsx', () => ({
  EditWikiPage: () => <div>EditWikiPage</div>,
}));

// Mock heavy components
vi.mock('../src/hooks/useLinks.ts', () => ({
  useLinks: vi.fn().mockReturnValue({
    links: [],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../src/api/wiki.ts', () => ({
  fetchWikiPages: vi.fn().mockResolvedValue([]),
  fetchWikiPage: vi.fn().mockResolvedValue({ id: '1', slug: 'test', title: 'Test', content: '# Test', isPublished: true, showOnStart: false, sortOrder: 0 }),
}));

vi.mock('../src/hooks/useWiki.ts', () => ({
  useWikiPages: vi.fn().mockReturnValue({
    pages: [],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
  useWikiPage: vi.fn().mockReturnValue({
    page: null,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../src/components/wiki/MarkdownEditor.tsx', () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="md-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import { fetchCurrentUser } from '../src/api/auth.ts';
import { ApiError } from '../src/api/client.ts';

describe('App', () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentUser).mockReset();
  });

  it('renders login page at /login when not authenticated', async () => {
    vi.mocked(fetchCurrentUser).mockRejectedValue(new ApiError(401, 'Unauthorized'));
    window.history.pushState({}, '', '/login');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByAltText('Pet Air Valet')).toBeInTheDocument();
    });
  });

  it('renders start page at / when authenticated', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '1', email: 'test@petairvalet.com', name: 'Test', pictureUrl: null, isAdmin: false, isInternal: true, appGrants: [],
    });
    window.history.pushState({}, '', '/');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });
  });

  it('renders 404 page for unknown routes', async () => {
    vi.mocked(fetchCurrentUser).mockRejectedValue(new ApiError(401, 'Unauthorized'));
    window.history.pushState({}, '', '/nonexistent');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users from / to /login', async () => {
    vi.mocked(fetchCurrentUser).mockRejectedValue(new ApiError(401, 'Unauthorized'));
    window.history.pushState({}, '', '/');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByAltText('Pet Air Valet')).toBeInTheDocument();
    });
  });

  it('renders admin dashboard at /admin for admin users', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '1', email: 'admin@petairvalet.com', name: 'Admin', pictureUrl: null, isAdmin: true, isInternal: true, appGrants: [],
    });
    window.history.pushState({}, '', '/admin');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('AdminDashboard')).toBeInTheDocument();
    });
  });

  it('renders manage links page at /admin/links', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '1', email: 'admin@petairvalet.com', name: 'Admin', pictureUrl: null, isAdmin: true, isInternal: true, appGrants: [],
    });
    window.history.pushState({}, '', '/admin/links');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('ManageLinksPage')).toBeInTheDocument();
    });
  });

  it('renders manage wiki page at /admin/wiki', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '1', email: 'admin@petairvalet.com', name: 'Admin', pictureUrl: null, isAdmin: true, isInternal: true, appGrants: [],
    });
    window.history.pushState({}, '', '/admin/wiki');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('ManageWikiPage')).toBeInTheDocument();
    });
  });

  it('renders new wiki page at /admin/wiki/new', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '1', email: 'admin@petairvalet.com', name: 'Admin', pictureUrl: null, isAdmin: true, isInternal: true, appGrants: [],
    });
    window.history.pushState({}, '', '/admin/wiki/new');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('EditWikiPage')).toBeInTheDocument();
    });
  });

  it('renders edit wiki page at /admin/wiki/:slug/edit', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '1', email: 'admin@petairvalet.com', name: 'Admin', pictureUrl: null, isAdmin: true, isInternal: true, appGrants: [],
    });
    window.history.pushState({}, '', '/admin/wiki/test/edit');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('EditWikiPage')).toBeInTheDocument();
    });
  });
});

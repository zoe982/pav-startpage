import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { AuthContext } from '../src/context/AuthContext.tsx';
import type { AuthContextValue } from '../src/context/AuthContext.tsx';
import { ToastContext } from '../src/context/ToastContext.tsx';
import type { ToastContextValue } from '../src/context/ToastContext.tsx';
import type { User } from '../src/types/auth.ts';
import type { Link } from '../src/types/link.ts';
import type { WikiPage, WikiPageSummary } from '../src/types/wiki.ts';

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@petairvalet.com',
    name: 'Test User',
    pictureUrl: null,
    isAdmin: false,
    isInternal: true,
    appGrants: [],
    ...overrides,
  };
}

export function mockAdminUser(overrides: Partial<User> = {}): User {
  return mockUser({ isAdmin: true, name: 'Admin User', ...overrides });
}

export function mockLink(overrides: Partial<Link> = {}): Link {
  return {
    id: 'link-1',
    title: 'Test Link',
    url: 'https://example.com',
    description: null,
    iconUrl: null,
    sortOrder: 0,
    isVisible: true,
    ...overrides,
  };
}

export function mockWikiPage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    id: 'wiki-1',
    slug: 'test-page',
    title: 'Test Page',
    content: '# Test Content',
    isPublished: true,
    showOnStart: false,
    sortOrder: 0,
    ...overrides,
  };
}

export function mockWikiPageSummary(
  overrides: Partial<WikiPageSummary> = {},
): WikiPageSummary {
  return {
    id: 'wiki-1',
    slug: 'test-page',
    title: 'Test Page',
    isPublished: true,
    showOnStart: false,
    sortOrder: 0,
    ...overrides,
  };
}

export const defaultAuthValue: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

export const defaultToastValue: ToastContextValue = {
  toasts: [],
  addToast: vi.fn(),
  removeToast: vi.fn(),
};

interface ProviderOptions {
  auth?: Partial<AuthContextValue>;
  toast?: Partial<ToastContextValue>;
  route?: string;
}

export function renderWithProviders(
  ui: ReactNode,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult {
  const { auth, toast, route, ...renderOptions } = options;

  if (route) {
    window.history.pushState({}, '', route);
  }

  const authValue: AuthContextValue = { ...defaultAuthValue, ...auth };
  const toastValue: ToastContextValue = { ...defaultToastValue, ...toast };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <ToastContext.Provider value={toastValue}>
            {children}
          </ToastContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

import type { JSX } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';

export function Header(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-gray-900">
            PavInfo
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-6 sm:flex">
              <Link
                to="/"
                className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              >
                Home
              </Link>
              <Link
                to="/wiki"
                className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
              >
                Wiki
              </Link>
              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.pictureUrl && (
                <img
                  src={user.pictureUrl}
                  alt=""
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden text-sm text-gray-700 sm:block">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

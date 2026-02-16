import type { JSX } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';

export function Header(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-pav-tan/30 bg-pav-cream">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 text-pav-blue">
            <img src="/pav_logo_clean_flat_2048.webp" alt="" className="h-10 w-10" />
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-lg font-bold">Pet Air Valet</span>
              <span className="font-serif text-xs italic text-pav-grey/60">Fly Together, In-Cabin</span>
            </div>
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-6 sm:flex">
              <Link
                to="/"
                className="text-sm font-medium text-pav-grey transition hover:text-pav-blue"
              >
                Home
              </Link>
              <Link
                to="/wiki"
                className="text-sm font-medium text-pav-grey transition hover:text-pav-blue"
              >
                Wiki
              </Link>
              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-pav-terra transition hover:text-pav-terra-hover"
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
              <span className="hidden text-sm text-pav-grey sm:block">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-md px-3 py-1.5 text-sm text-pav-grey/70 transition hover:bg-pav-tan/20 hover:text-pav-blue"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

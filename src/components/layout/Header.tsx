import type { JSX } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';
import { useAppAccess } from '../../hooks/useAppAccess.ts';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.ts';
import { M3FilledTonalButton, M3TextButton } from '../m3/material.tsx';

function UserAvatar({ name, pictureUrl }: { readonly name: string; readonly pictureUrl?: string | null }): JSX.Element {
  const [failed, setFailed] = useState(false);
  if (pictureUrl && !failed) {
    return (
      <img
        src={pictureUrl}
        alt=""
        className="h-8 w-8 rounded-full"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => {
          setFailed(true);
        }}
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container text-sm font-semibold text-on-tertiary-container">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function isActivePath(pathname: string, targetPath: string): boolean {
  if (targetPath === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(targetPath);
}

export function Header(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasAccess } = useAppAccess();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();

  const sharedNavButtonClass =
    'touch-target rounded-full px-4 py-2 text-sm font-medium';

  return (
    <header className="bg-surface-container-low/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="state-layer touch-target flex items-center gap-3 rounded-2xl text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <img src="/pav_logo_clean_flat_2048.webp" alt="" className="h-10 w-10" />
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-lg font-bold text-on-surface">Pet Air Valet</span>
              <span className="font-serif text-xs italic text-on-surface-variant">Fly Together, In-Cabin</span>
            </div>
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-2 sm:flex" aria-label="Primary">
              <M3TextButton
                dataTestId="header-action-home"
                className={`${sharedNavButtonClass} ${isActivePath(location.pathname, '/') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}
                onClick={() => { void navigate('/'); }}
              >
                Home
              </M3TextButton>
              {hasAccess('wiki') && (
                <M3TextButton
                  dataTestId="header-action-wiki"
                  className={`${sharedNavButtonClass} ${isActivePath(location.pathname, '/wiki') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}
                  onClick={() => { void navigate('/wiki'); }}
                >
                  Wiki
                </M3TextButton>
              )}
              {user?.isAdmin && (
                <M3TextButton
                  dataTestId="header-action-admin"
                  className={`${sharedNavButtonClass} ${isActivePath(location.pathname, '/admin') ? 'bg-tertiary-container text-on-tertiary-container' : 'text-tertiary'}`}
                  onClick={() => { void navigate('/admin'); }}
                >
                  Admin
                </M3TextButton>
              )}
            </nav>
          )}
        </div>
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserAvatar name={user.name} pictureUrl={user.pictureUrl} />
              <span className="hidden text-sm text-on-surface sm:block">
                {user.name}
              </span>
            </div>
            <M3TextButton
              dataTestId="header-action-signout"
              className="touch-target rounded-full px-4 py-2 text-sm text-on-surface-variant"
              onClick={logout}
            >
              Sign out
            </M3TextButton>
          </div>
        )}
      </div>
      {!isOnline && (
        <div className="border-t border-outline-variant bg-error-container/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-error-container">
              <span className="h-2 w-2 rounded-full bg-error" aria-hidden="true" />
              Offline. Some actions require a connection.
            </div>
            <M3FilledTonalButton
              dataTestId="header-offline-retry"
              type="button"
              onClick={() => { window.location.reload(); }}
              className="touch-target rounded-full px-3 py-1 text-xs font-semibold"
            >
              Retry
            </M3FilledTonalButton>
          </div>
        </div>
      )}
    </header>
  );
}

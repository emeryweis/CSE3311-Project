'use client';

import { Dispatch, FormEvent, SetStateAction, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

type NavBarProps = {
  navQuery?: string;
  setNavQuery?: Dispatch<SetStateAction<string>>;
  submitSearch?: (query: string) => void;
};

export default function NavBar({ navQuery = '', setNavQuery, submitSearch }: NavBarProps) {
  const router = useRouter();
  const { isAuthenticated, user, logout, loading } = useAuth();

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.firstName?.trim() || user.username?.trim() || user.email;
  }, [user]);

  const handleLogout = () => {
    logout();
    router.refresh();
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitSearch) {
      const query = navQuery.trim();
      if (query.length) {
        submitSearch(query);
      }
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-800 bg-neutral-950/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand */}
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-white transition hover:text-emerald-400 sm:text-2xl"
          >
            OutdoorSpot
          </Link>

          {/* Center: Nav Links & optional search */}
          <div className="flex flex-1 items-center justify-center gap-6">
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-8 text-sm text-neutral-300 sm:text-base">
                <li>
                  <Link href="/locations" className="transition hover:text-white">
                    Locations
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="transition hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="transition hover:text-white">
                    Feedback
                  </Link>
                </li>
              </ul>
            </nav>

            {setNavQuery && submitSearch && (
              <form
                onSubmit={handleSearchSubmit}
                className="hidden max-w-md flex-1 items-center gap-2 md:flex"
                role="search"
                aria-label="Site search"
              >
                <input
                  value={navQuery}
                  onChange={(event) => setNavQuery(event.target.value)}
                  placeholder="Search for destinations"
                  className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Search
                </button>
              </form>
            )}
          </div>

          {/* Right: Auth links */}
          <div className="flex min-w-[8rem] items-center justify-end gap-3">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-neutral-800/70" aria-hidden="true" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/account"
                  className="group flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1.5 text-left transition hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label="View account"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-left text-sm text-neutral-200 sm:block">
                    <p className="font-medium leading-tight">{displayName}</p>
                    <p className="text-xs text-neutral-500 transition group-hover:text-neutral-300">Signed in</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-neutral-300 transition hover:text-white"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-sm text-neutral-300 transition hover:text-white">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 sm:px-4"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


'use client';

import Link from 'next/link';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';
import { useAuth } from '@/app/context/AuthContext';

const formatValue = (value: string | null | undefined) => {
  if (!value || !value.trim().length) {
    return '—';
  }
  return value;
};

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();

  const displayName = user
    ? user.firstName?.trim() || user.username?.trim() || user.email
    : '';

  return (
    <main className="min-h-screen text-neutral-100">
      <NavBar />
      <PageShell imageSrc="/search_screen.jpg" fadeHeight="40vh" withFixedHeaderOffset>
        <div className="flex min-h-full flex-col">
          <section className="flex-1 py-16">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
              <Backplate className="w-full">
                <header className="space-y-2 text-center sm:text-left">
                  <p className="text-sm uppercase tracking-wide text-emerald-300/80">Account</p>
                  <h1 className="text-3xl font-semibold sm:text-4xl">Your profile</h1>
                  <p className="text-sm text-neutral-300 sm:text-base">
                    Review your details and keep your OutdoorSpot account up to date.
                  </p>
                </header>

                <div className="mt-8">
                  {loading ? (
                    <p className="text-neutral-300">Loading your account information...</p>
                  ) : isAuthenticated && user ? (
                    <div className="space-y-8">
                      <section className="space-y-2">
                        <h2 className="text-xl font-semibold">Overview</h2>
                        <p className="text-sm text-neutral-400">
                          Signed in as <span className="text-neutral-100">{displayName}</span>.
                        </p>
                      </section>

                      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <dt className="text-sm text-neutral-400">First name</dt>
                          <dd className="mt-2 text-lg font-medium text-white">{formatValue(user.firstName)}</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <dt className="text-sm text-neutral-400">Last name</dt>
                          <dd className="mt-2 text-lg font-medium text-white">{formatValue(user.lastName)}</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <dt className="text-sm text-neutral-400">Email</dt>
                          <dd className="mt-2 text-lg font-medium text-white">{formatValue(user.email)}</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <dt className="text-sm text-neutral-400">Username</dt>
                          <dd className="mt-2 text-lg font-medium text-white">{formatValue(user.username)}</dd>
                        </div>
                      </dl>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h3 className="text-lg font-semibold">Need to make changes?</h3>
                        <p className="mt-2 text-sm text-neutral-300">
                          Profile editing is coming soon. Reach out to our support team if you need immediate updates.
                        </p>
                        <Link
                          href="/locations"
                          className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                        >
                          Explore locations
                        </Link>
                      </div>
                      {user.admin && (
                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm uppercase tracking-wide text-emerald-300/80">Admin tools</p>
                              <h3 className="text-lg font-semibold text-white">Admin dashboard</h3>
                              <p className="mt-1 text-sm text-emerald-100/80">
                                Review submissions, moderate content, and manage OutdoorSpot data.
                              </p>
                            </div>
                            <Link
                              href="/admin/dashboard"
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-300/60 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:border-emerald-200 hover:bg-emerald-400/10"
                            >
                              Go to admin dashboard
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 text-center sm:text-left">
                      <p className="text-lg font-semibold text-white">You’re not signed in.</p>
                      <p className="text-sm text-neutral-300">
                        Log in to view your OutdoorSpot account details and personalize your adventures.
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/auth/login"
                          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/auth/register"
                          className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-500 hover:text-emerald-200"
                        >
                          Create account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </Backplate>
            </div>
          </section>

          <div className="mt-auto">
            <Footer />
          </div>
        </div>
      </PageShell>
    </main>
  );
}


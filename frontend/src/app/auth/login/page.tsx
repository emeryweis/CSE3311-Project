'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedMessage, setVerifiedMessage] = useState<string | null>(null);
  const buttonText = isSubmitting ? 'Signing you in…' : 'Sign in to OutdoorSpot';

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerifiedMessage('Email verified successfully! You can now sign in.');
      // Clear the message after 5 seconds
      setTimeout(() => setVerifiedMessage(null), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.email.endsWith('@mavs.uta.edu')) {
      setSubmitError('Please use your UTA email address (@mavs.uta.edu).');
      return;
    }

    if (!API_URL || API_URL === 'undefined') {
      setSubmitError('Backend URL not configured. Please contact support.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        // Check if email verification is required
        if (response.status === 403 && data?.requiresVerification) {
          // Redirect to verification page
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
          return;
        }
        const message = data?.message || `Unable to sign in (status ${response.status}).`;
        throw new Error(message);
      }

      if (!data?.success || !data?.data?.user || !data?.data?.token) {
        throw new Error('Unexpected response from the server.');
      }

      await login({ user: data.data.user, token: data.data.token });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <main className="min-h-screen text-white">
      <NavBar />

      <PageShell
        imageSrc="/search_screen.jpg"
        fadeHeight="40vh"
        withFixedHeaderOffset
      >
        <div className="flex flex-col gap-16">
          {/* HERO */}
          <section className="pt-20 sm:pt-28 md:pt-32">
            <div className="mx-auto w-full max-w-2xl px-4">
              <Backplate className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold">Sign In to OutdoorSpot</h1>
                <p className="mt-4 text-neutral-300">
                  Use your UTA email (@mavs.uta.edu) to access your account
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Sign up here
                  </Link>
                </p>
              </Backplate>
            </div>
          </section>

          {/* LOGIN FORM */}
          <section className="px-4 pb-20">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      UTA Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="yourname@mavs.uta.edu"
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {formData.email && !formData.email.endsWith('@mavs.uta.edu') && (
                      <p className="mt-1 text-sm text-red-400">Please use your UTA email address (@mavs.uta.edu)</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-600 rounded bg-neutral-800"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-300">
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      <a href="#" className="text-emerald-400 hover:text-emerald-300">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  {/* Error Message */}
                  {submitError && (
                    <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
                      {submitError}
                    </div>
                  )}

                  {/* Verified Success Message */}
                  {verifiedMessage && (
                    <div className="rounded-lg bg-emerald-900/30 border border-emerald-700 p-4 text-emerald-300">
                      {verifiedMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      {buttonText}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                    <p className="text-sm text-emerald-300 text-center">
                      This platform is exclusively for UTA students. Please use your official @mavs.uta.edu email address.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </PageShell>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const email = searchParams.get('email') || '';
  
  const [verificationCode, setVerificationCode] = useState('');
  const [emailInput, setEmailInput] = useState(email);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (email) {
      setEmailInput(email);
    }
  }, [email]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailInput || !verificationCode) {
      setError('Please enter your email and verification code.');
      return;
    }

    if (!emailInput.endsWith('@mavs.uta.edu')) {
      setError('Please use your UTA email address (@mavs.uta.edu).');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, code: verificationCode }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const message = data?.message || 'Verification failed. Please check your code and try again.';
        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error('Unexpected response from the server.');
      }

      setVerified(true);
      setSuccess('Email verified successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login?verified=true');
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
      const message = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setSuccess(null);

    if (!emailInput) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailInput.endsWith('@mavs.uta.edu')) {
      setError('Please use your UTA email address (@mavs.uta.edu).');
      return;
    }

    setResending(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const message = data?.message || 'Failed to resend verification code.';
        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error('Unexpected response from the server.');
      }

      setSuccess('Verification code has been resent to your email!');
      setVerificationCode(''); // Clear the input
    } catch (error) {
      console.error('Resend error:', error);
      const message = error instanceof Error ? error.message : 'Failed to resend verification code.';
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only numbers, max 6 digits
    setVerificationCode(value);
    if (error) setError(null);
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
                <h1 className="text-3xl md:text-4xl font-bold">
                  {verified ? 'Email Verified!' : 'Verify Your Email'}
                </h1>
                <p className="mt-4 text-neutral-300">
                  {verified
                    ? 'Your email has been verified. You can now log in to your account.'
                    : 'We sent a 6-digit verification code to your email. Please enter it below.'}
                </p>
              </Backplate>
            </div>
          </section>

          {/* VERIFICATION FORM */}
          {!verified && (
            <section className="px-4 pb-20">
              <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6 md:p-8">
                  <form onSubmit={handleVerify} className="space-y-6">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        UTA Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        disabled={!!email}
                        className={`w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="yourname@mavs.uta.edu"
                      />
                    </div>

                    {/* Verification Code Input */}
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium mb-2">
                        Verification Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="code"
                        name="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={handleCodeChange}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-3xl tracking-widest font-mono"
                        placeholder="000000"
                      />
                      <p className="mt-2 text-sm text-neutral-400 text-center">
                        Enter the 6-digit code sent to your email
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
                        {error}
                      </div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <div className="rounded-lg bg-emerald-900/30 border border-emerald-700 p-4 text-emerald-300">
                        {success}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading || !verificationCode || verificationCode.length !== 6}
                        className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                      >
                        {loading ? 'Verifying...' : 'Verify Email'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Back
                      </button>
                    </div>

                    {/* Resend Code */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resending || !emailInput}
                        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {resending ? 'Sending...' : "Didn't receive a code? Resend"}
                      </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                      <p className="text-sm text-emerald-300 text-center">
                        Check your spam folder if you don't see the email. The code expires in 24 hours.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* VERIFIED SUCCESS */}
          {verified && (
            <section className="px-4 pb-20">
              <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-emerald-700 bg-emerald-900/20 backdrop-blur p-6 md:p-8 text-center">
                  <h2 className="text-2xl font-bold text-emerald-400 mb-4">Email Verified Successfully!</h2>
                  <p className="text-neutral-300 mb-6">
                    Your email address has been verified. You can now log in to your account.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            </section>
          )}

          <Footer />
        </div>
      </PageShell>
    </main>
  );
}


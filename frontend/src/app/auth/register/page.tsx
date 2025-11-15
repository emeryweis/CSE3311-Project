'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const submitButtonText = loading ? 'Creating your account…' : 'Join OutdoorSpot as UTA Student';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const newErrors: Record<string, string> = {};

    if (!formData.email.endsWith('@mavs.uta.edu')) {
      newErrors.email = 'Please use your UTA email address (@mavs.uta.edu)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (!BASE_URL || BASE_URL === 'undefined') {
        throw new Error('Backend URL not configured. Please contact support.');
      }

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const message = data?.message || `Unable to complete registration (status ${response.status}).`;
        throw new Error(message);
      }

      if (!data?.success || !data?.data) {
        throw new Error('Unexpected response from the server.');
      }

      // Redirect to verification page with email
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      console.error('Registration error:', error);
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-3xl md:text-4xl font-bold">Create Your Account</h1>
                <p className="mt-4 text-neutral-300">
                  Join the UTA outdoor community with your @mavs.uta.edu email
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Sign in here
                  </Link>
                </p>
              </Backplate>
            </div>
          </section>

          {/* REGISTRATION FORM */}
          <section className="px-4 pb-20">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* First Name */}
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                          First name <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 bg-neutral-800 border ${
                            errors.firstName ? 'border-red-600' : 'border-neutral-700'
                          } rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                          placeholder="First name"
                        />
                        {errors.firstName && <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                          Last name <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 bg-neutral-800 border ${
                            errors.lastName ? 'border-red-600' : 'border-neutral-700'
                          } rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                          placeholder="Last name"
                        />
                        {errors.lastName && <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>}
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium mb-2">
                        Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-neutral-800 border ${
                          errors.username ? 'border-red-600' : 'border-neutral-700'
                        } rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder="Choose a username"
                      />
                      {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
                    </div>

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
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-neutral-800 border ${
                          errors.email ? 'border-red-600' : 'border-neutral-700'
                        } rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder="yourname@mavs.uta.edu"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
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
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-neutral-800 border ${
                          errors.password ? 'border-red-600' : 'border-neutral-700'
                        } rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder="Create a password (min. 6 characters)"
                      />
                      {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                        Confirm password <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-neutral-800 border ${
                          errors.confirmPassword ? 'border-red-600' : 'border-neutral-700'
                        } rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder="Confirm your password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-center">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-600 rounded bg-neutral-800"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-neutral-300">
                      I agree to the{' '}
                      <a href="#" className="text-emerald-400 hover:text-emerald-300">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-emerald-400 hover:text-emerald-300">
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {/* Error Message */}
                  {serverError && (
                    <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
                      {serverError}
                    </div>
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <div className="rounded-lg bg-emerald-900/30 border border-emerald-700 p-4 text-emerald-300">
                      {successMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      {submitButtonText}
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
                      Exclusively for University of Texas at Arlington students. Connect with fellow Mavericks who love the outdoors!
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

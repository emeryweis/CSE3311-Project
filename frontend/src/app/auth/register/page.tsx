'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

      let autoLoginSucceeded = false;

      try {
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });

        const loginContentType = loginResponse.headers.get('content-type');
        const loginIsJson = loginContentType && loginContentType.includes('application/json');
        const loginData = loginIsJson ? await loginResponse.json() : null;

        if (
          loginResponse.ok &&
          loginData?.success &&
          loginData?.data?.user &&
          loginData?.data?.token
        ) {
          await login({ user: loginData.data.user, token: loginData.data.token });
          autoLoginSucceeded = true;
          router.push('/');
          router.refresh();
        }
      } catch (autoLoginError) {
        console.warn('Auto-login after registration failed:', autoLoginError);
      }

      if (!autoLoginSucceeded) {
        setSuccessMessage('Registration successful! You can now sign in with your new credentials.');
        setFormData((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-3 mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            </div>
            <span className="text-3xl font-bold text-blue-600">OutdoorSpot</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create UTA Student Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the UTA outdoor community with your @mavs.uta.edu email
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="First name"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Last name"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Choose a username"
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  UTA Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="yourname@mavs.uta.edu"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Create a password"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center mt-4">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            {serverError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4" role="alert" aria-live="assertive">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4" role="status" aria-live="polite">
                <p className="text-sm text-emerald-700">{successMessage}</p>
              </div>
            )}

            {/* Submit */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`group relative flex w-full justify-center rounded-lg border border-transparent py-2 px-4 text-sm font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  loading ? 'cursor-not-allowed bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitButtonText}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                🏛️ Exclusively for University of Texas at Arlington students. Connect with fellow Mavericks who love the outdoors!
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

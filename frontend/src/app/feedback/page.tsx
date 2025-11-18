'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';
import { useAuth } from '@/app/context/AuthContext';

export default function FeedbackPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    rating: 5,
    category: 'general',
    subject: '',
    message: '',
    email: user?.email || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!formData.message.trim()) {
      setSubmitError('Please enter your feedback message.');
      return;
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      setSubmitError('Please select a rating between 1 and 5.');
      return;
    }

    if (!API_URL || API_URL === 'undefined') {
      setSubmitError('Backend URL not configured.');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authState')
        ? JSON.parse(localStorage.getItem('authState') || '{}').token
        : null;

      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating: formData.rating,
          category: formData.category,
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
          email: formData.email.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          rating: 5,
          category: 'general',
          subject: '',
          message: '',
          email: user?.email || '',
        });
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        throw new Error('Failed to submit feedback.');
      }
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      setSubmitError(err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
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
                <h1 className="text-3xl md:text-4xl font-bold">Share Your Feedback</h1>
                <p className="mt-4 text-neutral-300">
                  Help us improve OutdoorSpot! We'd love to hear about your experience.
                </p>
              </Backplate>
            </div>
          </section>

          {/* FEEDBACK FORM */}
          <section className="px-4 pb-20">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6 md:p-8">
                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-400 mb-2">
                      Thank You!
                    </h2>
                    <p className="text-neutral-300">
                      Your feedback has been submitted successfully. We appreciate your input!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium mb-3">
                        How would you rate your experience? <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                            className={`text-3xl transition-transform hover:scale-110 ${
                              formData.rating >= star
                                ? 'text-yellow-400'
                                : 'text-neutral-600'
                            }`}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <input
                        type="hidden"
                        name="rating"
                        value={formData.rating}
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="general">General Feedback</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="improvement">Improvement Suggestion</option>
                        <option value="complaint">Complaint</option>
                        <option value="compliment">Compliment</option>
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Subject (optional)
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Brief summary of your feedback"
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Your Feedback <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        required
                        placeholder="Tell us about your experience, suggestions, or any issues you encountered..."
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Email (optional, pre-filled if logged in) */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email (optional - for follow-up)
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {isAuthenticated && (
                        <p className="mt-1 text-xs text-neutral-400">
                          Pre-filled with your account email
                        </p>
                      )}
                    </div>

                    {/* Error Message */}
                    {submitError && (
                      <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
                        {submitError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                      >
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </PageShell>
    </main>
  );
}


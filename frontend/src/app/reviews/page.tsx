'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';
import { useAuth } from '@/app/context/AuthContext';

type Review = {
  id: string;
  content: string;
  rating: number;
  createdAt: string | Date;
  user?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  location?: {
    id: string;
    name: string;
  };
};

export default function ReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId');
  const { user, token, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    content: '',
    rating: 5,
    locationId: locationId || '',
  });

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!API_URL || API_URL === 'undefined') {
        setError('Backend URL not configured.');
        setLoading(false);
        return;
      }

      try {
        const url = locationId
          ? `${API_URL}/api/reviews?locationId=${encodeURIComponent(locationId)}`
          : `${API_URL}/api/reviews`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setReviews(data.data || []);
        } else {
          setReviews([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to load reviews.');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [API_URL, locationId, token]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isAuthenticated || !token) {
      setSubmitError('Please log in to submit a review.');
      router.push('/auth/login');
      return;
    }

    if (!formData.content.trim()) {
      setSubmitError('Please enter a review comment.');
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
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: formData.content.trim(),
          rating: formData.rating,
          locationId: formData.locationId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        // Refresh reviews
        const refreshRes = await fetch(
          locationId
            ? `${API_URL}/api/reviews?locationId=${encodeURIComponent(locationId)}`
            : `${API_URL}/api/reviews`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setReviews(refreshData.data || []);
          }
        }

        // Reset form
        setFormData({
          content: '',
          rating: 5,
          locationId: locationId || '',
        });
        setShowForm(false);
        setSubmitError(null);
      } else {
        throw new Error('Failed to submit review.');
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
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
                <h1 className="text-3xl md:text-4xl font-bold">Reviews</h1>
                <p className="mt-4 text-neutral-300">
                  {locationId
                    ? 'Reviews for this location'
                    : 'Read and share reviews about camping locations'}
                </p>
              </Backplate>
            </div>
          </section>

          {/* REVIEW FORM */}
          {isAuthenticated && (
            <section className="px-4">
              <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6">
                  {!showForm ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      Write a Review
                    </button>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="rating" className="block text-sm font-medium mb-2">
                          Rating
                        </label>
                        <select
                          id="rating"
                          name="rating"
                          value={formData.rating}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        >
                          <option value={5}>5 - Excellent</option>
                          <option value={4}>4 - Very Good</option>
                          <option value={3}>3 - Good</option>
                          <option value={2}>2 - Fair</option>
                          <option value={1}>1 - Poor</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="content" className="block text-sm font-medium mb-2">
                          Review
                        </label>
                        <textarea
                          id="content"
                          name="content"
                          value={formData.content}
                          onChange={handleChange}
                          rows={5}
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Share your experience..."
                          required
                        />
                      </div>

                      {submitError && (
                        <div className="text-red-400 text-sm">{submitError}</div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                          {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setSubmitError(null);
                          }}
                          className="px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* REVIEWS LIST */}
          <section className="px-4 pb-20">
            <div className="mx-auto max-w-4xl">
              {loading && <p className="text-center text-neutral-400">Loading reviews...</p>}

              {error && !loading && (
                <div className="text-center text-red-400 mb-8">
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && reviews.length === 0 && (
                <div className="text-center text-neutral-400">
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              )}

              <div className="space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-lg">
                          {review.user?.firstName && review.user?.lastName
                            ? `${review.user.firstName} ${review.user.lastName}`
                            : review.user?.username || 'Anonymous'}
                        </div>
                        {review.location && (
                          <Link
                            href={`/location?id=${review.location.id}`}
                            className="text-sm text-emerald-400 hover:underline mt-1 block"
                          >
                            {review.location.name}
                          </Link>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">
                          {review.rating}/5
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-neutral-300 whitespace-pre-line">{review.content}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </PageShell>
    </main>
  );
}


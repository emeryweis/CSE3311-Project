'use client';

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import WeatherForecast from '@/app/components/WeatherForecast';
import GalleryLightbox from '@/app/components/GalleryLightbox';
import { useAuth } from '@/app/context/AuthContext';

// Lazy-load MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('@/app/components/MapComponent'), { ssr: false });

// ---------------- Types (mirror Prisma / API) ----------------
type Json = any;

type ReviewUser = {
  id?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type Review = {
  id?: string;
  author?: string | null;
  rating?: number | string | null; // <-- allow string too
  comment?: string | null;
  content?: string | null;
  createdAt?: string | Date;
  userId?: string | null;
  user?: ReviewUser | null;
};

type LocationDetail = {
  id: string;
  name: string;
  description?: string | null;
  locationType: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string; // default "US"
  elevation?: number | null;
  terrainType?: string | null;
  climateZone?: string | null;
  amenities?: Json | null;
  costPerNight?: string | number | null; // Prisma Decimal often serialized as string
  maxCapacity?: number | null;
  petFriendly: boolean;
  reservationRequired: boolean;
  seasonStart?: string | Date | null;
  seasonEnd?: string | Date | null;
  difficultyLevel?: number | null;
  safetyNotes?: string | null;
  regulations?: string | null;
  contactInfo?: Json | null;
  websiteUrl?: string | null;
  images?: Json | null; // arbitrary JSON shape
  verified: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  rating?: number | string | null;      // <-- allow string too
  createdById?: string | null;
  reviews?: Review[] | null;            // may or may not be included by your route
};

const getReviewAuthorName = (review: Review): string => {
  if (review.author && review.author.trim().length > 0) {
    return review.author;
  }

  if (review.user) {
    const parts = [review.user.firstName, review.user.lastName].filter((p) => (p ?? '').trim().length > 0);
    if (parts.length > 0) {
      return parts.join(' ');
    }
    if (review.user.username) {
      return review.user.username;
    }
  }

  return 'Anonymous';
};

const getReviewBody = (review: Review): string => review.comment ?? review.content ?? '';

const parseReviewRating = (value: Review['rating']): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(5, num));
};

// ---------------- Utils ----------------
const isPresent = (v: unknown) => v !== undefined && v !== null && v !== '';

const fmtBool = (b?: boolean | null) => (b ? 'Yes' : 'No');

const fmtNumber = (n?: number | string | null, opts?: { digits?: number }) => {
  if (n === null || n === undefined || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(num)) return '—';
  const digits = opts?.digits ?? 1;
  return Math.abs((num as number) - Math.round(num as number)) < 1e-9
    ? String(Math.round(num as number))
    : (num as number).toFixed(digits);
};

const fmtUSD = (val?: string | number | null) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!isFinite(num as number)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num as number);
  } catch {
    return `$${num}`;
  }
};

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString();
};

const humanizeJsonKey = (key: string) =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\w/g, (s) => s.toUpperCase());

const renderStructuredJson = (value: Json): ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-neutral-500">—</span>;
  }

  if (value instanceof Date) {
    return <span className="text-neutral-300">{value.toLocaleString()}</span>;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-neutral-300">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-neutral-500">—</span>;
    }
    return (
      <ul className="list-disc list-inside space-y-1 text-neutral-300">
        {value.map((item, idx) => (
          <li key={idx}>{renderStructuredJson(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, Json>).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return <span className="text-neutral-500">—</span>;
    }
    return (
      <dl className="space-y-3">
        {entries.map(([key, val]) => (
          <div key={key} className="space-y-1">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              {humanizeJsonKey(key)}
            </dt>
            <dd className="text-sm text-neutral-300">{renderStructuredJson(val)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="text-neutral-300">{String(value)}</span>;
};

// Normalize images from arbitrary JSON shapes
const normalizeImagesFromJson = (images: Json): string[] => {
  if (!images) return [];
  if (typeof images === 'string') return images ? [images] : [];
  if (Array.isArray(images)) {
    return images
      .map((it) => (typeof it === 'string' ? it : (it && (it.url || it.src || it.path)) || ''))
      .filter(Boolean);
  }
  if (typeof images === 'object') {
    if (Array.isArray((images as any).items)) {
      return (images as any).items
        .map((it: any) => (typeof it === 'string' ? it : (it && (it.url || it.src || it.path)) || ''))
        .filter(Boolean);
    }
    const single = (images as any).url || (images as any).src || (images as any).path;
    if (single) return [single];
  }
  return [];
};

const getFirstImage = (images?: Json | null): string | undefined => {
  const arr = normalizeImagesFromJson(images ?? null);
  return arr[0] || undefined;
};

// Simple fetch with timeout
async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// If DB rating is missing, fall back to average of review ratings
const averageRating = (reviews?: Review[] | null): number | null => {
  if (!reviews || reviews.length === 0) return null;
  const nums = reviews
    .map((r) => parseReviewRating(r.rating))
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (nums.length === 0) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Number.isFinite(avg) ? avg : null;
};

// ---------------- Page ----------------
export default function LocationPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [data, setData] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const backendBase = useMemo(() => (API_URL || '').replace(/\/$/, ''), [API_URL]);
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();

  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const userReview = useMemo(() => {
    if (!user?.id || !data?.reviews) {
      return null;
    }
    return data.reviews.find((review) => review.userId === user.id) ?? null;
  }, [data?.reviews, user?.id]);
  const userReviewText = userReview ? getReviewBody(userReview) : '';

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setError('Missing id in URL.');
        setLoading(false);
        return;
      }
      if (!API_URL || API_URL === 'undefined') {
        setError('Backend URL not configured.');
        setLoading(false);
        return;
      }

      try {
        const endpoint = `${backendBase}/api/locations/id/${encodeURIComponent(id)}`;
        const res = await fetchWithTimeout(
          endpoint,
          { headers: { 'Content-Type': 'application/json' } },
          8000
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Response is not JSON');

        const json = await res.json();
        const payload = json?.success ? json.data : json;
        setData(payload as LocationDetail);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to load location.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [API_URL, backendBase, id]);

  const toggleReviewDropdown = () => {
    setReviewDropdownOpen((prev) => !prev);
    setReviewError(null);
    setReviewHoverRating(null);
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated || !token) {
      setReviewError('Please log in to leave a review.');
      return;
    }
    if (!data?.id) {
      setReviewError('Location details are still loading.');
      return;
    }
    if (!API_URL || API_URL === 'undefined') {
      setReviewError('Backend URL not configured.');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please choose a rating between 1 and 5 stars.');
      return;
    }
    if (!reviewText.trim()) {
      setReviewError('Please share a few details about your experience.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch(`${backendBase}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationId: data.id,
          rating: reviewRating,
          content: reviewText.trim(),
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to submit review right now.');
      }

      const createdReview = payload.data as Review;
      setData((prev) => {
        if (!prev) return prev;
        const existingReviews = Array.isArray(prev.reviews) ? prev.reviews : [];
        return {
          ...prev,
          reviews: [createdReview, ...existingReviews],
        };
      });

      setReviewSuccess('Thank you for sharing your review!');
      setReviewText('');
      setReviewRating(0);
      setReviewDropdownOpen(false);
    } catch (submitError: any) {
      setReviewError(submitError?.message || 'Unable to submit review right now.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Background image = first of images (if any), Gallery = rest
  const allImages = normalizeImagesFromJson(data?.images ?? null);
  const bgImage = allImages[0] || undefined;
  const gallery = allImages.slice(1);

  // ----- Robust rating for display -----
  const parsedDbRating =
    typeof data?.rating === 'string' ? parseFloat(data.rating) : data?.rating ?? null;
  const displayRatingRaw =
    (Number.isFinite(parsedDbRating as number) ? (parsedDbRating as number) : null) ??
    averageRating(data?.reviews);
  const displayRating = fmtNumber(displayRatingRaw, { digits: 1 });
  const reviewPanelId = data?.id ? `review-panel-${data.id}` : 'review-panel';

  return (
    <main className="text-neutral-100">
      <NavBar />

      <PageShell
        imageSrc={bgImage}
        withFixedHeaderOffset
        containerClassName="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex min-h-[calc(100vh-var(--header-h,64px))] flex-col">
          {/* Title & intro */}
          <section className="pt-2 sm:pt-4 pb-10">
            <div className="max-w-3xl space-y-3">
              <div className="w-full rounded-3xl bg-neutral-950/80 px-6 py-4 backdrop-blur-sm shadow-lg ring-1 ring-white/5">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                  {loading ? 'Loading…' : data?.name ?? '—'}
                </h1>
              </div>
              <div className="w-full rounded-3xl bg-neutral-950/70 px-6 py-4 backdrop-blur-sm shadow-md ring-1 ring-white/5">
                <p className="text-lg text-neutral-200">
                  {loading ? '' : data?.description || '—'}
                </p>
              </div>
              <div className="text-sm text-neutral-300">
                {loading || !data ? '' : [data.city, data.state, data.country].filter(isPresent).join(', ')}
              </div>
            </div>
          </section>

          {/* Row: Quick facts (left) + Map (right) */}
          <section className="relative py-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left: Quick facts */}
              <article className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6">
                {loading && <p className="text-neutral-400">Loading details…</p>}
                {error && !loading && <p className="text-red-400">{error}</p>}

                {!loading && !error && data && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <Info label="Rating" value={displayRating} />
                      <Info label="Cost / Night" value={fmtUSD(data.costPerNight)} />
                      <Info label="Max Capacity" value={fmtNumber(data.maxCapacity ?? null)} />
                      <Info label="Pet Friendly" value={fmtBool(data.petFriendly)} />
                      <Info label="Reservation Required" value={fmtBool(data.reservationRequired)} />
                      <Info label="Season Start" value={fmtDate(data.seasonStart ?? null)} />
                      <Info label="Season End" value={fmtDate(data.seasonEnd ?? null)} />
                      <Info label="Difficulty" value={fmtNumber(data.difficultyLevel ?? null)} />
                      <Info label="Elevation (ft)" value={fmtNumber(data.elevation ?? null)} />
                      <Info label="Terrain" value={data.terrainType || '—'} />
                      <Info label="Climate" value={data.climateZone || '—'} />
                    </div>
                  </div>
                )}
              </article>

              {/* Right: Map (no label) — card height matches map height */}
              <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur h-96 overflow-hidden">
                {isPresent(data?.latitude) && isPresent(data?.longitude) ? (
                  <MapComponent
                    locations={[
                      {
                        id: data!.id,
                        name: data!.name,
                        latitude: Number(data!.latitude!),
                        longitude: Number(data!.longitude!),
                        description: data!.description ?? undefined,
                      },
                    ]}
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-neutral-900 text-neutral-500">
                    —
                  </div>
                )}
              </aside>
            </div>
          </section>

          {/* Full-width Weather */}
          <WeatherForecast
            lat={data?.latitude}
            lng={data?.longitude}
            className="pb-8"
            sectionTitle="Weather"
          />

          {/* Consolidated Details Block (Address, Website, Amenities, Safety, Regulations, Contact) */}
          <section className="pb-8">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur divide-y divide-neutral-800">
              {/* Address */}
              <div className="p-6">
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-neutral-300 whitespace-pre-line">
                  {[
                    data?.address,
                    [data?.city, data?.state, data?.country].filter(isPresent).join(', '),
                  ]
                    .filter(isPresent)
                    .join('\n') || '—'}
                </p>
              </div>

              {/* Website */}
              <div className="p-6">
                <h3 className="font-semibold mb-2">Website</h3>
                {data?.websiteUrl ? (
                  <a
                    href={data.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline break-words"
                  >
                    {data.websiteUrl}
                  </a>
                ) : (
                  <span className="text-neutral-500">—</span>
                )}
              </div>

              {/* Amenities */}
              <div className="p-6">
                <h3 className="font-semibold mb-2">Amenities</h3>
                {isPresent(data?.amenities) ? (
                  Array.isArray(data?.amenities) ? (
                    <ul className="list-disc list-inside text-neutral-300 space-y-1">
                      {(data!.amenities as any[]).map((a: any, i: number) => (
                        <li key={i}>{String(a)}</li>
                      ))}
                    </ul>
                  ) : typeof data?.amenities === 'object' ? (
                    <pre className="text-neutral-300 overflow-auto text-sm">
                      {JSON.stringify(data?.amenities, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-neutral-300">{String(data?.amenities)}</span>
                  )
                ) : (
                  <span className="text-neutral-500">—</span>
                )}
              </div>

              {/* Safety Notes & Regulations (two-column on md+) */}
              {(isPresent(data?.safetyNotes) || isPresent(data?.regulations)) && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Safety Notes</h3>
                      <p className="text-neutral-300 whitespace-pre-line">
                        {data?.safetyNotes || '—'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Regulations</h3>
                      <p className="text-neutral-300 whitespace-pre-line">
                        {data?.regulations || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {isPresent(data?.contactInfo) && (
                <div className="p-6">
                  <h3 className="font-semibold mb-2">Contact Info</h3>
                  <div className="text-sm">{renderStructuredJson(data?.contactInfo)}</div>
                </div>
              )}
            </div>
          </section>

          {/* Gallery (full-width) */}
          <section className="pb-8">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6">
              <h3 className="font-semibold mb-3">Gallery</h3>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/10" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500">—</p>
              )}
            </div>
          </section>

          {/* Reviews (full-width) */}
          <section className="pb-12">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6">
              <h3 className="font-semibold mb-3">Reviews</h3>
              {data?.reviews && data.reviews.length > 0 ? (
                <ul className="space-y-3">
                  {data.reviews.map((r, i) => {
                    const reviewText = getReviewBody(r);
                    return (
                      <li key={r.id ?? i} className="rounded-xl border border-neutral-800 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">{getReviewAuthorName(r)}</div>
                            {r.createdAt && (
                              <div className="text-xs text-neutral-500">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <StarRatingDisplay rating={parseReviewRating(r.rating)} />
                        </div>
                        {reviewText ? (
                          <p className="mt-2 text-neutral-300">{reviewText}</p>
                        ) : (
                          <p className="mt-2 text-sm text-neutral-500">No written review</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-neutral-500">No reviews yet.</p>
              )}

              <div className="mt-6 border-t border-neutral-800 pt-6">
                {isAuthenticated ? (
                  userReview ? (
                    <div className="rounded-xl border border-emerald-800/40 bg-emerald-500/5 px-4 py-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">Your review</p>
                          {userReview.createdAt && (
                            <p className="text-xs text-neutral-400">
                              Posted on {new Date(userReview.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <StarRatingDisplay rating={parseReviewRating(userReview.rating)} />
                      </div>
                      {userReviewText && (
                        <p className="mt-2 text-sm text-neutral-200">{userReviewText}</p>
                      )}
                      <p className="mt-3 text-sm text-neutral-300">
                        You can only leave one review per location. Thanks for sharing your experience!
                      </p>
                      {reviewSuccess && (
                        <p className="mt-3 text-sm text-emerald-300">{reviewSuccess}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40">
                      <button
                        type="button"
                        onClick={toggleReviewDropdown}
                        aria-expanded={reviewDropdownOpen}
                        aria-controls={reviewPanelId}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
                      >
                        <span>{reviewDropdownOpen ? 'Hide review form' : 'Share your experience'}</span>
                        <span className={`transition-transform ${reviewDropdownOpen ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>
                      <div
                        id={reviewPanelId}
                        className={`transition-all duration-300 ease-out ${
                          reviewDropdownOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ maxHeight: reviewDropdownOpen ? 600 : 0, overflow: 'hidden' }}
                      >
                        <div className="px-4 pb-5">
                          <form className="space-y-4" onSubmit={handleReviewSubmit}>
                            <div>
                              <p className="text-sm text-neutral-400">Tap a star to rate this location.</p>
                              <div className="mt-3 flex items-center gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isFilled = (reviewHoverRating ?? reviewRating) >= star;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      className="p-1 transition-transform hover:scale-105 focus:outline-none"
                                      onMouseEnter={() => setReviewHoverRating(star)}
                                      onMouseLeave={() => setReviewHoverRating(null)}
                                      onClick={() => setReviewRating(star)}
                                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                    >
                                      <StarIcon filled={isFilled} className="h-6 w-6" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <label htmlFor="review-text" className="text-sm text-neutral-200">
                                Your review
                              </label>
                              <textarea
                                id="review-text"
                                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                                rows={4}
                                value={reviewText}
                                onChange={(event) => setReviewText(event.target.value)}
                                placeholder="What did you love about this spot?"
                              />
                            </div>
                            {reviewError && <p className="text-sm text-red-400">{reviewError}</p>}
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                                onClick={() => {
                                  setReviewDropdownOpen(false);
                                  setReviewHoverRating(null);
                                  setReviewError(null);
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={reviewSubmitting}
                                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  !authLoading && (
                    <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/40 px-4 py-5 text-sm text-neutral-300">
                      Sign in to leave a review.
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          <div className="mt-auto" />

          <GalleryLightbox
            images={gallery}
            isOpen={lightboxOpen}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />

          <Footer />
        </div>
      </PageShell>
    </main>
  );
}

// ---------------- Small UI ----------------
function Info({ label, value }: { label: string; value: string }) {
  const isMissing = value === '—' || value === '';
  return (
    <div
      className={`rounded-xl border p-3 ${
        isMissing ? 'border-neutral-800 text-neutral-500' : 'border-neutral-800 bg-neutral-900/70'
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function StarRatingDisplay({ rating }: { rating?: number | null }) {
  const numericRating = typeof rating === 'number' && Number.isFinite(rating) ? rating : null;
  const safeRating = numericRating ?? 0;
  const label =
    numericRating !== null ? `${fmtNumber(safeRating, { digits: 1 })} out of 5 stars` : 'No rating yet';

  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={safeRating >= star} className="h-5 w-5" />
      ))}
      <span className="ml-2 text-xs text-neutral-400">
        {numericRating !== null ? fmtNumber(safeRating, { digits: 1 }) : '—'}
      </span>
    </div>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  const colorClass = filled ? 'text-amber-400' : 'text-neutral-600';
  const sizeClass = className ?? 'h-5 w-5';
  return (
    <svg
      className={`${colorClass} ${sizeClass}`.trim()}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

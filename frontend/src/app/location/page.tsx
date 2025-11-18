'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import WeatherForecast from '@/app/components/WeatherForecast';
import GalleryLightbox from '@/app/components/GalleryLightbox';

// Lazy-load MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('@/app/components/MapComponent'), { ssr: false });

// ---------------- Types (mirror Prisma / API) ----------------
type Json = any;

type Review = {
  id?: string;
  author?: string;
  rating?: number | string | null; // <-- allow string too
  comment?: string | null;
  createdAt?: string | Date;
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
    .map((r) => (typeof r?.rating === 'string' ? parseFloat(r.rating as any) : r?.rating))
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
  const [error,   setError]   = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const buildEndpoint = (locId: string) => {
    const base = (API_URL || '').replace(/\/$/, '');
    return `${base}/api/locations/id/${encodeURIComponent(locId)}`;
  };

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
        const res = await fetchWithTimeout(
          buildEndpoint(id),
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
        console.error('Error loading location:', e);
        // Handle specific error types
        if (e.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
          setError('Cannot connect to server. Please make sure the backend is running.');
        } else {
          setError(e?.message || 'Failed to load location.');
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [API_URL, id]);

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
                  {typeof data?.contactInfo === 'object' ? (
                    <pre className="text-neutral-300 overflow-auto text-sm">
                      {JSON.stringify(data?.contactInfo, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-neutral-300">{String(data?.contactInfo)}</span>
                  )}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Reviews</h3>
                <Link
                  href={`/reviews?locationId=${encodeURIComponent(data?.id || '')}`}
                  className="text-sm text-emerald-400 hover:underline"
                >
                  View All Reviews
                </Link>
              </div>
              {data?.reviews && data.reviews.length > 0 ? (
                <ul className="space-y-3">
                  {data.reviews.slice(0, 3).map((r, i) => (
                    <li key={r.id ?? i} className="rounded-xl border border-neutral-800 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{r.author || 'Anonymous'}</div>
                        <div className="text-sm text-emerald-400 font-semibold">
                          {typeof r.rating === 'number' ? `${r.rating}/5` : r.rating ?? '—'}
                        </div>
                      </div>
                      {r.comment && <p className="mt-2 text-neutral-300">{r.comment}</p>}
                      {r.createdAt && (
                        <div className="mt-1 text-xs text-neutral-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </li>
                  ))}
                  {data.reviews.length > 3 && (
                    <li className="text-center pt-2">
                      <Link
                        href={`/reviews?locationId=${encodeURIComponent(data.id)}`}
                        className="text-emerald-400 hover:underline text-sm"
                      >
                        View {data.reviews.length - 3} more reviews
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="space-y-3">
                  <p className="text-neutral-500">No reviews yet.</p>
                  <Link
                    href={`/reviews?locationId=${encodeURIComponent(data?.id || '')}`}
                    className="inline-block text-emerald-400 hover:underline text-sm"
                  >
                    Be the first to review this location
                  </Link>
                </div>
              )}
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import PageShell from '@/app/components/PageShell';

export default function Page() {
  const router = useRouter();

  const [heroQuery, setHeroQuery] = useState('');

  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Fetch featured locations
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        if (!API_URL || API_URL === 'undefined') {
          throw new Error('Backend URL not configured');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const res = await fetch(`${API_URL}/api/locations/recommended`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }

        const json = await res.json();
        if (json?.success) {
          setRecommended(json.data || []);
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to load featured locations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, [API_URL]);

  const submitSearch = (q: string) => {
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen text-neutral-100">
      {/* Fixed header */}
      <NavBar />

      {/* Page shell provides the scrolling background (no layout coupling) */}
      <PageShell videoSrc="/splash_screen.mp4" withFixedHeaderOffset>
        {/* Top intro / search — uses padding, not height */}
        <section className="pt-20 sm:pt-45 pb-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              Find your next North Texas escape
            </h1>
            <p className="mt-4 max-w-xl text-neutral-300">
              Camp under big skies. Wake to quiet horizons. Discover hidden spots locals love.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(heroQuery);
              }}
              className="mt-6 max-w-xl"
              role="search"
              aria-label="Hero search"
            >
              <div className="flex gap-2">
                <input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder='Search locations (e.g., "Lake Texoma")'
                  className="min-w-0 flex-1 rounded-2xl border border-neutral-800 bg-neutral-900/90 px-5 py-3 text-base placeholder:text-neutral-400 focus:border-neutral-700"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold hover:bg-emerald-500"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Featured Locations */}
        <section className="pt-50 pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold">Featured Locations</h2>
          <p className="mt-2 text-neutral-400">Hand-picked North Texas spots to kickstart your trip.</p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading && <p className="text-neutral-400">Loading featured locations...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && recommended.length === 0 && (
              <p className="text-neutral-400">No featured locations found.</p>
            )}

            {recommended.map((spot) => (
              <article
                key={spot.id}
                className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={spot.img || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={spot.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{spot.name}</h3>
                  <p className="mt-2 text-sm text-neutral-300">{spot.blurb}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-neutral-300">
                    <div>
                      <span className="text-yellow-400">★★★★★</span>
                      <span className="ml-1">({spot.rating})</span>
                    </div>
                    <div className="text-emerald-400 font-medium">{spot.price}</div>
                  </div>
                  <button
                    className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 font-medium hover:bg-emerald-500"
                    onClick={() => router.push(`/location?id=${spot.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Why Choose section */}
        <section className="border-y border-neutral-900 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Why Choose OutdoorSpot?</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-900 bg-neutral-900 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700/20">🗺️</div>
              <h3 className="text-lg font-semibold">Curated Locations</h3>
              <p className="mt-2 text-neutral-300">Verified info, photos, and details for the best North Texas sites.</p>
            </div>
            <div className="rounded-2xl border border-neutral-900 bg-neutral-900 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700/20">🎯</div>
              <h3 className="text-lg font-semibold">Smart Search</h3>
              <p className="mt-2 text-neutral-300">Filter by vibe, terrain, and amenities to find the perfect fit.</p>
            </div>
            <div className="rounded-2xl border border-neutral-900 bg-neutral-900 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700/20">⭐</div>
              <h3 className="text-lg font-semibold">Trusted Reviews</h3>
              <p className="mt-2 text-neutral-300">Real campers. Real feedback. Plan with confidence.</p>
            </div>
          </div>
        </section>

        <Footer />
      </PageShell>
    </main>
  );
}

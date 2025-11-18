'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import PageShell from '@/app/components/PageShell';
import Backplate from '@/app/components/Backplate';

type Location = {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: string;
  img: string;
};

type RawLocation = {
  id: string;
  name: string;
  description?: string | null;
  costPerNight?: number | string | null;
  rating?: number | string | null;
  images?: string[] | string | null;
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searched, setSearched] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Main search
  const handleSearch = async (p = 1, qOverride?: string) => {
    const searchTerm = qOverride ?? query;
    if (!searchTerm.trim()) return;

    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `${API_URL}/api/search/locations?q=${encodeURIComponent(searchTerm)}&page=${p}&limit=50`
      );
      const data = await res.json();
      if (data.success) {
        const normalized: Location[] = (data.data || []).map((loc: RawLocation) => {
          const rawImages = loc.images;
          const imageArray = Array.isArray(rawImages)
            ? rawImages
            : typeof rawImages === 'string'
              ? [rawImages]
              : [];
          const firstImage = imageArray[0];

          return {
            id: loc.id,
            name: loc.name,
            description: loc.description || 'No description available.',
            price: loc.costPerNight ? `$${loc.costPerNight}/night` : '—',
            rating:
              typeof loc.rating === 'number'
                ? loc.rating.toFixed(1)
                : loc.rating || '—',
            img: firstImage || 'https://via.placeholder.com/150?text=No+Image',
          };
        });

        setResults(normalized);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when URL query changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(1, initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <main className="min-h-screen text-white">
      <NavBar />

      <PageShell
        imageSrc="/search_screen.jpg"    // image background (not video)
        fadeHeight="40vh"                // smooth bottom fade
        withFixedHeaderOffset            // start content below fixed header
      >
        <div className="flex flex-col gap-16">
          {/* HERO (title + search) on a reusable Backplate */}
          <section className="pt-20 sm:pt-28 md:pt-32">
            <div className="mx-auto w-full max-w-2xl px-4">
              <Backplate className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold">Find Your Next Adventure</h1>

                <div className="mt-6 flex shadow-lg rounded-xl overflow-hidden border border-white/10">
                  <input
                    type="text"
                    placeholder="Search for locations..."
                    className="flex-1 p-4 text-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                  />
                  <button
                    onClick={() => handleSearch(1)}
                    className="bg-emerald-600 hover:bg-emerald-500 px-6 text-lg font-semibold transition-colors"
                  >
                    Search
                  </button>
                </div>
              </Backplate>
            </div>
          </section>

          {/* RESULTS */}
          <section className="px-6 pb-20">
            <main className="max-w-5xl mx-auto w-full">
              {searched && loading && <p className="text-center">Loading...</p>}

              {searched && !loading && results.length === 0 && (
                <p className="text-center text-gray-400">No results found.</p>
              )}

              <div className="space-y-6">
                {results.map((loc) => (
                  <article
                    key={loc.id}
                    className="relative group flex items-center gap-6 rounded-2xl border border-gray-800 bg-gray-800/90 transition hover:border-emerald-600 overflow-hidden px-3"
                  >
                    {/* Make the whole card clickable */}
                    <Link
                      href={`/location?id=${encodeURIComponent(loc.id)}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View details for ${loc.name}`}
                    />

                    <div className="relative h-16 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={loc.img || 'https://via.placeholder.com/150'}
                        alt={loc.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {/* Subtle gradient for readability */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    <div className="my-3 flex-1 pr-2">
                      <h2 className="text-lg font-semibold">{loc.name}</h2>
                      <p className="text-sm text-gray-300 truncate">
                        {loc.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-400">
                        <span>⭐ {loc.rating}</span>
                        <span className="text-emerald-400">{loc.price}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {searched && totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-4">
                  <button
                    onClick={() => handleSearch(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handleSearch(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </main>
          </section>

          <Footer />
        </div>
      </PageShell>
    </main>
  );
}

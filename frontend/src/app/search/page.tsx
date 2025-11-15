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
  blurb?: string;
  price?: string;
  rating?: number;
  img?: string;
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

    if (!API_URL || API_URL === 'undefined') {
      console.error('Backend URL not configured');
      return;
    }

    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `${API_URL}/api/search/locations?q=${encodeURIComponent(searchTerm)}&page=${p}&limit=50`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await res.json();
      if (data.success) {
        setResults(data.data || []);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
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
                    className="relative group flex items-center rounded-2xl border border-gray-800 bg-gray-800/90 transition hover:border-emerald-600 overflow-hidden"
                  >
                    {/* Make the whole card clickable */}
                    <Link
                      href={`/location?id=${encodeURIComponent(loc.id)}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View details for ${loc.name}`}
                    />

                    <div className="h-24 w-36 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={loc.img || 'https://via.placeholder.com/150'}
                        alt={loc.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {/* Subtle gradient for readability */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    <div className="ml-4 mr-4 my-3 flex-1">
                      <h2 className="text-lg font-semibold">{loc.name}</h2>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {loc.blurb || 'No description available.'}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-400">
                        <span>⭐ {loc.rating ?? '—'}</span>
                        <span className="text-emerald-400">{loc.price || '—'}</span>
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

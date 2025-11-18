'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 py-12 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="text-2xl font-extrabold text-emerald-400">OutdoorSpot</div>
            <p className="mt-3 text-neutral-400">Your gateway to North Texas outdoor escapes.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Explore</h4>
            <ul className="mt-3 space-y-2 text-neutral-300">
              <li><Link href="/locations" className="hover:text-white">Locations</Link></li>
              <li><Link href="/reviews" className="hover:text-white">Reviews</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/feedback" className="hover:text-white">Feedback</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Account</h4>
            <ul className="mt-3 space-y-2 text-neutral-300">
              <li><Link href="/auth/login" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/auth/register" className="hover:text-white">Sign Up</Link></li>
              <li><Link href="/favorites" className="hover:text-white">Favorites</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-neutral-900 pt-6 text-center text-neutral-400">
          © {new Date().getFullYear()} OutdoorSpot. Built for CSE3311.
        </div>
      </div>
    </footer>
  );
}

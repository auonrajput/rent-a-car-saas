'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Login ya Sign-up page par Navbar show nahi hoga
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-bold text-blue-500 tracking-wide">
            Rent-a-Car SaaS
          </Link>
          <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700 uppercase font-semibold">
            Owner
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
          <Link href="/cars" className="hover:text-blue-400 transition-colors">
            Cars Inventory
          </Link>
          <Link href="/bookings" className="hover:text-blue-400 transition-colors">
            Bookings
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2 font-medium text-sm">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/cars"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2"
          >
            🚗 Cars Inventory
          </Link>
          <Link
            href="/bookings"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2"
          >
            📜 Manage Bookings
          </Link>
        </div>
      )}
    </nav>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="text-base sm:text-lg font-bold text-blue-400 tracking-wide flex items-center gap-2">
          <span>Rent-a-Car SaaS</span>
          <span className="text-[10px] bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-700 uppercase font-semibold">
            Owner
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden xl:flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <Link href="/cars" className="hover:text-blue-400 transition-colors">Cars</Link>
          <Link href="/bookings" className="hover:text-blue-400 transition-colors">Bookings</Link>
          <Link href="/customers" className="hover:text-blue-400 transition-colors">Customers</Link>
          <Link href="/maintenance" className="hover:text-blue-400 transition-colors">Maintenance</Link>
          <Link href="/subscription" className="hover:text-blue-400 transition-colors">Plans</Link>
          <Link href="/settings" className="hover:text-blue-400 transition-colors">Settings</Link>
        </nav>

        {/* Hamburger Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="xl:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 focus:outline-none cursor-pointer"
          aria-label="Toggle Menu"
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

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="xl:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1.5 text-sm font-medium">
          <Link href="/" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">📊 Dashboard</Link>
          <Link href="/cars" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">🚗 Cars Inventory</Link>
          <Link href="/bookings" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">📜 Bookings & Fleet</Link>
          <Link href="/customers" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">👥 Customers CRM</Link>
          <Link href="/maintenance" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">🛠️ Maintenance Log</Link>
          <Link href="/subscription" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">💳 Subscription Plans</Link>
          <Link href="/settings" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">⚙️ Business Settings</Link>
        </div>
      )}
    </header>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Title */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-bold text-blue-400 tracking-wide">
            Rent-a-Car SaaS
          </Link>
          <span className="text-[10px] bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded border border-blue-700 uppercase font-semibold hidden sm:inline-block">
            Owner
          </span>
        </div>

        {/* Desktop Links - All Core Pages Included */}
        <div className="hidden lg:flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <Link href="/cars" className="hover:text-blue-400 transition-colors">Cars</Link>
          <Link href="/bookings" className="hover:text-blue-400 transition-colors">Bookings</Link>
          <Link href="/customers" className="hover:text-blue-400 transition-colors">Customers</Link>
          <Link href="/maintenance" className="hover:text-blue-400 transition-colors">Maintenance</Link>
          <Link href="/subscription" className="hover:text-blue-400 transition-colors">Plans</Link>
          <Link href="/settings" className="hover:text-blue-400 transition-colors">Settings</Link>
        </div>

        {/* Mobile / Tablet Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 focus:outline-none border border-slate-700 shadow cursor-pointer"
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

      {/* Mobile & Tablet Dropdown Menu with All Pages */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-1.5 text-sm font-medium bg-slate-900 pb-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/cars"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            🚗 Cars Inventory
          </Link>
          <Link
            href="/bookings"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            📜 Bookings & Fleet
          </Link>
          <Link
            href="/customers"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            👥 Customers CRM
          </Link>
          <Link
            href="/maintenance"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            🛠️ Maintenance Log
          </Link>
          <Link
            href="/subscription"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            💳 Subscription Plans
          </Link>
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="py-2 px-3 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2.5"
          >
            ⚙️ Business Settings
          </Link>
        </div>
      )}
    </nav>
  );
}
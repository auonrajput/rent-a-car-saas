'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<string>('admin');
  const router = useRouter();

  useEffect(() => {
    async function fetchUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = user.user_metadata?.role || 'admin';
        setRole(userRole);
      }
    }
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Dynamic Role Badge */}
        <Link href="/" className="text-base sm:text-lg font-bold text-blue-400 tracking-wide flex items-center gap-2">
          <span>Rent-a-Car SaaS</span>
          <span className="text-[10px] bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-700 uppercase font-semibold">
            {role}
          </span>
        </Link>

        {/* Hamburger Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 focus:outline-none cursor-pointer text-xs sm:text-sm font-medium"
          aria-label="Toggle Menu"
        >
          <span>Menu</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Dropdown Menu - Role Filtered Links */}
      {isOpen && (
        <nav className="bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1.5 text-sm font-medium shadow-2xl">
          <Link href="/" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">📊 Dashboard</Link>
          
          {(role === 'admin' || role === 'manager' || role === 'receptionist') && (
            <Link href="/cars" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">🚗 Cars Inventory</Link>
          )}

          <Link href="/bookings" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">📜 Bookings & Fleet</Link>

          {(role === 'admin' || role === 'manager' || role === 'receptionist') && (
            <Link href="/customers" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">👥 Customers CRM</Link>
          )}

          {(role === 'admin' || role === 'manager' || role === 'driver') && (
            <Link href="/maintenance" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">🛠️ Maintenance Log</Link>
          )}

          {(role === 'admin' || role === 'manager') && (
            <Link href="/subscription" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">💳 Subscription Plans</Link>
          )}

          {(role === 'admin' || role === 'manager') && (
            <Link href="/settings" onClick={() => setIsOpen(false)} className="block py-2 px-3 hover:bg-slate-800 rounded-md">⚙️ Business Settings</Link>
          )}
          
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full text-left py-2 px-3 hover:bg-red-900/40 text-red-400 rounded-md transition-colors cursor-pointer flex items-center gap-2"
            >
              🚪 Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
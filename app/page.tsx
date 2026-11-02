'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeBookingsCount: 0,
    totalCars: 0,
    availableCars: 0,
    rentedCars: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'Owner' | 'Manager' | 'Staff'>('Owner');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function fetchDashboardData() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Strict Auth Guard: Redirect unauthenticated users immediately to /login
    if (userError || !user) {
      window.location.href = '/login';
      return;
    }

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (tenantData?.role) {
      setUserRole(tenantData.role as any);
    }

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: carsData } = await supabase
      .from('cars')
      .select('*');

    const bookings = bookingsData || [];
    const cars = carsData || [];

    const totalEarnings = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const totalCars = cars.length;
    const availableCars = cars.filter((c) => c.status === 'available').length;
    const rentedCars = cars.filter((c) => c.status === 'rented').length;

    setStats({
      totalEarnings,
      activeBookingsCount: bookings.length,
      totalCars,
      availableCars,
      rentedCars,
    });

    const enrichedRecent = bookings.slice(0, 5).map((b) => {
      const foundCar = cars.find((c) => c.id === b.car_id);
      return {
        ...b,
        carName: foundCar ? `${foundCar.name} (${foundCar.model})` : 'Car Deleted',
      };
    });

    setRecentBookings(enrichedRecent);
    setLoading(false);
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Enterprise Top Header / Navigation Bar */}
        <header className="bg-gray-800/80 backdrop-blur border border-gray-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-blue-400">
                Royal Rent A Car
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Multi-Tenant Fleet Management System
              </p>
            </div>

            {/* Mobile Hamburger & Role Badge Container */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {userRole}
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-xl text-sm font-medium border border-gray-600 flex items-center justify-center"
                aria-label="Toggle Menu"
              >
                <span className="text-lg">☰</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar / Hamburger Content */}
          <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-t border-gray-700/60 pt-4 ${mobileMenuOpen ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <a
                href="/cars"
                className="bg-gray-700/70 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl transition-all border border-gray-600/50 shadow-sm flex items-center justify-center lg:justify-start gap-1.5"
              >
                🚗 <span>Cars</span>
              </a>
              <a
                href="/bookings"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center lg:justify-start gap-1.5"
              >
                📋 <span>Bookings</span>
              </a>

              {hasPermission(userRole, 'MANAGE_BILLING') && (
                <a
                  href="/subscription"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center lg:justify-start gap-1.5"
                >
                  ⭐ <span>Subscription</span>
                </a>
              )}

              {hasPermission(userRole, 'MANAGE_SETTINGS') && (
                <a
                  href="/settings"
                  className="bg-gray-700/70 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl transition-all border border-gray-600/50 shadow-sm flex items-center justify-center lg:justify-start gap-1.5"
                >
                  ⚙️ <span>Settings</span>
                </a>
              )}
            </div>

            {/* Desktop Right Corner Role Badge */}
            <div className="hidden lg:flex items-center pl-2 border-l border-gray-700/80">
              <div className="bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-inner flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                {userRole}
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
            Loading dashboard analytics...
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Revenue</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-green-400">
                  {stats.totalEarnings.toLocaleString()} <span className="text-xs font-normal text-gray-400">PKR</span>
                </div>
                <p className="text-xs text-gray-500">From all confirmed bookings</p>
              </div>

              <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Bookings</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">{stats.activeBookingsCount}</div>
                <p className="text-xs text-gray-500">Processed rentals recorded</p>
              </div>

              <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Available Fleet</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {stats.availableCars} <span className="text-xs font-normal text-gray-400">/ {stats.totalCars}</span>
                </div>
                <p className="text-xs text-gray-500">Ready for immediate rent</p>
              </div>

              <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Currently Rented</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{stats.rentedCars}</div>
                <p className="text-xs text-gray-500">Cars out on trips</p>
              </div>
            </div>

            {/* Performance Banner */}
            <div className="bg-gradient-to-r from-blue-950/60 via-gray-800 to-gray-800 border border-blue-900/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-blue-300">Fleet Performance & Utilization</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Current fleet utilization rate is{' '}
                  <span className="text-green-400 font-semibold">
                    {stats.totalCars > 0 ? Math.round((stats.rentedCars / stats.totalCars) * 100) : 0}%
                  </span>
                  . Monitor active vehicles and manage scale efficiently.
                </p>
              </div>
              {hasPermission(userRole, 'MANAGE_BILLING') && (
                <a
                  href="/subscription"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition-all whitespace-nowrap"
                >
                  🚀 Upgrade SaaS Plan
                </a>
              )}
            </div>

            {/* Recent Bookings Activity Table */}
            <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-200">Recent Bookings Activity</h2>
                <a href="/bookings" className="text-xs sm:text-sm text-blue-400 hover:underline">
                  View All →
                </a>
              </div>

              {recentBookings.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No recent bookings found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-900/80 text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="p-3 rounded-l-xl">Customer</th>
                        <th className="p-3">Car</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Total Price</th>
                        <th className="p-3 rounded-r-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/60">
                      {recentBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-750/50 transition-colors">
                          <td className="p-3 font-medium text-white">
                            {b.customer_name}
                            <div className="text-xs text-gray-400">{b.customer_phone}</div>
                          </td>
                          <td className="p-3 text-blue-300">{b.carName}</td>
                          <td className="p-3 text-xs text-gray-400">
                            {b.start_date?.replace('T', ' ')} <br /> to {b.end_date?.replace('T', ' ')}
                          </td>
                          <td className="p-3 font-bold text-green-400">{b.total_price} PKR</td>
                          <td className="p-3">
                            <span className="bg-green-900/60 text-green-300 border border-green-700 px-2.5 py-1 text-xs rounded-lg uppercase font-semibold">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
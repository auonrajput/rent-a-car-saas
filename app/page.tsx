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

  async function fetchDashboardData() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
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

  const utilizationRate = stats.totalCars > 0 ? Math.round((stats.rentedCars / stats.totalCars) * 100) : 0;
  const availableRate = stats.totalCars > 0 ? Math.round((stats.availableCars / stats.totalCars) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Clean Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Royal Rent A Car Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-400">Multi-Tenant Fleet Management System & Analytics</p>
          </div>
          <div className="bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-inner flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Role: {userRole}
          </div>
        </div>

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

            {/* Visual Analytics & Fleet Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fleet Utilization Progress Chart */}
              <div className="bg-gray-800 border border-gray-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-blue-300">📊 Fleet Utilization Breakdown</h3>
                  <span className="text-xs bg-gray-900 px-2.5 py-1 rounded text-gray-300 border border-gray-700">
                    Total Fleet: {stats.totalCars} Cars
                  </span>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-400 font-medium">Rented Out ({stats.rentedCars} Cars)</span>
                      <span className="text-amber-400 font-bold">{utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-700 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400 font-medium">Available / Ready ({stats.availableCars} Cars)</span>
                      <span className="text-emerald-400 font-bold">{availableRate}%</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-700 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${availableRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-700/60">
                  Visual metric updates dynamically with fleet status changes.
                </p>
              </div>

              {/* Performance Banner & Quick Action */}
              <div className="bg-gradient-to-r from-blue-950/60 via-gray-800 to-gray-800 border border-blue-900/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-blue-300">🚀 System Performance & Billing</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Your fleet utilization is running at <span className="text-green-400 font-semibold">{utilizationRate}%</span> efficiency. Manage your operations or upgrade enterprise billing tier anytime.
                  </p>
                </div>
                {hasPermission(userRole, 'MANAGE_BILLING') && (
                  <div>
                    <a
                      href="/subscription"
                      className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition-all"
                    >
                      💳 Upgrade SaaS Subscription Plan
                    </a>
                  </div>
                )}
              </div>
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
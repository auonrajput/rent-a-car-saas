'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function BookingHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('admin');

  async function fetchHistoryAndRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const role = user.user_metadata?.role || 'admin';
    setUserRole(role);

    // Fetch tenant-specific completed bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching history:', bookingsError);
    }

    const { data: allCarsData } = await supabase
      .from('cars')
      .select('*')
      .eq('tenant_id', user.id);

    const enrichedHistory = (bookingsData || []).map((b) => {
      const foundCar = allCarsData?.find((c) => c.id === b.car_id);
      return {
        ...b,
        cars: foundCar || { name: 'Car Deleted', currency: 'PKR', daily_rate: 0 }
      };
    });

    setHistory(enrichedHistory);
    setLoading(false);
  }

  useEffect(() => {
    fetchHistoryAndRole();
  }, []);

  const handleDeleteHistory = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this history record?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      alert('Error deleting record: ' + error.message);
    } else {
      await fetchHistoryAndRole();
    }
  };

  const canDeleteRecord = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Booking History & Records</h1>
            <span className="text-xs sm:text-sm text-gray-400">Completed & Past Rental Log</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/bookings"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-gray-700 shadow"
            >
              ← Back to Active Tracking
            </Link>
          </div>
        </div>

        {/* History List */}
        <div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
              <p className="text-gray-300 text-sm">No completed trip history found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.map((b) => (
                <div key={b.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-5 shadow-lg space-y-3 opacity-90">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-300">{b.cars?.name || 'Car Deleted'}</h3>
                      <p className="text-xs sm:text-sm text-gray-400">Customer: <span className="text-white font-medium">{b.customer_name}</span> ({b.customer_phone})</p>
                    </div>
                    <span className="bg-green-900/60 text-green-300 border border-green-700 px-2 py-0.5 text-[10px] sm:text-xs rounded uppercase font-medium shrink-0">
                      Completed
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-900 p-3 rounded border border-gray-700/60">
                    <div>From: <span className="text-white font-medium">{b.start_date?.replace('T', ' ')}</span></div>
                    <div>To: <span className="text-white font-medium">{b.end_date?.replace('T', ' ')}</span></div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700 gap-2">
                    <span className="text-green-400 font-bold text-sm">Total: {b.total_price} {b.cars?.currency || 'PKR'}</span>
                    <div className="flex gap-2">
                      <a
                        href={`/bookings/${b.id}/invoice`}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors border border-gray-600 flex items-center gap-1"
                      >
                        📄 Invoice
                      </a>
                      {canDeleteRecord && (
                        <button
                          onClick={() => handleDeleteHistory(b.id)}
                          className="text-xs bg-red-900/40 hover:bg-red-800 text-red-300 border border-red-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          Delete Record
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
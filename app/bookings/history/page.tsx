'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BookingHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchHistory() {
    // Sirf completed bookings fetch karein
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching history:', bookingsError);
    }

    const { data: allCarsData } = await supabase.from('cars').select('*');

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
    fetchHistory();
  }, []);

  const handleDeleteHistory = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this history record?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      alert('Error deleting record: ' + error.message);
    } else {
      await fetchHistory();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Booking History & Records</h1>
            <span className="text-sm text-gray-400">Tenant: Royal Rent A Car - Completed Trips</span>
          </div>
          <div className="flex gap-3">
            <a
              href="/bookings"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded transition-colors border border-gray-700 shadow"
            >
              ← Back to Active Tracking
            </a>
          </div>
        </div>

        {/* History List */}
        <div>
          {loading ? (
            <p className="text-gray-400">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p className="text-gray-300">No completed trip history found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.map((b) => (
                <div key={b.id} className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-lg space-y-3 opacity-90">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">{b.cars?.name || 'Car Deleted'}</h3>
                      <p className="text-sm text-gray-400">Customer: <span className="text-white font-medium">{b.customer_name}</span> ({b.customer_phone})</p>
                    </div>
                    <span className="bg-green-900/60 text-green-300 border border-green-700 px-2 py-0.5 text-xs rounded uppercase font-medium">
                      Completed
                    </span>
                  </div>

                  <div className="text-sm text-gray-300 grid grid-cols-2 gap-2 bg-gray-900 p-3 rounded">
                    <div>From: <span className="text-white">{b.start_date?.replace('T', ' ')}</span></div>
                    <div>To: <span className="text-white">{b.end_date?.replace('T', ' ')}</span></div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-green-400 font-bold">Total: {b.total_price} {b.cars?.currency || 'PKR'}</span>
                    <div className="flex gap-2">
                      <a
                        href={`/bookings/${b.id}/invoice`}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded transition-colors"
                      >
                        📄 Invoice
                      </a>
                      <button
                        onClick={() => handleDeleteHistory(b.id)}
                        className="text-xs bg-red-900/40 hover:bg-red-800 text-red-300 border border-red-700 px-3 py-1 rounded transition-colors"
                      >
                        Delete Record
                      </button>
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
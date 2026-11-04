'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DriverDashboardPage() {
  const [assignedTrips, setAssignedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverUser, setDriverUser] = useState<any>(null);

  async function fetchDriverTrips() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setDriverUser(user);

    // Fetch active trips assigned to this specific driver
    const { data, error } = await supabase
      .from('bookings')
      .select('*, cars(brand, name, registration_number)')
      .eq('driver_id', user.id)
      .eq('driver_type', 'in_house')
      .eq('status', 'confirmed');

    if (error) {
      console.error('Error fetching driver trips:', error);
    } else {
      setAssignedTrips(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDriverTrips();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">Driver Portal & Assigned Trips</h1>
            <p className="text-xs text-gray-400">Welcome back, Staff Driver ({driverUser?.email || 'Driver'})</p>
          </div>
          <button
            onClick={fetchDriverTrips}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            🔄 Refresh Trips
          </button>
        </div>

        {/* Trips List */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading your assigned trips...</p>
        ) : assignedTrips.length === 0 ? (
          <div className="bg-gray-800/60 border border-gray-700/80 rounded-xl p-8 text-center space-y-2">
            <span className="text-3xl">🚗</span>
            <h3 className="text-base font-semibold text-gray-200">No Active Trips Assigned</h3>
            <p className="text-xs text-gray-400">You currently have no ongoing in-house driving assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignedTrips.map((trip) => (
              <div key={trip.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-blue-300">
                      {trip.cars?.brand} {trip.cars?.name}
                    </h3>
                    <p className="text-xs font-mono text-amber-300">
                      Registration: {trip.cars?.registration_number}
                    </p>
                  </div>
                  <span className="bg-purple-950 text-purple-300 border border-purple-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                    In-House Assignment
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-900 p-3 rounded-lg border border-gray-800">
                  <p className="text-gray-300">Customer: <span className="text-white font-medium">{trip.customer_name}</span></p>
                  <p className="text-gray-300">Phone: <span className="text-white font-medium">{trip.customer_phone}</span></p>
                  <p className="text-gray-300">Start: <span className="text-white font-medium">{new Date(trip.start_date).toLocaleString()}</span></p>
                  <p className="text-gray-300">End: <span className="text-white font-medium">{new Date(trip.end_date).toLocaleString()}</span></p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-700/60">
                  <a
                    href={`tel:${trip.customer_phone}`}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
                  >
                    📞 Call Customer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
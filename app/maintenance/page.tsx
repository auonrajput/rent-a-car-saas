'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [carId, setCarId] = useState('');
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch tenant's cars for drop-down selection
    const { data: carsData } = await supabase
      .from('cars')
      .select('id, name, registration_number')
      .eq('tenant_id', user.id);

    setCars(carsData || []);

    // Fetch maintenance records
    const { data: maintenanceData, error } = await supabase
      .from('maintenance')
      .select('*, cars(name, registration_number)')
      .eq('tenant_id', user.id)
      .order('maintenance_date', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance records:', error);
    } else {
      setMaintenanceRecords(maintenanceData || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('maintenance').insert([
      {
        tenant_id: user.id,
        car_id: carId,
        title,
        cost: parseFloat(cost),
        maintenance_date: maintenanceDate,
        next_due_date: nextDueDate || null,
        notes,
      },
    ]);

    if (error) {
      setMessage('❌ Error saving record: ' + error.message);
    } else {
      setMessage('✅ Maintenance log saved successfully!');
      setCarId('');
      setTitle('');
      setCost('');
      setMaintenanceDate('');
      setNextDueDate('');
      setNotes('');
      setShowModal(false);
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading maintenance records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header Section - Responsive Flex-Wrap */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Car Maintenance Tracker</h1>
            <span className="text-xs sm:text-sm text-gray-400">
              Log oil changes, repairs, inspections, and renewal schedules
            </span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded transition-colors shadow cursor-pointer"
            >
              🛠️ Log Service
            </button>
            <a
              href="/"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium px-4 py-2 rounded transition-colors border border-gray-700 shadow"
            >
              🏠 Dashboard
            </a>
          </div>
        </div>

        {message && (
          <div className="p-3 sm:p-4 rounded bg-blue-900/40 border border-blue-700 text-xs sm:text-sm text-blue-300 text-center">
            {message}
          </div>
        )}

        {/* Maintenance Table - Scrollable on mobile */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-xs sm:text-sm">
                <th className="p-3 sm:p-4">Car</th>
                <th className="p-3 sm:p-4">Service Type</th>
                <th className="p-3 sm:p-4">Cost</th>
                <th className="p-3 sm:p-4">Service Date</th>
                <th className="p-3 sm:p-4">Next Due Date</th>
                <th className="p-3 sm:p-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-xs sm:text-sm">
              {maintenanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No maintenance records logged yet. Click &quot;Log Service&quot; to add one.
                  </td>
                </tr>
              ) : (
                maintenanceRecords.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="p-3 sm:p-4 font-semibold text-white">
                      {m.cars?.name} ({m.cars?.registration_number})
                    </td>
                    <td className="p-3 sm:p-4 text-gray-300">{m.title}</td>
                    <td className="p-3 sm:p-4 font-bold text-green-400">{m.cost} PKR</td>
                    <td className="p-3 sm:p-4 text-gray-300">{m.maintenance_date}</td>
                    <td className="p-3 sm:p-4 text-amber-300 font-medium">
                      {m.next_due_date || 'N/A'}
                    </td>
                    <td className="p-3 sm:p-4 text-gray-400 text-xs">{m.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Maintenance Modal - Fully Responsive & Scrollable */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 max-w-md w-full space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold text-white border-b border-gray-700 pb-3">Log Vehicle Maintenance</h2>
              <form onSubmit={handleAddMaintenance} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Select Car</label>
                  <select
                    required
                    value={carId}
                    onChange={(e) => setCarId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm cursor-pointer"
                  >
                    <option value="">-- Select Vehicle --</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.name} ({car.registration_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Service Title / Work Done</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm"
                    placeholder="e.g. Engine Oil & Filter Change"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cost (PKR)</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Service Date</label>
                    <input
                      type="date"
                      required
                      value={maintenanceDate}
                      onChange={(e) => setMaintenanceDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Next Due Date</label>
                    <input
                      type="date"
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Notes / Workshop Details</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm h-20"
                    placeholder="Optional notes or remarks..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs sm:text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-xs sm:text-sm font-semibold cursor-pointer shadow"
                  >
                    Save Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MaintenancePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>('admin');
  
  const [formData, setFormData] = useState({
    car_id: '',
    category: 'Oil Change',
    cost: '',
    maintenance_date: '',
    notes: '',
  });

  useEffect(() => {
    // Set default date on client mount to avoid prerender instability
    setFormData((prev) => ({
      ...prev,
      maintenance_date: new Date().toISOString().split('T')[0],
    }));
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const role = user.user_metadata?.role || 'admin';
    setUserRole(role);

    const { data: logsData, error: logsError } = await supabase
      .from('maintenance')
      .select('*')
      .eq('tenant_id', user.id)
      .order('maintenance_date', { ascending: false });

    if (logsError) {
      console.error('Error fetching maintenance logs:', logsError);
    }

    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('tenant_id', user.id);

    if (carsError) {
      console.error('Error fetching cars:', carsError);
    }

    const enrichedLogs = (logsData || []).map((log) => {
      const foundCar = carsData?.find((c) => c.id === log.car_id);
      return {
        ...log,
        cars: foundCar || { brand: '', name: 'Car Deleted', registration_number: 'N/A' }
      };
    });

    setLogs(enrichedLogs);
    setCars(carsData || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.car_id) {
      alert('Please select a car');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSubmitting(true);

    const { error } = await supabase.from('maintenance').insert([
      {
        tenant_id: user.id,
        car_id: formData.car_id,
        category: formData.category,
        cost: Number(formData.cost) || 0,
        maintenance_date: formData.maintenance_date,
        notes: formData.notes,
      }
    ]);

    if (error) {
      alert('Error adding maintenance record: ' + error.message);
    } else {
      setFormData({
        car_id: '',
        category: 'Oil Change',
        cost: '',
        maintenance_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await fetchData();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    if (error) {
      alert('Error deleting record: ' + error.message);
    } else {
      await fetchData();
    }
  };

  const canManage = userRole === 'admin' || userRole === 'manager' || userRole === 'driver';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Fleet Maintenance & Expense Log</h1>
            <p className="text-xs sm:text-sm text-gray-400">Track oil changes, fuel logs, engine tuning, and workshop repairs</p>
          </div>
          <Link
            href="/"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-700 shadow"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {canManage && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Add Maintenance / Expense Record</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Select Car</label>
                <select
                  value={formData.car_id}
                  onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Car --</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.name} [{car.registration_number}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Maintenance Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Oil Change">🛢️ Oil Change</option>
                  <option value="Fuel Log">⛽ Fuel / Petrol Log</option>
                  <option value="Engine Tuning">⚙️ Engine Tuning & Servicing</option>
                  <option value="General Repair">🔧 General Repairs & Parts</option>
                  <option value="Other Expense">📌 Other Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Cost / Expense (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3500"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.maintenance_date}
                  onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark] cursor-pointer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Workshop / Remarks / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Shell Helix 20W-50 at Bilal Workshop"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2.5 rounded transition-colors disabled:opacity-50 cursor-pointer shadow text-sm"
                >
                  {submitting ? 'Saving Record...' : 'Add Maintenance Log'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Maintenance & Expense History ({logs.length})</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading maintenance records...</p>
          ) : logs.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
              <p className="text-gray-300 text-sm">No maintenance or expense logs found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {logs.map((log) => (
                <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-blue-300">
                        {log.cars?.brand} {log.cars?.name} <span className="font-mono text-amber-300 text-xs">({log.cars?.registration_number})</span>
                      </h3>
                      <span className="inline-block mt-1 bg-gray-900 text-gray-300 border border-gray-700 px-2.5 py-0.5 text-xs rounded font-semibold">
                        {log.category}
                      </span>
                    </div>
                    <span className="text-green-400 font-bold text-base">
                      {log.cost} PKR
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 space-y-1 bg-gray-900 p-3 rounded border border-gray-700/60">
                    <p>Date: <span className="text-white font-medium">{log.maintenance_date}</span></p>
                    {log.notes && <p>Remarks: <span className="text-white font-medium">{log.notes}</span></p>}
                  </div>

                  {(userRole === 'admin' || userRole === 'manager') && (
                    <div className="flex justify-end pt-2 border-t border-gray-700">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-xs bg-red-900/40 hover:bg-red-800 text-red-300 border border-red-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
                      >
                        Delete Record
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Brands aur unke models ki database dictionary
const brandModelsMap: { [key: string]: string[] } = {
  toyota: ['Corolla', 'Yaris', 'Camry', 'Fortuner', 'Hilux', 'Land Cruiser', 'Prius'],
  honda: ['Civic', 'City', 'BR-V', 'HR-V', 'Accord', 'Vezel'],
  suzuki: ['Alto', 'Wagon R', 'Cultus', 'Swift', 'Bolan', 'Jimny'],
  kia: ['Sportage', 'Picanto', 'Sorento', 'Carnival'],
  hyundai: ['Elantra', 'Sonata', 'Tucson', 'Porter'],
  changan: ['Alsvin', 'Oshan X7', 'Sherpa'],
  mg: ['HS', 'ZS', 'MG4'],
  audi: ['A3', 'A5', 'A6', 'Q5', 'E-Tron'],
};

export default function CarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [maxRate, setMaxRate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    model: '2026',
    category: 'Sedan',
    registration_number: '',
    color: '',
    daily_rate: '',
    status: 'available',
  });

  async function fetchCars() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setTenantId(user.id);

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
    } else {
      setCars(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCars();
  }, []);

  // Auto-format Registration Number: e.g. LEB-1234
  const handleRegNumberChange = (val: string) => {
    let cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length > 3 && !cleaned.includes('-')) {
      const letters = cleaned.replace(/[0-9]/g, '');
      const numbers = cleaned.replace(/[^0-9]/g, '');
      if (letters.length > 0 && numbers.length > 0) {
        cleaned = `${letters}-${numbers}`;
      }
    }
    setFormData({ ...formData, registration_number: cleaned });
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      alert('User not authenticated');
      return;
    }

    setSubmitting(true);

    // Auto category detection based on car name
    let cat = 'Sedan';
    const lower = formData.name.toLowerCase();
    if (lower.includes('sportage') || lower.includes('tuscon') || lower.includes('fortuner') || lower.includes('hs') || lower.includes('hr-v') || lower.includes('sorento') || lower.includes('suv')) {
      cat = 'SUV';
    } else if (lower.includes('alto') || lower.includes('wagon r') || lower.includes('cultus') || lower.includes('swift') || lower.includes('picanto') || lower.includes('vitz')) {
      cat = 'Hatchback';
    }

    const { error } = await supabase.from('cars').insert([
      {
        tenant_id: tenantId,
        brand: formData.brand,
        name: formData.name,
        model: formData.model,
        category: cat,
        registration_number: formData.registration_number,
        color: formData.color,
        daily_rate: Number(formData.daily_rate),
        currency: 'PKR',
        status: formData.status,
      },
    ]);

    if (error) {
      alert('Error adding vehicle: ' + error.message);
    } else {
      setFormData({
        brand: '',
        name: '',
        model: '2026',
        category: 'Sedan',
        registration_number: '',
        color: '',
        daily_rate: '',
        status: 'available',
      });
      await fetchCars();
    }
    setSubmitting(false);
  };

  const handleDeleteCar = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vehicle from fleet?')) return;

    const { error } = await supabase.from('cars').delete().eq('id', id);

    if (error) {
      alert('Error deleting vehicle: ' + error.message);
    } else {
      await fetchCars();
    }
  };

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      (car.brand && car.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.name && car.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.registration_number && car.registration_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || car.category === filterCategory;
    const matchesRate = maxRate === '' || Number(car.daily_rate) <= Number(maxRate);

    return matchesSearch && matchesCategory && matchesRate;
  });

  // Check if typed brand has predefined models in our map
  const typedBrandLower = formData.brand.trim().toLowerCase();
  const matchedModels = brandModelsMap[typedBrandLower] || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Clean Header - Navigation handled by global Navbar */}
        <div className="border-b border-gray-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Car Inventory Management</h1>
          <p className="text-xs sm:text-sm text-gray-400">Smart Dynamic Brand & Model Auto-Suggestions</p>
        </div>

        {/* Add New Vehicle Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Add New Vehicle to Fleet</h2>
          <form onSubmit={handleAddCar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Car Brand</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota, Honda"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Car Name / Model Series {matchedModels.length > 0 && <span className="text-green-400 font-bold">(Suggested)</span>}
                </label>
                {matchedModels.length > 0 ? (
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
                  >
                    <option value="">-- Select Model --</option>
                    {matchedModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corolla, Civic, Alto"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Registration / Number Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LEB-1234"
                  value={formData.registration_number}
                  onChange={(e) => handleRegNumberChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Color</label>
                <input
                  type="text"
                  placeholder="e.g. White, Black"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Model Year</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
                >
                  {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Daily Rate (PKR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2.5 rounded transition-colors disabled:opacity-50 cursor-pointer shadow text-sm"
            >
              {submitting ? 'Adding Vehicle...' : '+ Add Vehicle to Fleet'}
            </button>
          </form>
        </div>

        {/* Fleet List Display */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">
            Current Fleet Vehicles ({filteredCars.length})
          </h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading fleet inventory...</p>
          ) : filteredCars.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center text-gray-400 text-sm">
              No vehicles found in fleet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-5 shadow-lg space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-blue-300">
                          {car.brand} {car.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Model: <span className="text-white font-medium">{car.model}</span> | {car.category}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] sm:text-xs rounded uppercase font-bold border shrink-0 ${
                          car.status === 'available'
                            ? 'bg-green-900/60 text-green-300 border-green-700'
                            : 'bg-amber-900/60 text-amber-300 border-amber-700'
                        }`}
                      >
                        {car.status}
                      </span>
                    </div>

                    <div className="bg-gray-900/80 p-2.5 rounded border border-gray-700/60 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reg Plate:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {car.registration_number || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Color:</span>
                        <span className="text-white font-medium">{car.color || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700 gap-2">
                    <span className="text-green-400 font-bold text-sm">
                      {car.daily_rate} PKR / day
                    </span>
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer font-medium shadow"
                    >
                      Delete
                    </button>
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
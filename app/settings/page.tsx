'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee (PKR)' },
  { code: 'USD', name: 'US Dollar (USD)' },
  { code: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'EUR', name: 'Euro (EUR)' },
  { code: 'GBP', name: 'British Pound (GBP)' },
];

export default function TenantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [tenantId, setTenantId] = useState('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'); // Fallback demo tenant ID
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currency: 'PKR',
  });

  async function fetchTenantSettings() {
    // Supabase se tenant settings fetch karein
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching tenant:', error);
    } else if (data) {
      setTenantId(data.id);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        currency: data.currency || 'PKR',
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('tenants')
      .update({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        currency: formData.currency,
      })
      .eq('id', tenantId);

    if (error) {
      setMessage('Error updating settings: ' + error.message);
    } else {
      setMessage('Business settings updated successfully!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header Section - Responsive Flex-Wrap */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Business Settings & Profile</h1>
            <span className="text-xs sm:text-sm text-gray-400">Manage your rental agency details and preferences</span>
          </div>
          <div className="w-full sm:w-auto">
            <a
              href="/"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs sm:text-sm font-medium px-4 py-2 rounded transition-colors border border-gray-700 shadow inline-block text-center w-full sm:w-auto"
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

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8 shadow-xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Agency / Business Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="e.g. Royal Rent A Car"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Contact Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="e.g. +92 300 1234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Default Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Business Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="e.g. Main Boulevard, Lahore, Pakistan"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow disabled:opacity-50 text-sm cursor-pointer"
              >
                {saving ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
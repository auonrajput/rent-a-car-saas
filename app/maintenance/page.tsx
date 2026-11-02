'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setEmail(user.email || '');

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setTenantName(data.name || '');
      setPhone(data.phone || '');
      setAddress(data.address || '');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('tenants')
      .upsert({
        id: user.id,
        name: tenantName,
        phone: phone,
        address: address,
        updated_at: new Date(),
      });

    if (error) {
      setMessage('❌ Error updating settings: ' + error.message);
    } else {
      setMessage('✅ Business settings updated successfully!');
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
        
        {/* Clean Header - Navigation handled by global Navbar */}
        <div className="border-b border-gray-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Business Settings</h1>
          <p className="text-xs sm:text-sm text-gray-400">Manage your rental company profile and invoice details</p>
        </div>

        {message && (
          <div className="p-3 sm:p-4 rounded bg-blue-900/40 border border-blue-700 text-xs sm:text-sm text-blue-300 text-center">
            {message}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Company / Rent-a-Car Name</label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Royal Rent A Car"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Owner Account Email (Read-only)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-gray-900/50 border border-gray-800 rounded p-2.5 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Business Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. 0300-9876543"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Business Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Main Boulevard, Gulberg III, Lahore"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded transition-colors disabled:opacity-50 cursor-pointer shadow text-sm"
              >
                {saving ? 'Saving Changes...' : 'Save Business Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
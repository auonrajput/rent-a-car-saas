'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [message, setMessage] = useState('');

  async function fetchCustomers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('customers').insert([
      {
        tenant_id: user.id,
        full_name: fullName,
        phone,
        cnic,
        license_number: licenseNumber,
        is_blacklisted: false,
      },
    ]);

    if (error) {
      setMessage('❌ Error adding customer: ' + error.message);
    } else {
      setMessage('✅ Customer added successfully!');
      setFullName('');
      setPhone('');
      setCnic('');
      setLicenseNumber('');
      setShowModal(false);
      fetchCustomers();
    }
  };

  const toggleBlacklist = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('customers')
      .update({ is_blacklisted: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchCustomers();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Customer Management & CRM</h1>
            <span className="text-sm text-gray-400">Manage renters, track history, and control blacklist</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded transition-colors shadow cursor-pointer"
            >
              ➕ Add Customer
            </button>
            <a
              href="/"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded transition-colors border border-gray-700 shadow"
            >
              🏠 Dashboard
            </a>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded bg-blue-900/40 border border-blue-700 text-sm text-blue-300 text-center">
            {message}
          </div>
        )}

        {/* Customers Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-sm">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">CNIC</th>
                <th className="p-4">License No</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No customers found. Click "Add Customer" to register one.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-semibold text-white">{c.full_name}</td>
                    <td className="p-4 text-gray-300">{c.phone}</td>
                    <td className="p-4 text-gray-300">{c.cnic}</td>
                    <td className="p-4 text-gray-300">{c.license_number}</td>
                    <td className="p-4">
                      {c.is_blacklisted ? (
                        <span className="px-2.5 py-1 bg-red-900/60 text-red-300 border border-red-700 text-xs rounded-full font-bold">
                          Blacklisted 🚫
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-green-900/60 text-green-300 border border-green-700 text-xs rounded-full font-bold">
                          Active ✅
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleBlacklist(c.id, c.is_blacklisted)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                          c.is_blacklisted
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        {c.is_blacklisted ? 'Unblock' : 'Blacklist'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white">Register New Customer</h2>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm"
                    placeholder="e.g. Ali Khan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm"
                    placeholder="0300-1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CNIC Number</label>
                  <input
                    type="text"
                    required
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm"
                    placeholder="42101-1234567-1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Driving License Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm"
                    placeholder="DL-987654"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-semibold cursor-pointer"
                  >
                    Save Customer
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
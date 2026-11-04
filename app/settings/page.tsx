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

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'receptionist' | 'driver';
  created_at?: string;
}

export default function TenantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Current User Role state
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  
  const [tenantId, setTenantId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currency: 'PKR',
  });

  // Team Member Form State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'receptionist' as 'manager' | 'receptionist' | 'driver',
  });

  async function fetchTenantSettingsAndTeam() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const role = user.user_metadata?.role || 'admin';
    setCurrentUserRole(role);
    setTenantId(user.id);

    // Fetch tenant settings
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tenant:', error);
    } else if (data) {
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        currency: data.currency || 'PKR',
      });
    }

    // Fetch Team Members list where tenant_id matches current user
    const { data: teamData, error: teamError } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', user.id);

    if (teamError) {
      console.error('Error fetching team members:', teamError.message);
    } else if (teamData) {
      setTeamMembers(teamData);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchTenantSettingsAndTeam();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('tenants')
      .upsert({
        id: tenantId,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        currency: formData.currency,
      });

    if (error) {
      setMessage('Error updating settings: ' + error.message);
    } else {
      setMessage('Business settings updated successfully!');
    }
    setSaving(false);
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    setMemberMessage('');

    // 1. Password validation
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(memberForm.password)) {
      setMemberMessage('Password must contain letters, numbers, and special characters!');
      setAddingMember(false);
      return;
    }

    try {
      // Call secure admin API route to create user in Auth and Profiles simultaneously
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: memberForm.email,
          password: memberForm.password,
          full_name: memberForm.fullName,
          role: memberForm.role,
          tenant_id: tenantId,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        setMemberMessage('Error creating member: ' + resData.error);
      } else {
        setMemberMessage(`Success! ${memberForm.role.toUpperCase()} account created successfully.`);
        setMemberForm({ fullName: '', email: '', password: '', role: 'receptionist' });
        fetchTenantSettingsAndTeam();
      }
    } catch (err: any) {
      setMemberMessage('Network error: ' + err.message);
    }

    setAddingMember(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  // Restrict Team Management visibility (Only Admin and Manager)
  const canManageTeam = currentUserRole === 'admin' || currentUserRole === 'manager';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
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

        {/* General Business Settings */}
        {canManageTeam && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Agency Details</h2>
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
        )}

        {/* TEAM MANAGEMENT SECTION */}
        {canManageTeam && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-gray-700 pb-3">
              <h2 className="text-lg font-semibold text-gray-200">👥 Team Management & Staff Roles</h2>
              <p className="text-xs text-gray-400">Create accounts for managers, receptionists, and drivers with explicit credential access.</p>
            </div>

            {memberMessage && (
              <div className="p-3 rounded bg-blue-900/40 border border-blue-700 text-xs sm:text-sm text-blue-300 text-center">
                {memberMessage}
              </div>
            )}

            {/* Add Team Member Form */}
            <form onSubmit={handleAddTeamMember} className="space-y-4 bg-gray-900/60 p-4 rounded-xl border border-gray-700/80">
              <h3 className="text-sm font-medium text-blue-300">Add New Team Member</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali Hassan"
                    value={memberForm.fullName}
                    onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@agency.com"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Assign Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={memberForm.password}
                      onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 pr-10 text-white focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs"
                    >
                      {showPassword ? '👁️‍🗨️' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role Permission</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
                  >
                    <option value="receptionist">Receptionist (Bookings & CRM)</option>
                    <option value="manager">Manager (Full Operational Access)</option>
                    <option value="driver">Driver (Trips & Maintenance)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={addingMember}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2.5 rounded-lg transition-colors text-sm shadow cursor-pointer disabled:opacity-50"
              >
                {addingMember ? 'Creating Account...' : '+ Add Team Member Account'}
              </button>
            </form>

            {/* Existing Team Members List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-gray-300">Existing Team Accounts ({teamMembers.length})</h3>
              {teamMembers.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No secondary team members added yet.</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="bg-gray-900/80 border border-gray-700/70 p-3 rounded-lg flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <p className="font-semibold text-gray-200">{member.full_name}</p>
                        <p className="text-gray-400 text-xs">{member.email}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                        member.role === 'manager' 
                          ? 'bg-purple-900/50 text-purple-300 border-purple-700' 
                          : member.role === 'receptionist'
                          ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                          : 'bg-amber-900/50 text-amber-300 border-amber-700'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
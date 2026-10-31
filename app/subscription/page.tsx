'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function SubscriptionContent() {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const searchParams = useSearchParams();

  async function fetchTenantData() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant:', error);
    } else if (data) {
      setTenant(data);
    } else {
      const { data: newTenant } = await supabase
        .from('tenants')
        .insert([{ 
          id: user.id, 
          name: 'My Agency', 
          slug: `agency-${user.id.slice(0, 6)}`, 
          subscription_plan: 'Basic', 
          role: 'Owner' 
        }])
        .select()
        .single();
      
      if (newTenant) {
        setTenant(newTenant);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      await fetchTenantData();

      // Handle Return from Stripe Checkout / Mock Simulation
      if (searchParams.get('success') === 'true') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setMessage('🎉 Payment successful! Updating your plan to Pro...');
          const { error } = await supabase
            .from('tenants')
            .update({ subscription_plan: 'Pro' })
            .eq('id', user.id);

          if (!error) {
            setMessage('🎉 Successfully upgraded to Pro Plan!');
            await fetchTenantData();
          } else {
            setMessage('❌ Error updating plan: ' + error.message);
          }
        }
      } else if (searchParams.get('canceled') === 'true') {
        setMessage('⚠️ Payment was canceled. Your plan remains unchanged.');
      }
    }
    init();
  }, [searchParams]);

  const handleSelectPlan = async (planName: string) => {
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage('⚠️ Error: No active user session found.');
      return;
    }

    if (planName === 'Basic') {
      const { error } = await supabase
        .from('tenants')
        .update({ subscription_plan: 'Basic' })
        .eq('id', user.id);

      if (!error) {
        setMessage('Switched to Basic Plan.');
        await fetchTenantData();
      } else {
        setMessage('❌ Error: ' + error.message);
      }
      return;
    }

    // Trigger Stripe Checkout Session / Simulation for Pro Plan
    try {
      setUpgrading(true);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user.id,
          planName: 'Pro',
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe / Simulation URL
      } else {
        setMessage('❌ Failed to create checkout session: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Subscription & Pricing Tiers</h1>
            <span className="text-sm text-gray-400">Choose the best plan for your rental agency</span>
          </div>
          <div>
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

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Current Active Plan</h2>
            <p className="text-sm text-gray-400">Agency: <span className="text-white font-medium">{tenant?.name || 'My Agency'}</span></p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-blue-900/60 text-blue-300 border border-blue-700 text-sm rounded-full uppercase font-bold tracking-wider">
              {tenant?.subscription_plan || 'Basic'} Plan
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Basic Plan */}
          <div className={`bg-gray-800 border rounded-2xl p-8 shadow-xl flex flex-col justify-between space-y-6 ${tenant?.subscription_plan === 'Basic' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700'}`}>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-100">Basic Plan</h3>
              <p className="text-sm text-gray-400">Ideal for small independent car rental agencies getting started.</p>
              <div className="text-3xl font-extrabold text-blue-400">
                Free <span className="text-xs font-normal text-gray-400">/ forever</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-300 pt-4 border-t border-gray-700">
                <li className="flex items-center gap-2">✅ Up to 15 Cars Inventory</li>
                <li className="flex items-center gap-2">✅ Active Fleet Tracking</li>
                <li className="flex items-center gap-2">✅ PDF Invoices Generation</li>
                <li className="flex items-center gap-2 text-gray-500">❌ Advanced Analytics Reports</li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('Basic')}
              disabled={tenant?.subscription_plan === 'Basic' || upgrading}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {tenant?.subscription_plan === 'Basic' ? 'Current Plan' : 'Select Basic'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`bg-gray-800 border rounded-2xl p-8 shadow-xl flex flex-col justify-between space-y-6 ${tenant?.subscription_plan === 'Pro' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-600/50'}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-300">Pro Plan</h3>
                <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">Popular</span>
              </div>
              <p className="text-sm text-gray-400">For scaling rental businesses needing advanced management.</p>
              <div className="text-3xl font-extrabold text-blue-400">
                5,000 PKR <span className="text-xs font-normal text-gray-400">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-300 pt-4 border-t border-gray-700">
                <li className="flex items-center gap-2">✅ Unlimited Cars Inventory</li>
                <li className="flex items-center gap-2">✅ Active Fleet & History Tracking</li>
                <li className="flex items-center gap-2">✅ Custom PDF Invoices & Branding</li>
                <li className="flex items-center gap-2">✅ Priority Support & Analytics</li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('Pro')}
              disabled={tenant?.subscription_plan === 'Pro' || upgrading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {upgrading ? 'Connecting...' : tenant?.subscription_plan === 'Pro' ? 'Current Plan' : 'Upgrade via Stripe 💳'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading subscription...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
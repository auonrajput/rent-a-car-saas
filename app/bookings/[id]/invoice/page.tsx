'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function InvoiceContent() {
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [car, setCar] = useState<any>(null);

  useEffect(() => {
    async function fetchInvoiceData() {
      if (!id) return;

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      setBooking(bookingData);

      if (bookingData) {
        if (bookingData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', bookingData.tenant_id)
            .single();
          setTenant(tenantData);
        }

        const { data: carData } = await supabase
          .from('cars')
          .select('*')
          .eq('id', bookingData.car_id)
          .single();
        setCar(carData);
      }

      setLoading(false);
    }

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading invoice...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-6">
        <div className="flex justify-between border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-xl font-bold text-blue-400">{tenant?.business_name || 'Royal Rent A Car'}</h1>
            <p className="text-xs text-gray-400">Rental Invoice / Receipt</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Booking ID: {booking.id.slice(0, 8)}</p>
            <p className="text-xs text-gray-400">Status: <span className="text-green-400 uppercase">{booking.status}</span></p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="text-gray-400">Customer Name:</span> {booking.customer_name}</p>
          <p><span className="text-gray-400">Phone:</span> {booking.customer_phone}</p>
          <p><span className="text-gray-400">CNIC:</span> {booking.customer_cnic || 'Not Provided'}</p>
          <p><span className="text-gray-400">Vehicle:</span> {car?.name} ({car?.registration_no || car?.model})</p>
          <p><span className="text-gray-400">Period:</span> {booking.start_date?.replace('T', ' ')} to {booking.end_date?.replace('T', ' ')}</p>
        </div>

        <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
          <span className="text-gray-400">Total Amount Paid:</span>
          <span className="text-xl font-bold text-green-400">{booking.total_price} PKR</span>
        </div>

        <button 
          onClick={() => window.print()} 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
        >
          🖨️ Print / Save Invoice
        </button>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><p>Loading...</p></div>}>
      <InvoiceContent />
    </Suspense>
  );
}
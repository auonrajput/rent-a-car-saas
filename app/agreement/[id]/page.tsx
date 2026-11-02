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
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', bookingData.tenant_id)
          .single();
        setTenant(tenantData);

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
        <p className="text-gray-400 text-sm">Loading invoice...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400 text-sm">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-gray-800 border border-gray-700 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header - Responsive Layout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-700 pb-4 gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-blue-400">{tenant?.business_name || 'Car Rental'}</h1>
            <p className="text-xs text-gray-400">Rental Invoice / Receipt</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm font-semibold">Booking ID: {booking.id.slice(0, 8)}</p>
            <p className="text-xs text-gray-400">Status: <span className="text-green-400 uppercase font-medium">{booking.status}</span></p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 text-xs sm:text-sm bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
          <p><span className="text-gray-400">Customer Name:</span> <span className="text-white font-medium">{booking.customer_name}</span></p>
          <p><span className="text-gray-400">Phone:</span> <span className="text-white font-medium">{booking.customer_phone}</span></p>
          <p><span className="text-gray-400">CNIC:</span> <span className="text-white font-medium">{booking.customer_cnic || booking.cnic || 'Not Provided'}</span></p>
          <p><span className="text-gray-400">Vehicle:</span> <span className="text-white font-medium">{car?.brand} {car?.name} ({car?.registration_number || 'N/A'})</span></p>
          <p><span className="text-gray-400">Period:</span> <span className="text-white font-medium">{booking.start_date} to {booking.end_date}</span></p>
        </div>

        {/* Total Amount */}
        <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
          <span className="text-gray-400 text-sm sm:text-base">Total Amount Paid:</span>
          <span className="text-lg sm:text-xl font-bold text-green-400">{booking.total_price} PKR</span>
        </div>

        {/* Print Button */}
        <button 
          onClick={() => window.print()} 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow"
        >
          🖨️ Print / Save Invoice
        </button>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><p className="text-sm">Loading...</p></div>}>
      <InvoiceContent />
    </Suspense>
  );
}
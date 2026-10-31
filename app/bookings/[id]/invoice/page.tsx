'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InvoicePage() {
  const params = useParams();
  const id = params.id;
  const [booking, setBooking] = useState<any>(null);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchInvoiceData() {
      // 1. Fetch specific booking
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (bError) {
        console.error('Error fetching booking:', bError);
      } else if (bData) {
        setBooking(bData);
        // 2. Fetch associated car
        const { data: cData } = await supabase
          .from('cars')
          .select('*')
          .eq('id', bData.car_id)
          .single();
        if (cData) setCar(cData);
      }
      setLoading(false);
    }
    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">Loading invoice...</div>;
  }

  if (!booking) {
    return <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">Booking not found.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 print:bg-white print:text-black">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Actions Header (Hidden when printing) */}
        <div className="flex justify-between items-center print:hidden">
          <a
            href="/bookings"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded transition-colors border border-gray-700 shadow"
          >
            ← Back to Bookings
          </a>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded transition-colors shadow cursor-pointer"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-gray-800 border border-gray-700 print:border-none rounded-xl p-8 shadow-2xl space-y-6 print:bg-white print:text-black">
          {/* Company & Invoice Header */}
          <div className="flex justify-between items-start border-b border-gray-700 print:border-gray-300 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-blue-400 print:text-blue-600">Royal Rent A Car</h1>
              <p className="text-sm text-gray-400 print:text-gray-600">Multi-Tenant Fleet Management System</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-200 print:text-gray-800">INVOICE</h2>
              <p className="text-xs text-gray-400 print:text-gray-600">Booking ID: {booking.id.slice(0, 8)}</p>
              <p className="text-xs text-gray-400 print:text-gray-600">Date: {new Date(booking.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer & Car Info Grid */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-400 print:text-gray-600 uppercase text-xs tracking-wider">Customer Details</h3>
              <p className="text-lg font-bold text-white print:text-black">{booking.customer_name}</p>
              <p className="text-gray-300 print:text-gray-700">Phone: {booking.customer_phone}</p>
            </div>
            <div className="space-y-1 text-right">
              <h3 className="font-semibold text-gray-400 print:text-gray-600 uppercase text-xs tracking-wider">Vehicle Rented</h3>
              <p className="text-lg font-bold text-white print:text-black">
                {car ? `${car.name} (${car.model})` : 'Car Record Removed'}
              </p>
              <p className="text-gray-300 print:text-gray-700">Category: {car?.category || 'N/A'}</p>
            </div>
          </div>

          {/* Rental Duration & Pricing Table */}
          <div className="border border-gray-700 print:border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 print:bg-gray-100 text-gray-400 print:text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-3">Rental Schedule</th>
                  <th className="p-3 text-right">Daily Rate</th>
                  <th className="p-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 print:divide-gray-300">
                <tr>
                  <td className="p-3 text-gray-300 print:text-gray-800 space-y-1">
                    <div><strong>From:</strong> {booking.start_date?.replace('T', ' ')}</div>
                    <div><strong>To:</strong> {booking.end_date?.replace('T', ' ')}</div>
                  </td>
                  <td className="p-3 text-right text-gray-300 print:text-gray-800 align-middle">
                    {car?.daily_rate || 0} {car?.currency || 'PKR'}
                  </td>
                  <td className="p-3 text-right font-bold text-green-400 print:text-green-600 text-base align-middle">
                    {booking.total_price} {car?.currency || 'PKR'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Notes & Signature */}
          <div className="pt-6 border-t border-gray-700 print:border-gray-300 flex justify-between items-center text-xs text-gray-400 print:text-gray-600">
            <p>Thank you for choosing Royal Rent A Car. Have a safe and pleasant journey!</p>
            <div className="text-right">
              <div className="h-8"></div>
              <p className="border-t border-gray-500 pt-1">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
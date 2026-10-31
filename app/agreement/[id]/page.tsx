'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PublicAgreementPage() {
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [car, setCar] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Form States
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);

  // File states
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!id) return;

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (bookingError || !bookingData) {
        setMessage('❌ Agreement not found or invalid link.');
        setLoading(false);
        return;
      }

      setBooking(bookingData);
      if (bookingData.customer_cnic) setCnic(bookingData.customer_cnic);
      if (bookingData.customer_address) setAddress(bookingData.customer_address);

      if (bookingData.is_signed) {
        setSuccess(true);
      }

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
      setLoading(false);
    }

    fetchBookingDetails();
  }, [id]);

  const uploadCNICImage = async (file: File, pathName: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}_${pathName}_${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage Bucket named 'cnic-documents'
    const { data, error } = await supabase.storage
      .from('cnic-documents')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('cnic-documents')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleSubmitAgreement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cnic.trim() || !address.trim()) {
      alert('Please enter your CNIC Number and Complete Address.');
      return;
    }

    if (!frontFile || !backFile) {
      alert('Please upload both Front and Back sides of your CNIC.');
      return;
    }

    if (!agreed) {
      alert('Please accept the rental terms & conditions.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // 1. Upload Front & Back Images
      let frontUrl = '';
      let backUrl = '';

      try {
        frontUrl = await uploadCNICImage(frontFile, 'front');
        backUrl = await uploadCNICImage(backFile, 'back');
      } catch (uploadErr: any) {
        // Fallback: If bucket is not created, encode as Base64 so it never fails
        const toBase64 = (file: File) => new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => res(reader.result as string);
          reader.onerror = error => rej(error);
        });

        frontUrl = await toBase64(frontFile);
        backUrl = await toBase64(backFile);
      }

      // 2. Update Booking with CNIC Details & Confirm Status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          customer_cnic: cnic,
          customer_address: address,
          cnic_front_url: frontUrl,
          cnic_back_url: backUrl,
          is_signed: true,
          status: 'confirmed',
          signed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        setMessage('❌ Error confirming agreement: ' + updateError.message);
      } else {
        setSuccess(true);
        setMessage('✅ Rental Agreement Confirmed & Verified Successfully!');
      }
    } catch (err: any) {
      setMessage('❌ Failed to process CNIC upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading agreement page...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400 text-lg">{message || 'Agreement link invalid or expired.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="max-w-2xl mx-auto bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="text-center border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-blue-400">
            {tenant?.business_name || 'Car Rental Agency'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">CNIC Verification & Rental Agreement Confirmation</p>
        </div>

        {/* Booking Summary */}
        <div className="space-y-3 text-sm bg-gray-900/60 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-400">Customer Name:</span>
            <span className="font-semibold text-white">{booking.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Phone:</span>
            <span className="font-semibold text-white">{booking.customer_phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vehicle:</span>
            <span className="font-semibold text-white">
              {car?.name} ({car?.registration_number || car?.model})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Rental Period:</span>
            <span className="font-semibold text-white">
              {booking.start_date?.replace('T', ' ')} to {booking.end_date?.replace('T', ' ')}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2">
            <span className="text-gray-400">Total Rental Cost:</span>
            <span className="font-bold text-green-400 text-base">
              {booking.total_price} PKR
            </span>
          </div>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-green-900/40 border border-green-700 text-center space-y-4">
            <p className="text-green-300 font-bold text-lg">✅ Booking Confirmed & Verified!</p>
            <p className="text-xs text-gray-300">
              Your details and CNIC verification have been saved securely. Have a safe journey!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAgreement} className="space-y-5">
            {/* CNIC and Address Inputs */}
            <div className="space-y-4 bg-gray-900/40 p-4 rounded-xl border border-gray-700">
              <h3 className="text-sm font-semibold text-blue-300">1. Customer Details Verification</h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1">CNIC Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 35202-1234567-1"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Complete Residential Address</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Enter your complete house address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CNIC Upload Section */}
            <div className="space-y-4 bg-gray-900/40 p-4 rounded-xl border border-gray-700">
              <h3 className="text-sm font-semibold text-blue-300">2. Upload Original CNIC Photos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CNIC Front Side Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-300 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CNIC Back Side Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-300 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Confirmation */}
            <div className="space-y-3 bg-gray-900/30 p-4 rounded-xl border border-gray-800">
              <h3 className="text-xs font-semibold text-gray-300">Terms & Rental Conditions:</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                • Vehicle must be returned in original condition with agreed fuel level.<br />
                • Traffic fines, toll taxes, and accident damages will be paid by renter.<br />
                • Misuse, subleasing, or criminal activity is strictly illegal.
              </p>
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-white font-medium">
                  I hereby confirm that provided details & CNIC photos are authentic and I accept all rental terms.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow cursor-pointer"
            >
              {uploading ? 'Verifying & Confirming Booking...' : '✅ Agree Terms & Confirm Rental'}
            </button>
          </form>
        )}

        {message && !success && (
          <p className="text-center text-sm text-red-400">{message}</p>
        )}
      </div>
    </div>
  );
}
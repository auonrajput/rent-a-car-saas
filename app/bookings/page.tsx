'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Helper to parse "YYYY-MM-DDTHH:mm" strictly as local time
function parseLocalDateTime(dtStr: string) {
  if (!dtStr) return 0;
  const clean = dtStr.replace(' ', 'T');
  const [datePart, timePart] = clean.split('T');
  if (!datePart) return new Date(dtStr).getTime();
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0] = (timePart || '00:00').split(':').map(Number);
  
  return new Date(year, month - 1, day, hour, minute).getTime();
}

// Professional local formatting for date and time display with AM/PM
function formatDateTime(dtStr: string) {
  if (!dtStr) return 'N/A';
  const clean = dtStr.replace(' ', 'T');
  const [datePart, timePart] = clean.split('T');
  if (!datePart || !timePart) return dtStr;
  
  const [year, month, day] = datePart.split('-');
  let [hours, minutes] = timePart.split(':');
  
  let hourNum = parseInt(hours, 10);
  if (isNaN(hourNum)) return dtStr;
  
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12;
  hourNum = hourNum ? hourNum : 12;
  const formattedHour = String(hourNum).padStart(2, '0');
  
  return `${month}/${day}/${year}, ${formattedHour}:${minutes} ${ampm}`;
}

// Live Countdown Timer Component
function TripCountdown({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!startTime || !endTime) return;

    const startTimestamp = parseLocalDateTime(startTime);
    const endTimestamp = parseLocalDateTime(endTime);

    const updateTimer = () => {
      const now = new Date().getTime();

      if (
        !Number.isFinite(startTimestamp) ||
        !Number.isFinite(endTimestamp) ||
        endTimestamp <= startTimestamp ||
        now >= endTimestamp
      ) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const difference = now < startTimestamp
        ? endTimestamp - startTimestamp
        : endTimestamp - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (timeLeft.isExpired) {
    return <span className="text-red-400 font-bold text-xs">⚠️ Trip Time Ended! Return Due</span>;
  }

  return (
    <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded border border-gray-700 text-xs w-full sm:w-auto">
      <span className="text-gray-400 font-medium">Time Left:</span>
      <span className="text-amber-400 font-mono font-bold">
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('admin');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal State for Customer Agreement Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<any>(null);
  const [agreementForm, setAgreementForm] = useState({
    cnic: '',
    address: '',
    payment_method: 'Cash',
    advance_amount: '',
    cnic_front: null as File | null,
    cnic_back: null as File | null,
    notes: '',
  });
  const [submittingAgreement, setSubmittingAgreement] = useState(false);

  const [formData, setFormData] = useState({
    car_id: '',
    customer_name: '',
    customer_phone: '',
    start_time: '',
    end_time: '',
  });

  async function fetchActiveBookingsAndRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setTenantId(user.id);
    
    const role = user.user_metadata?.role || 'admin';
    setUserRole(role);

    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    const { data: allCarsData, error: allCarsError } = await supabase
      .from('cars')
      .select('*')
      .eq('tenant_id', user.id);

    if (allCarsError) {
      console.error('Error fetching cars:', allCarsError);
    }

    const enrichedBookings = (bookingsData || []).map((b) => {
      const foundCar = allCarsData?.find((c) => c.id === b.car_id);
      return {
        ...b,
        cars: foundCar || { brand: '', name: 'Car Deleted', registration_number: 'N/A', daily_rate: 0 }
      };
    });

    setBookings(enrichedBookings);

    const availableCars = (allCarsData || []).filter((c) => c.status === 'available');
    setCars(availableCars);

    setLoading(false);
  }

  useEffect(() => {
    fetchActiveBookingsAndRole();
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.car_id) {
      alert('Please select an available car');
      return;
    }

    const startTimestamp = parseLocalDateTime(formData.start_time);
    const endTimestamp = parseLocalDateTime(formData.end_time);

    if (startTimestamp >= endTimestamp) {
      alert('End date and time must be later than start date and time!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not authenticated');
      return;
    }

    setSubmitting(true);

    const selectedCar = cars.find((c) => c.id === formData.car_id);
    const diffTime = Math.abs(endTimestamp - startTimestamp);
    const diffHours = diffTime / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24) || 1;
    const totalPrice = diffDays * Number(selectedCar?.daily_rate || 0);

    const { error: bookingError } = await supabase.from('bookings').insert([
      {
        tenant_id: user.id,
        car_id: formData.car_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        start_date: formData.start_time,
        end_date: formData.end_time,
        total_price: totalPrice,
        status: 'confirmed',
        is_signed: false,
      },
    ]);

    if (bookingError) {
      alert('Error creating booking: ' + bookingError.message);
    } else {
      await supabase.from('cars').update({ status: 'rented' }).eq('id', formData.car_id);

      setFormData({
        car_id: '',
        customer_name: '',
        customer_phone: '',
        start_time: '',
        end_time: '',
      });
      await fetchActiveBookingsAndRole();
    }
    setSubmitting(false);
  };

  const handleDeleteBooking = async (bookingId: string, carId: string) => {
    const { error: bookingError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (bookingError) {
      alert('Error deleting booking: ' + bookingError.message);
      return;
    }

    const { error: carError } = await supabase
      .from('cars')
      .update({ status: 'available' })
      .eq('id', carId);

    if (carError) {
      alert('Error updating car status: ' + carError.message);
    } else {
      setDeleteConfirmId(null);
      await fetchActiveBookingsAndRole();
    }
  };

  const handleCompleteTrip = async (bookingId: string, carId: string) => {
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId);

    if (bookingError) {
      alert('Error completing booking: ' + bookingError.message);
      return;
    }

    const { error: carError } = await supabase
      .from('cars')
      .update({ status: 'available' })
      .eq('id', carId);

    if (carError) {
      alert('Error updating car status: ' + carError.message);
    } else {
      await fetchActiveBookingsAndRole();
    }
  };

  const openAgreementModal = (booking: any) => {
    setSelectedBookingForModal(booking);
    setAgreementForm({
      cnic: booking.cnic || '',
      address: booking.address || '',
      payment_method: booking.payment_method || 'Cash',
      advance_amount: booking.advance_amount || '',
      cnic_front: null,
      cnic_back: null,
      notes: booking.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForModal) return;

    const advanceNum = Number(agreementForm.advance_amount);
    if (isNaN(advanceNum) || advanceNum <= 0) {
      alert('Please enter a valid advance payment amount before confirming the booking!');
      return;
    }

    if (advanceNum > selectedBookingForModal.total_price) {
      alert('Advance payment cannot be greater than total price!');
      return;
    }

    const balanceNum = selectedBookingForModal.total_price - advanceNum;

    setSubmittingAgreement(true);
    const { error } = await supabase
      .from('bookings')
      .update({
        is_signed: true,
        cnic: agreementForm.cnic,
        address: agreementForm.address,
        payment_method: agreementForm.payment_method,
        advance_amount: advanceNum,
        balance_amount: balanceNum,
        notes: agreementForm.notes,
      })
      .eq('id', selectedBookingForModal.id);

    if (error) {
      alert('Error signing agreement: ' + error.message);
    } else {
      setIsModalOpen(false);
      setSelectedBookingForModal(null);
      await fetchActiveBookingsAndRole();
    }
    setSubmittingAgreement(false);
  };

  const canCreateOrManageBooking = userRole === 'admin' || userRole === 'manager' || userRole === 'receptionist';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header with Navigation & History Link */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">Active Fleet Tracking & Agreements</h1>
            <p className="text-xs sm:text-sm text-gray-400">Manage active rentals with real-time countdown timers</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/bookings/history"
              className="bg-blue-600/90 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-blue-500 shadow flex items-center gap-1.5"
            >
              📜 Booking History & Records
            </Link>
          </div>
        </div>

        {/* New Booking Form - Visible to Admin, Manager & Receptionist */}
        {canCreateOrManageBooking && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Create New Booking</h2>
            <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Select Available Car</label>
                <select
                  value={formData.car_id}
                  onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Car --</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.name} [{car.registration_number}] - {car.daily_rate} PKR/day
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Khan"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Customer Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03231234567"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark] cursor-pointer"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2.5 rounded transition-colors disabled:opacity-50 cursor-pointer shadow text-sm"
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Bookings Tracking List */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">Currently Rented / On Trip Vehicles ({bookings.length})</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading active bookings...</p>
          ) : bookings.length === 0 ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p className="text-gray-300 text-sm">No vehicles currently on trip. All cars are available in inventory!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((b) => (
                <div key={b.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-blue-300">
                        {b.cars?.brand} {b.cars?.name} <span className="font-mono text-amber-300 text-xs sm:text-sm">({b.cars?.registration_number})</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">Customer: <span className="text-white font-medium">{b.customer_name}</span> ({b.customer_phone})</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 text-[10px] sm:text-xs rounded uppercase font-medium">
                        On Trip
                      </span>
                      {b.is_signed ? (
                        <span className="bg-green-900/60 text-green-300 border border-green-700 px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold">
                          Signed ✅
                        </span>
                      ) : (
                        <span className="bg-amber-900/60 text-amber-300 border border-amber-700 px-2 py-0.5 text-[10px] sm:text-xs rounded font-bold">
                          Pending Sign ⏳
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date and Exact Time Display */}
                  <div className="text-xs text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-900 p-3 rounded border border-gray-700/60">
                    <div>From: <span className="text-white font-medium">{formatDateTime(b.start_date)}</span></div>
                    <div>To: <span className="text-white font-medium">{formatDateTime(b.end_date)}</span></div>
                  </div>

                  {/* Live Countdown Timer */}
                  <div className="flex items-center justify-between">
                    <TripCountdown startTime={b.start_date} endTime={b.end_date} />
                  </div>

                  {/* Inline Confirmation Box */}
                  {deleteConfirmId === b.id ? (
                    <div className="bg-red-950/50 border border-red-700/60 p-3 rounded-lg space-y-2">
                      <p className="text-xs text-red-200 font-medium">Are you sure you want to cancel and delete this booking?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteBooking(b.id, b.car_id)}
                          className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded font-medium cursor-pointer shadow"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700/60 justify-between items-center">
                      <button
                        onClick={() => openAgreementModal(b)}
                        className={`text-xs px-3 py-2 rounded transition-colors cursor-pointer flex items-center gap-1 shadow font-medium ${
                          b.is_signed ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {b.is_signed ? '📋 View Agreement Details' : '📝 Customer Agreement Form'}
                      </button>
                      
                      {canCreateOrManageBooking && (
                        <button
                          onClick={() => setDeleteConfirmId(b.id)}
                          className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-2 rounded transition-colors cursor-pointer flex items-center gap-1 shadow font-medium"
                        >
                          ❌ Cancel & Delete Booking
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center pt-2 border-t border-gray-700 gap-2">
                    <span className="text-green-400 font-bold text-sm">Total: {b.total_price} PKR</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      <a
                        href={`/bookings/${b.id}/invoice`}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                      >
                        📄 Invoice
                      </a>
                      {canCreateOrManageBooking && (
                        <button
                          onClick={() => handleCompleteTrip(b.id, b.car_id)}
                          className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded font-medium transition-colors cursor-pointer shadow"
                        >
                          ✅ Complete Trip & Return Car
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Agreement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-blue-400 pr-2">
                {selectedBookingForModal?.is_signed ? 'Customer Agreement & Payment Details (Verified)' : 'Customer Agreement & Payment Verification'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-base font-bold cursor-pointer shrink-0 p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-1 bg-gray-900 p-3 rounded border border-gray-700">
              <p>Customer: <span className="text-white font-semibold">{selectedBookingForModal?.customer_name}</span></p>
              <p>Phone: <span className="text-white font-semibold">{selectedBookingForModal?.customer_phone}</span></p>
              <p>Car: <span className="text-white font-semibold">{selectedBookingForModal?.cars?.brand} {selectedBookingForModal?.cars?.name} ({selectedBookingForModal?.cars?.registration_number})</span></p>
              <p>Total Rental Price: <span className="text-green-400 font-bold">{selectedBookingForModal?.total_price} PKR</span></p>
            </div>

            <form onSubmit={handleAgreementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Customer CNIC Number</label>
                <input
                  type="text"
                  required
                  disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                  placeholder="e.g. 35202-1234567-1"
                  value={agreementForm.cnic}
                  onChange={(e) => setAgreementForm({ ...agreementForm, cnic: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Residential Address</label>
                <textarea
                  required
                  rows={2}
                  disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                  placeholder="e.g. House #123, Street #4, Lahore"
                  value={agreementForm.address}
                  onChange={(e) => setAgreementForm({ ...agreementForm, address: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Payment Method</label>
                  <select
                    disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                    value={agreementForm.payment_method}
                    onChange={(e) => setAgreementForm({ ...agreementForm, payment_method: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa / JazzCash">EasyPaisa / JazzCash</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Advance Amount (PKR) *</label>
                  <input
                    type="number"
                    required
                    disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                    placeholder="e.g. 5000"
                    value={agreementForm.advance_amount}
                    onChange={(e) => setAgreementForm({ ...agreementForm, advance_amount: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {agreementForm.advance_amount && !isNaN(Number(agreementForm.advance_amount)) && (
                <div className="bg-gray-900 p-2.5 rounded border border-gray-700 text-xs flex justify-between">
                  <span className="text-gray-400">Calculated Balance Due:</span>
                  <span className="text-amber-400 font-bold">
                    {Math.max(0, (selectedBookingForModal?.total_price || 0) - Number(agreementForm.advance_amount))} PKR
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">📷 CNIC Front Side</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                    onChange={(e) => setAgreementForm({ ...agreementForm, cnic_front: e.target.files?.[0] || null })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">📷 CNIC Back Side</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                    onChange={(e) => setAgreementForm({ ...agreementForm, cnic_back: e.target.files?.[0] || null })}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Additional Notes / Remarks</label>
                <input
                  type="text"
                  disabled={selectedBookingForModal?.is_signed || !canCreateOrManageBooking}
                  placeholder="e.g. Security deposit received"
                  value={agreementForm.notes}
                  onChange={(e) => setAgreementForm({ ...agreementForm, notes: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-4 py-2 rounded font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
                {!selectedBookingForModal?.is_signed && canCreateOrManageBooking && (
                  <button
                    type="submit"
                    disabled={submittingAgreement}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 cursor-pointer shadow"
                  >
                    {submittingAgreement ? 'Processing...' : 'Verify & Sign Booking ✅'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CustomerTrackPage() {
  const params = useParams();
  const token = params?.token as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastPing, setLastPing] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function verifyToken() {
      if (!token) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*, cars(brand, name, registration_number)')
        .eq('tracking_token', token)
        .single();

      if (error || !data) {
        setErrorMsg('Invalid or expired tracking link.');
      } else if (data.status !== 'confirmed' || !data.is_tracking_active) {
        setErrorMsg('This rental trip has been completed or tracking has ended.');
        setBooking(data);
      } else {
        setBooking(data);
      }
      setLoading(false);
    }

    verifyToken();
  }, [token]);

  const sendLocationUpdate = async (latitude: number, longitude: number, speed: number | null, heading: number | null) => {
    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_token: token,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.is_active) {
        setIsTracking(false);
        setErrorMsg(resData.error || 'Tracking was disabled by admin.');
      } else {
        setLastPing(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error('Failed to send tracking payload:', err);
    }
  };

  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        sendLocationUpdate(latitude, longitude, speed, heading);
      },
      (err) => {
        console.error('GPS error:', err);
        alert('Please allow location access to enable vehicle trip tracking.');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
        
        {/* Header Branding */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-amber-400 tracking-wider">ROYAL RENT A CAR</h1>
          <p className="text-xs text-gray-400">Live Trip & Safety Tracking Console</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 animate-pulse">Verifying tracking link...</p>
        ) : errorMsg ? (
          <div className="bg-red-950/60 border border-red-800 p-4 rounded-xl space-y-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs text-red-300 font-medium">{errorMsg}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Vehicle Details Card */}
            <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 text-left space-y-1">
              <p className="text-xs text-gray-400 uppercase font-semibold">Assigned Vehicle</p>
              <h3 className="text-base font-bold text-blue-300">
                {booking?.cars?.brand} {booking?.cars?.name}
              </h3>
              <p className="text-xs font-mono text-amber-300">
                Reg: {booking?.cars?.registration_number}
              </p>
            </div>

            {/* Tracking Controls */}
            {isTracking ? (
              <div className="bg-emerald-950/50 border border-emerald-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    Live GPS Transmitting
                  </span>
                </div>

                {currentCoords && (
                  <p className="text-[11px] font-mono text-gray-400">
                    Lat: {currentCoords.lat.toFixed(5)} | Lng: {currentCoords.lng.toFixed(5)}
                  </p>
                )}

                {lastPing && (
                  <p className="text-[10px] text-emerald-400/80">
                    Last update sent at {lastPing}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={startLiveTracking}
                className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                📡 Enable GPS & Start Location Sharing
              </button>
            )}

            <p className="text-[11px] text-gray-500">
              Location updates automatically expire when the rental period closes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
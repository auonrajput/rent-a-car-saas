'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Interactive Leaflet Map Component loaded dynamically on client side only
function LiveMap({ lat, lng, carTitle }: { lat: number; lng: number; carTitle: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix Leaflet default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || !isMounted) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([lat, lng], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([lat, lng]).addTo(map)
          .bindPopup(`<b>${carTitle}</b><br />Live Location`)
          .openPopup();

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position and pan map smoothly on coordinate change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: true });
    }
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-64 rounded-xl z-0 border border-gray-700 shadow-inner my-2" />;
}

function TrackingContent() {
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
      if (!token) {
        setLoading(false);
        return;
      }

      // UUID and tracking_token fallback lookup
      const { data, error } = await supabase
        .from('bookings')
        .select('*, cars(brand, name, registration_number)')
        .or(`id.eq.${token},tracking_token.eq.${token}`)
        .maybeSingle();

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
          booking_id: booking?.id || token,
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

  const carTitle = booking?.cars ? `${booking.cars.brand} ${booking.cars.name}` : 'Rental Vehicle';
  // Default fallback center (e.g. Karachi) if GPS hasn't locked yet
  const defaultLat = currentCoords?.lat || 24.8607;
  const defaultLng = currentCoords?.lng || 67.0011;

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
                {carTitle}
              </h3>
              <p className="text-xs font-mono text-amber-300">
                Reg: {booking?.cars?.registration_number}
              </p>
            </div>

            {/* Tracking Controls & Interactive Map */}
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

                {/* Leaflet Map Integration */}
                <LiveMap lat={defaultLat} lng={defaultLng} carTitle={carTitle} />

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

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl text-center">
          <h1 className="text-xl font-bold text-amber-400 mb-2">ROYAL RENT A CAR</h1>
          <p className="text-sm text-gray-400 animate-pulse">Loading tracking console...</p>
        </div>
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
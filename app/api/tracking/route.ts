import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tracking_token, latitude, longitude, speed, heading } = body;

    if (!tracking_token || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required tracking data (token, latitude, longitude)' },
        { status: 400 }
      );
    }

    // 1. Fetch active booking by matching either id or tracking_token
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, is_tracking_active')
      .or(`id.eq.${tracking_token},tracking_token.eq.${tracking_token}`)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Invalid or expired tracking token' },
        { status: 404 }
      );
    }

    // 2. Reject tracking update if booking is completed or tracking turned off
    if (booking.status !== 'confirmed' || !booking.is_tracking_active) {
      return NextResponse.json(
        { 
          error: 'Tracking is disabled for this trip because the booking is completed or inactive.',
          is_active: false 
        },
        { status: 403 }
      );
    }

    // 3. Update last known location in database
    const locationData = {
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        last_known_location: locationData,
      })
      .eq('id', booking.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update location: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      is_active: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
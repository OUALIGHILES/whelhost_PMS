// app/api/bookings/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get bookings for the current user's hotels
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the user's hotel IDs
    const { data: hotels, error: hotelError } = await supabase
      .from('hotels')
      .select('id')
      .eq('owner_id', user.id)

    if (hotelError) {
      console.error('Error fetching hotels:', hotelError)
      return Response.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    if (!hotels || hotels.length === 0) {
      return Response.json({ bookings: [] })
    }

    const hotelIds = hotels.map(h => h.id)

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        guest_id,
        unit_id,
        guests (
          first_name,
          last_name,
          email,
          phone
        ),
        units (
          name,
          hotel_id
        )
      `)
      .in('hotel_id', hotelIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return Response.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return Response.json({ bookings: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { 
      hotel_id, 
      unit_id, 
      guest_id, 
      check_in, 
      check_out, 
      source,
      adults,
      children,
      total_amount,
      notes,
      special_requests 
    } = await request.json()

    // Verify that the user owns the hotel
    const { count: hotelCount, error: hotelError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true })
      .eq('id', hotel_id)
      .eq('owner_id', user.id)

    if (hotelError) {
      console.error('Error checking hotel ownership:', hotelError)
      return Response.json({ error: 'Failed to verify hotel ownership' }, { status: 500 })
    }

    if (hotelCount === 0) {
      return Response.json({ error: 'Unauthorized: You do not own this hotel' }, { status: 403 })
    }

    // Verify that the unit belongs to the hotel
    const { count: unitCount, error: unitError } = await supabase
      .from('units')
      .select('*', { count: 'exact', head: true })
      .eq('id', unit_id)
      .eq('hotel_id', hotel_id)

    if (unitError) {
      console.error('Error checking unit ownership:', unitError)
      return Response.json({ error: 'Failed to verify unit' }, { status: 500 })
    }

    if (unitCount === 0) {
      return Response.json({ error: 'Unit does not belong to this hotel' }, { status: 400 })
    }

    // Check for overlapping bookings for the same unit
    const { data: existingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('unit_id', unit_id)
      .neq('status', 'cancelled')
      .or(`check_in.lte.${check_out},check_out.gte.${check_in}`)
    
    if (overlapError) {
      console.error('Error checking overlapping bookings:', overlapError)
      return Response.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    if (existingBookings && existingBookings.length > 0) {
      return Response.json({ error: 'Unit is not available for the selected dates' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        hotel_id,
        unit_id,
        guest_id,
        check_in,
        check_out,
        source: source || 'direct',
        adults: adults || 1,
        children: children || 0,
        total_amount: total_amount || 0,
        notes,
        special_requests
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return Response.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Update the unit status to occupied if the booking is confirmed
    if (data.status === 'confirmed') {
      await supabase
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', unit_id)
    }

    return Response.json({ booking: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
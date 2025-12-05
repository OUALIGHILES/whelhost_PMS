// app/api/guests/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get guests for the current user's hotels
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
      return Response.json({ guests: [] })
    }

    const hotelIds = hotels.map(h => h.id)

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .in('hotel_id', hotelIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guests:', error)
      return Response.json({ error: 'Failed to fetch guests' }, { status: 500 })
    }

    return Response.json({ guests: data })
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
      first_name, 
      last_name, 
      email, 
      phone, 
      id_type, 
      id_number, 
      nationality, 
      address, 
      notes 
    } = await request.json()

    // Verify that the user owns the hotel
    const { count, error: hotelError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true })
      .eq('id', hotel_id)
      .eq('owner_id', user.id)

    if (hotelError) {
      console.error('Error checking hotel ownership:', hotelError)
      return Response.json({ error: 'Failed to verify hotel ownership' }, { status: 500 })
    }

    if (count === 0) {
      return Response.json({ error: 'Unauthorized: You do not own this hotel' }, { status: 403 })
    }

    // Check if guest already exists with this email in the same hotel
    const { data: existingGuest, error: guestCheckError } = await supabase
      .from('guests')
      .select('*')
      .eq('hotel_id', hotel_id)
      .ilike('email', email)
      .limit(1)

    if (guestCheckError) {
      console.error('Error checking existing guest:', guestCheckError)
      return Response.json({ error: 'Failed to check existing guest' }, { status: 500 })
    }

    let guestData;
    
    if (existingGuest && existingGuest.length > 0) {
      // Guest already exists, return existing guest
      guestData = existingGuest[0]
    } else {
      // Create new guest
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          hotel_id,
          first_name,
          last_name,
          email,
          phone,
          id_type,
          id_number,
          nationality,
          address,
          notes
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating guest:', error)
        return Response.json({ error: 'Failed to create guest' }, { status: 500 })
      }
      
      guestData = data
    }

    return Response.json({ guest: guestData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
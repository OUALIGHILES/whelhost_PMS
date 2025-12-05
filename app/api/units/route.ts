// app/api/units/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get units for the current user's hotels
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        hotel_id,
        room_type_id,
        room_types (
          name,
          base_price
        )
      `)
      .in('hotel_id', 
        (await supabase
          .from('hotels')
          .select('id')
          .eq('owner_id', user.id)
        ).data?.map(h => h.id) || []
      )

    if (error) {
      console.error('Error fetching units:', error)
      return Response.json({ error: 'Failed to fetch units' }, { status: 500 })
    }

    return Response.json({ units: data })
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
    
    const { hotel_id, room_type_id, name, floor, status, notes } = await request.json()

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

    const { data, error } = await supabase
      .from('units')
      .insert([{
        hotel_id,
        room_type_id,
        name,
        floor,
        status: status || 'available',
        notes
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating unit:', error)
      return Response.json({ error: 'Failed to create unit' }, { status: 500 })
    }

    return Response.json({ unit: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
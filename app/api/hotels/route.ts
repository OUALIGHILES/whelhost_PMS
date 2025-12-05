// app/api/hotels/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get hotels for the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('hotels')
      .select(`
        *,
        units (
          *,
          room_types (
            name,
            base_price
          )
        ),
        room_types (
          *
        )
      `)
      .eq('owner_id', user.id)

    if (error) {
      console.error('Error fetching hotels:', error)
      return Response.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    return Response.json({ hotels: data })
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
    
    const { name, description, address, city, country, phone, email, currency } = await request.json()

    const { data, error } = await supabase
      .from('hotels')
      .insert([{
        owner_id: user.id,
        name,
        description,
        address,
        city,
        country,
        phone,
        email,
        currency: currency || 'SAR'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating hotel:', error)
      return Response.json({ error: 'Failed to create hotel' }, { status: 500 })
    }

    return Response.json({ hotel: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
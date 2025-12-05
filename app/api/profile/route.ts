// app/api/profile/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get user profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, phone, location, id_type, id_number, email')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
      console.error('Error fetching profile:', profileError)
      return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // If no profile exists, create a basic one using auth user data
    if (!profile) {
      return Response.json({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.avatar || '',
        role: user.user_metadata?.role || 'guest',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || '',
        id_type: user.user_metadata?.id_type || '',
        id_number: user.user_metadata?.id_number || '',
      })
    }

    return Response.json({
      id: profile.id,
      email: profile.email || user.email || '',
      full_name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.avatar || '',
      role: profile.role || user.user_metadata?.role || 'guest',
      phone: profile.phone || user.user_metadata?.phone || '',
      location: profile.location || user.user_metadata?.location || '',
      id_type: profile.id_type || user.user_metadata?.id_type || '',
      id_number: profile.id_number || user.user_metadata?.id_number || '',
    })
  } catch (error) {
    console.error('Unexpected error in profile API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
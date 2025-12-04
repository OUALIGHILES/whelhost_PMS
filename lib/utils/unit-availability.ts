'use client';

import { createClient } from '@/lib/supabase/client';

interface AvailableUnit {
  id: string;
  name: string;
  status: string;
  room_type_id: string;
  is_available: boolean;
}

/**
 * Checks if a unit is available for booking in the specified date range
 */
export async function isUnitAvailable(unitId: string, checkIn: string, checkOut: string): Promise<boolean> {
  const supabase = createClient();

  // Check if there are any overlapping bookings for this unit
  const { data, error } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, status')
    .eq('unit_id', unitId)
    .or(
      `(check_in.lte.${checkOut},check_out.gte.${checkIn})` // Overlap condition
    )
    .neq('status', 'cancelled'); // Exclude cancelled bookings

  if (error) {
    console.error('Error checking unit availability:', error);
    throw error;
  }

  // If there are any active bookings that overlap, the unit is not available
  return data.length === 0;
}

/**
 * Gets all available units for a given date range
 */
export async function getAvailableUnits(hotelId: string, checkIn: string, checkOut: string): Promise<AvailableUnit[]> {
  const supabase = createClient();

  // First get all units for the hotel
  const { data: allUnits, error: unitsError } = await supabase
    .from('units')
    .select('*')
    .eq('hotel_id', hotelId);

  if (unitsError) {
    console.error('Error fetching units:', unitsError);
    throw unitsError;
  }

  // Then check availability for each unit
  const availableUnits: AvailableUnit[] = [];
  
  for (const unit of allUnits) {
    const isAvail = await isUnitAvailable(unit.id, checkIn, checkOut);
    availableUnits.push({
      ...unit,
      is_available: isAvail
    });
  }

  return availableUnits;
}
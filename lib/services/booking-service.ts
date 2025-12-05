// lib/services/booking-service.ts
import { createServiceRoleClient } from '@/lib/supabase/service-client'

interface CreateBookingParams {
  hotel_id: string;
  unit_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  source?: string;
  adults?: number;
  children?: number;
  total_amount: number;
  notes?: string;
  special_requests?: string;
}

interface UpdateBookingParams {
  id: string;
  status?: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
  special_requests?: string;
  paid_amount?: number;
}

class BookingService {
  private supabase = createServiceRoleClient();

  async createBooking(data: CreateBookingParams) {
    try {
      // Check for overlapping bookings
      const { data: existingBookings, error: overlapError } = await this.supabase
        .from('bookings')
        .select('id')
        .eq('unit_id', data.unit_id)
        .neq('status', 'cancelled')
        .or(`check_in.lte.${data.check_out},check_out.gte.${data.check_in}`)
      
      if (overlapError) {
        throw new Error(`Failed to check availability: ${overlapError.message}`);
      }

      if (existingBookings && existingBookings.length > 0) {
        throw new Error('Unit is not available for the selected dates');
      }

      const { data: booking, error } = await this.supabase
        .from('bookings')
        .insert([{
          ...data,
          source: data.source || 'direct',
          adults: data.adults || 1,
          children: data.children || 0,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create booking: ${error.message}`);
      }

      // Update the unit status if booking is confirmed
      if (booking.status === 'confirmed') {
        await this.supabase
          .from('units')
          .update({ status: 'occupied' })
          .eq('id', data.unit_id)
      }

      return booking;
    } catch (error: any) {
      throw new Error(`Booking creation error: ${error.message}`);
    }
  }

  async updateBooking(data: UpdateBookingParams) {
    try {
      const { id, ...updateData } = data;
      
      const { data: booking, error } = await this.supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update booking: ${error.message}`);
      }

      return booking;
    } catch (error: any) {
      throw new Error(`Booking update error: ${error.message}`);
    }
  }

  async getBookings(hotelId: string) {
    try {
      const { data, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          guests (
            first_name,
            last_name,
            email,
            phone
          ),
          units (
            name,
            room_type_id,
            room_types (
              name,
              base_price
            )
          )
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get bookings error: ${error.message}`);
    }
  }

  async getBookingById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('bookings')
        .select(`
          *,
          guests (
            *
          ),
          units (
            *
          ),
          hotels (
            name
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get booking error: ${error.message}`);
    }
  }

  async deleteBooking(id: string) {
    try {
      const { error } = await this.supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete booking: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      throw new Error(`Delete booking error: ${error.message}`);
    }
  }
}

export const bookingService = new BookingService();
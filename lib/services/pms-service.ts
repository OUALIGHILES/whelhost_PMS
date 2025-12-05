// lib/services/pms-service.ts
import { createServiceRoleClient } from '@/lib/supabase/service-client';
import { bookingService } from './booking-service';
import { guestService } from './guest-service';

interface HotelData {
  owner_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  currency?: string;
}

interface UnitData {
  hotel_id: string;
  room_type_id?: string;
  name: string;
  floor?: number;
  status?: string;
  notes?: string;
}

class PMSService {
  private supabase = createServiceRoleClient();

  // Hotel management methods
  async createHotel(data: HotelData) {
    try {
      const { data: hotel, error } = await this.supabase
        .from('hotels')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create hotel: ${error.message}`);
      }

      return hotel;
    } catch (error: any) {
      throw new Error(`Hotel creation error: ${error.message}`);
    }
  }

  async getHotels(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('hotels')
        .select(`
          *,
          units (
            id,
            name,
            status,
            room_type_id,
            room_types (
              name,
              base_price
            )
          ),
          room_types (
            *
          )
        `)
        .eq('owner_id', userId);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get hotels error: ${error.message}`);
    }
  }

  // Unit management methods
  async createUnit(data: UnitData) {
    try {
      const { data: unit, error } = await this.supabase
        .from('units')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create unit: ${error.message}`);
      }

      return unit;
    } catch (error: any) {
      throw new Error(`Unit creation error: ${error.message}`);
    }
  }

  async getUnits(hotelId: string) {
    try {
      const { data, error } = await this.supabase
        .from('units')
        .select(`
          *,
          room_types (
            name,
            base_price
          )
        `)
        .eq('hotel_id', hotelId);

      if (error) {
        throw new Error(`Failed to fetch units: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get units error: ${error.message}`);
    }
  }

  // Room type management methods
  async createRoomType(hotelId: string, name: string, basePrice: number, description?: string, maxOccupancy?: number, amenities?: string[]) {
    try {
      const { data: roomType, error } = await this.supabase
        .from('room_types')
        .insert([{
          hotel_id: hotelId,
          name,
          description: description || '',
          base_price: basePrice,
          max_occupancy: maxOccupancy || 2,
          amenities: amenities || []
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create room type: ${error.message}`);
      }

      return roomType;
    } catch (error: any) {
      throw new Error(`Room type creation error: ${error.message}`);
    }
  }

  async getRoomTypes(hotelId: string) {
    try {
      const { data, error } = await this.supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', hotelId);

      if (error) {
        throw new Error(`Failed to fetch room types: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get room types error: ${error.message}`);
    }
  }

  // Dashboard statistics methods
  async getDashboardStats(userId: string) {
    try {
      // Get user's hotels
      const hotels = await this.getHotels(userId);
      const hotelIds = hotels.map(h => h.id);

      if (hotelIds.length === 0) {
        return {
          hotels: 0,
          units: 0,
          bookings: 0,
          guests: 0,
          revenue: 0
        };
      }

      // Get counts
      const [unitsCount, bookingsCount, guestsCount] = await Promise.all([
        // Units count
        this.supabase
          .from('units')
          .select('*', { count: 'exact', head: true })
          .in('hotel_id', hotelIds)
          .then(({ count, error }) => {
            if (error) throw new Error(`Units count error: ${error.message}`);
            return count;
          }),
          
        // Bookings count
        this.supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('hotel_id', hotelIds)
          .then(({ count, error }) => {
            if (error) throw new Error(`Bookings count error: ${error.message}`);
            return count;
          }),
          
        // Guests count
        this.supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .in('hotel_id', hotelIds)
          .then(({ count, error }) => {
            if (error) throw new Error(`Guests count error: ${error.message}`);
            return count;
          })
      ]);

      // Get recent bookings for revenue calculation
      const { data: recentBookings, error: bookingsError } = await this.supabase
        .from('bookings')
        .select('total_amount')
        .in('hotel_id', hotelIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (bookingsError) {
        throw new Error(`Recent bookings error: ${bookingsError.message}`);
      }

      const revenue = recentBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

      return {
        hotels: hotels.length,
        units: unitsCount || 0,
        bookings: bookingsCount || 0,
        guests: guestsCount || 0,
        revenue
      };
    } catch (error: any) {
      throw new Error(`Dashboard stats error: ${error.message}`);
    }
  }

  // Booking and guest services
  get bookingService() {
    return bookingService;
  }

  get guestService() {
    return guestService;
  }
}

export const pmsService = new PMSService();
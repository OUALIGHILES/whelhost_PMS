// lib/services/guest-service.ts
import { createServiceRoleClient } from '@/lib/supabase/service-client'

interface CreateGuestParams {
  hotel_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  id_type?: string;
  id_number?: string;
  nationality?: string;
  address?: string;
  notes?: string;
}

interface UpdateGuestParams {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  id_type?: string;
  id_number?: string;
  nationality?: string;
  address?: string;
  notes?: string;
}

class GuestService {
  private supabase = createServiceRoleClient();

  async createGuest(data: CreateGuestParams) {
    try {
      // Check if guest already exists with this email in the same hotel
      const { data: existingGuest, error: guestCheckError } = await this.supabase
        .from('guests')
        .select('*')
        .eq('hotel_id', data.hotel_id)
        .ilike('email', data.email)
        .limit(1)

      if (guestCheckError) {
        throw new Error(`Failed to check existing guest: ${guestCheckError.message}`);
      }

      if (existingGuest && existingGuest.length > 0) {
        // Guest already exists, return existing guest
        return existingGuest[0];
      }

      // Create new guest
      const { data: newGuest, error } = await this.supabase
        .from('guests')
        .insert([{
          ...data
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create guest: ${error.message}`);
      }
      
      return newGuest;
    } catch (error: any) {
      throw new Error(`Guest creation error: ${error.message}`);
    }
  }

  async updateGuest(data: UpdateGuestParams) {
    try {
      const { id, ...updateData } = data;
      
      const { data: guest, error } = await this.supabase
        .from('guests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update guest: ${error.message}`);
      }

      return guest;
    } catch (error: any) {
      throw new Error(`Guest update error: ${error.message}`);
    }
  }

  async getGuests(hotelId: string) {
    try {
      const { data, error } = await this.supabase
        .from('guests')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch guests: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get guests error: ${error.message}`);
    }
  }

  async getGuestById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch guest: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get guest error: ${error.message}`);
    }
  }

  async getGuestByEmailAndHotel(email: string, hotelId: string) {
    try {
      const { data, error } = await this.supabase
        .from('guests')
        .select('*')
        .eq('email', email)
        .eq('hotel_id', hotelId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
        throw new Error(`Failed to fetch guest: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Get guest by email error: ${error.message}`);
    }
  }

  async deleteGuest(id: string) {
    try {
      const { error } = await this.supabase
        .from('guests')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete guest: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      throw new Error(`Delete guest error: ${error.message}`);
    }
  }
}

export const guestService = new GuestService();
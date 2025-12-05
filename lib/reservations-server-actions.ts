"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export interface Reservation {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  unit: string;
  guest: string;
  pricePerNight: number;
  total: number;
  paid: number;
  balance: number;
  status: "active" | "paid" | "upcoming" | "completed" | "cancelled";
  channel?: string;
  externalId?: string;
}

interface Unit {
  id: string;
  number: string;
  name: string;
  status: "occupied" | "vacant" | "out-of-service" | "departure-today" | "arrival-today";
  pricePerNight?: number;
  type?: string;
  floor?: string;
  guest?: string;
  checkIn?: string;
  checkOut?: string;
  balance?: number;
  propertyId?: string;
}

interface Guest {
  id: string;
  name: string;
  nationality: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
  reservations: number;
}

export interface ReservationsPageData {
  reservations: Reservation[];
  units: Unit[];
  guests: Guest[];
}

export async function getReservationsPageData(): Promise<ReservationsPageData> {
  const supabase = await createClient();
  const user = await requireAuth();

  // First get the user's hotels
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("owner_id", user.id);

  if (hotelError || !userHotels || userHotels.length === 0) {
    console.error("Error fetching user hotels:", hotelError);
    return {
      reservations: [],
      units: [],
      guests: []
    };
  }

  const hotelIds = userHotels.map(hotel => hotel.id);

  // Get reservations for the user's hotels - try full schema first, then basic
  const { data: reservationsData, error: reservationsError } = await supabase
    .from("bookings")
    .select(`
      id,
      created_at as date,
      check_in as checkIn,
      check_out as checkOut,
      total_amount as total,
      paid_amount as paid,
      status,
      source as channel,
      external_id as externalId,
      guests(first_name, last_name),
      units(name as unit_name)
    `)
    .in("hotel_id", hotelIds);

  let reservations: Reservation[] = [];
  if (reservationsError) {
    console.warn("Error fetching reservations with full schema:", reservationsError.message);

    // Fallback 1: Try without JOINs
    const { data: basicReservationsData, error: basicReservationsError } = await supabase
      .from("bookings")
      .select(`
        id,
        created_at as date,
        check_in as checkIn,
        check_out as checkOut,
        total_amount as total,
        paid_amount as paid,
        status,
        source as channel
      `)
      .in("hotel_id", hotelIds);

    if (basicReservationsError) {
      console.warn("Error fetching basic reservations:", basicReservationsError.message);

      // Fallback 2: Try with minimal fields only
      const { data: minimalReservationsData, error: minimalReservationsError } = await supabase
        .from("bookings")
        .select("id, created_at, check_in, check_out, total_amount, paid_amount, status")
        .in("hotel_id", hotelIds);

      if (minimalReservationsError) {
        console.error("Error fetching minimal reservations:", minimalReservationsError);
        // If everything fails, return an empty array as a last resort
        console.warn("Returning empty reservations array due to database errors");
      } else {
        reservations = minimalReservationsData.map(item => ({
          id: item.id,
          date: item.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          checkIn: item.check_in,
          checkOut: item.check_out,
          nights: calculateNights(item.check_in, item.check_out),
          unit: "Unit",
          guest: "Guest",
          pricePerNight: 0,
          total: item.total_amount || 0,
          paid: item.paid_amount || 0,
          balance: (item.total_amount || 0) - (item.paid_amount || 0),
          status: mapReservationStatus(item.status) || "upcoming",
        }));
      }
    } else {
      reservations = basicReservationsData.map(item => ({
        id: item.id,
        date: item.date?.split("T")[0] || new Date().toISOString().split("T")[0],
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        nights: calculateNights(item.checkIn, item.checkOut),
        unit: "Unit", // Will get the unit name later
        guest: "Guest", // Will get the guest name later
        pricePerNight: 0,
        total: item.total || 0,
        paid: item.paid || 0,
        balance: item.total - item.paid,
        status: mapReservationStatus(item.status) || "upcoming",
        channel: item.channel || "direct",
      }));
    }
  } else {
    reservations = reservationsData.map(item => ({
      id: item.id,
      date: item.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      nights: calculateNights(item.checkIn, item.checkOut),
      unit: item.units?.unit_name || "Unit",
      guest: `${item.guests?.first_name} ${item.guests?.last_name}`.trim() || "Guest",
      pricePerNight: 0, // Would need to enhance query to get this
      total: item.total || 0,
      paid: item.paid || 0,
      balance: item.total - item.paid,
      status: mapReservationStatus(item.status) || "upcoming",
      channel: item.channel || "direct",
      externalId: item.externalId || undefined,
    }));
  }

  // Get units for the user's hotels - try various field combinations
  let units: Unit[] = [];
  let unitsData: any;
  let unitsError: any;

  // Try the most common field names first
  ({ data: unitsData, error: unitsError } = await supabase
    .from("units")
    .select("id, number, name, status, base_price")
    .in("hotel_id", hotelIds));

  if (unitsError) {
    console.warn("Error fetching units with standard fields:", unitsError.message);

    // Try with just ID and any name field that might exist
    const { data: minimalUnitsData, error: minimalUnitsError } = await supabase
      .from("units")
      .select("id, name, number")
      .in("hotel_id", hotelIds);

    if (minimalUnitsError) {
      console.warn("Error fetching units with minimal fields:", minimalUnitsError.message);

      // Check if units table exists at all
      const { error: tableCheckError } = await supabase
        .from("units")
        .select("id")
        .limit(1);

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        console.warn("Units table does not exist in the database");
        units = []; // Return empty array if no units table
      } else {
        // Try with the most basic query possible - just get all units for the hotel
        const { data: basicUnitsData, error: basicUnitsError } = await supabase
          .from("units")
          .select("*")
          .in("hotel_id", hotelIds);

        if (basicUnitsError) {
          console.error("Error fetching basic units data:", basicUnitsError);
          units = []; // Return empty array on error
        } else {
          // Use the basic data and try to map it appropriately
          units = basicUnitsData.map((item: any) => ({
            id: item.id || item.unit_id || item.uid,
            number: item.number || item.unit_number || item.name || item.unit_name || item.id || "N/A",
            name: item.name || item.title || item.unit_name || item.description || "Unit",
            status: mapUnitStatus(item.status || item.unit_status) || "vacant",
            pricePerNight: item.base_price || item.price || item.daily_rate || 0,
          }));
        }
      }
    } else {
      // Use minimal units data
      units = minimalUnitsData.map((item: any) => ({
        id: item.id,
        number: item.number || item.name || item.id, // Use number, name, or id as number
        name: item.name || item.number || "Unit", // Use name or number as name
        status: "vacant", // Default status if not provided
        pricePerNight: 0, // Default price if not provided
      }));
    }
  } else {
    // Use the standard units data
    units = unitsData.map((item: any) => ({
      id: item.id,
      number: item.number || item.name || item.id, // Use number, name, or id as number
      name: item.name || item.number || "Unit", // Use name or number as name
      status: mapUnitStatus(item.status) || "vacant",
      pricePerNight: item.base_price || 0,
    }));

    // Get current bookings to update unit statuses
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("id, unit_id, check_in, check_out, status")
      .in("hotel_id", hotelIds)
      .gte("check_out", new Date().toISOString().split('T')[0]) // Only future and current bookings
      .or("status.eq.confirmed,status.eq.checked_in");

    if (bookingError) {
      console.warn("Error fetching bookings for unit status:", bookingError.message);
    } else {
      const today = new Date().toISOString().split('T')[0];

      // Update the unit statuses based on bookings
      units = units.map(unit => {
        // Check if the unit has an active booking
        const activeBooking = bookingData.find((booking: any) =>
          booking.unit_id === unit.id &&
          booking.check_in <= today &&
          booking.check_out > today
        );

        // Check if the unit has an upcoming booking starting today
        const upcomingBooking = bookingData.find((booking: any) =>
          booking.unit_id === unit.id &&
          booking.check_in === today
        );

        // Check if the unit has a departing booking today
        const departingBooking = bookingData.find((booking: any) =>
          booking.unit_id === unit.id &&
          booking.check_out === today
        );

        if (activeBooking) {
          return { ...unit, status: "occupied" };
        } else if (upcomingBooking) {
          return { ...unit, status: "arrival-today" };
        } else if (departingBooking) {
          return { ...unit, status: "departure-today" };
        } else {
          return unit;
        }
      });
    }
  }

  // Get guests for the user's hotels
  const { data: guestsData, error: guestsError } = await supabase
    .from("guests")
    .select("id, first_name, last_name")
    .in("hotel_id", hotelIds);

  let guests: Guest[] = [];
  if (guestsError) {
    console.warn("Error fetching guests:", guestsError.message);
  } else {
    guests = guestsData.map(item => ({
      id: item.id,
      name: `${item.first_name} ${item.last_name}`.trim() || "Unnamed Guest",
      nationality: "",
      idType: "",
      idNumber: "",
      phone: "",
      email: "",
      reservations: 0,
    }));
  }

  console.log("DEBUG: Fetched units count:", units.length);
  console.log("DEBUG: Sample unit:", units.length > 0 ? units[0] : "No units found");

  return {
    reservations,
    units,
    guests
  };
}

function mapUnitStatus(status: string): Unit['status'] | undefined {
  switch (status) {
    case 'occupied': return 'occupied';
    case 'maintenance': return 'out-of-service';
    case 'available': return 'vacant';
    default: return 'vacant';
  }
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function mapReservationStatus(status: string): Reservation['status'] {
  switch (status) {
    case 'confirmed': return 'active';
    case 'checked_in': return 'active';
    case 'paid': return 'paid';
    case 'pending': return 'upcoming';
    case 'checked_out': return 'completed';
    case 'cancelled': return 'cancelled';
    case 'no_show': return 'cancelled';
    default: return 'upcoming';
  }
}

export async function addReservation(reservationData: Omit<Reservation, 'id'>): Promise<Reservation> {
  const supabase = await createClient();
  const user = await requireAuth();

  // Get the user's hotels to link the reservation
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (hotelError || !userHotels || userHotels.length === 0) {
    throw new Error("No hotel found for user");
  }

  // Find the unit ID based on the unit name
  const { data: unitData, error: unitError } = await supabase
    .from("units")
    .select("id")
    .eq("name", reservationData.unit)
    .eq("hotel_id", userHotels[0].id)
    .single();

  if (unitError || !unitData) {
    throw new Error("Unit not found");
  }

  // Find the guest based on guest name - split first and last name
  const guestNameParts = reservationData.guest.split(" ");
  const firstName = guestNameParts[0];
  const lastName = guestNameParts.slice(1).join(" ") || firstName;

  // Check if guest already exists
  let guestId: string;

  const { data: existingGuest, error: existingGuestError } = await supabase
    .from("guests")
    .select("id")
    .eq("first_name", firstName)
    .eq("last_name", lastName)
    .eq("hotel_id", userHotels[0].id)
    .single();

  if (existingGuestError || !existingGuest) {
    // Create new guest
    const { data: newGuest, error: newGuestError } = await supabase
      .from("guests")
      .insert([{
        hotel_id: userHotels[0].id,
        first_name: firstName,
        last_name: lastName,
      }])
      .select("id")
      .single();

    if (newGuestError) {
      console.error("Error creating guest:", newGuestError);
      throw new Error("Failed to create guest");
    }
    
    guestId = newGuest.id;
  } else {
    guestId = existingGuest.id;
  }

  // Prepare the reservation data for insertion
  const insertData: any = {
    hotel_id: userHotels[0].id,
    unit_id: unitData.id,
    guest_id: guestId,
    check_in: reservationData.checkIn,
    check_out: reservationData.checkOut,
    source: reservationData.channel || "direct",
    total_amount: reservationData.total,
    paid_amount: reservationData.paid,
    status: mapReservationStatusForInsertion(reservationData.status),
  };

  // Insert the booking into the database
  const { data, error } = await supabase
    .from("bookings")
    .insert([insertData])
    .select("id, created_at, check_in, check_out, total_amount, paid_amount, status, source")
    .single();

  if (error) {
    console.error("Error adding reservation:", error);
    
    // Fallback: try with minimal required fields
    const minimalInsertData = {
      hotel_id: userHotels[0].id,
      unit_id: unitData.id,
      guest_id: guestId,
      check_in: reservationData.checkIn,
      check_out: reservationData.checkOut,
      source: reservationData.channel || "direct",
    };

    const { data: minimalData, error: minimalError } = await supabase
      .from("bookings")
      .insert([minimalInsertData])
      .select("id, created_at, check_in, check_out")
      .single();

    if (minimalError) {
      console.error("Error adding reservation with minimal data:", minimalError);
      throw new Error("Failed to add reservation: " + minimalError.message);
    }

    // Return a minimal reservation object
    return {
      id: minimalData.id,
      date: minimalData.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      checkIn: minimalData.check_in,
      checkOut: minimalData.check_out,
      nights: calculateNights(minimalData.check_in, minimalData.check_out),
      unit: reservationData.unit,
      guest: reservationData.guest,
      pricePerNight: reservationData.pricePerNight,
      total: reservationData.total,
      paid: reservationData.paid,
      balance: reservationData.total - reservationData.paid,
      status: reservationData.status,
      channel: reservationData.channel,
    };
  }

  // Calculate balance
  const balance = (data.total_amount || 0) - (data.paid_amount || 0);

  // Return the created reservation
  return {
    id: data.id,
    date: data.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    checkIn: data.check_in,
    checkOut: data.check_out,
    nights: calculateNights(data.check_in, data.check_out),
    unit: reservationData.unit,
    guest: reservationData.guest,
    pricePerNight: reservationData.pricePerNight,
    total: data.total_amount || 0,
    paid: data.paid_amount || 0,
    balance,
    status: mapReservationStatus(data.status) || reservationData.status,
    channel: data.source || reservationData.channel,
  };
}

function mapReservationStatusForInsertion(status: Reservation['status']): string {
  switch (status) {
    case 'active': return 'confirmed';
    case 'paid': return 'confirmed';
    case 'upcoming': return 'pending';
    case 'completed': return 'checked_out';
    case 'cancelled': return 'cancelled';
    default: return 'pending';
  }
}

export async function deleteReservation(id: string): Promise<void> {
  const supabase = await createClient();
  const user = await requireAuth();

  // Get the user's hotels to verify authorization
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("owner_id", user.id);

  if (hotelError || !userHotels || userHotels.length === 0) {
    throw new Error("No hotel found for user");
  }

  const hotelIds = userHotels.map(hotel => hotel.id);

  // Delete the reservation
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id)
    .in("hotel_id", hotelIds);

  if (error) {
    console.error("Error deleting reservation:", error);
    throw new Error("Failed to delete reservation");
  }
}
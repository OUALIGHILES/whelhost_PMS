import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillsClient from "@/components/dashboard/bills-client";

interface BillsPageProps {
  searchParams: {
    search?: string;
    invoiceNumber?: string;
    contractNumber?: string;
    bookingNumber?: string;
  };
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: hotel } = await supabase.from("hotels").select("id, currency").eq("owner_id", user.id).single();

  if (!hotel) redirect("/dashboard");

  // Build the query with filters
  let query = supabase
    .from("billings")
    .select(`
      *,
      booking:bookings(guest:guests(first_name, last_name))
    `)
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: false });

  // Apply search filters if provided
  if (searchParams.search) {
    query = query.or(
      `description.ilike.%${searchParams.search}%,category.ilike.%${searchParams.search}%`
    );
  }

  if (searchParams.invoiceNumber) {
    // This would filter by invoice number if we had an invoice number field in billings
    // For now, we'll just search description/category for the invoice number
    query = query.ilike('description', `%${searchParams.invoiceNumber}%`);
  }

  if (searchParams.contractNumber) {
    // This would filter by contract number if we had that field
    query = query.ilike('description', `%${searchParams.contractNumber}%`);
  }

  if (searchParams.bookingNumber) {
    // This would filter by booking number if we had that field directly
    query = query.ilike('description', `%${searchParams.bookingNumber}%`);
  }

  // Fetch bills data for this hotel
  const { data: bills } = await query;

  return (
    <BillsClient
      bills={bills || []}
      currency={hotel.currency}
      hotelId={hotel.id}
      searchParams={searchParams}
    />
  );
}
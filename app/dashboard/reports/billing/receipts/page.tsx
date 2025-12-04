import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReceiptItemsClient from "@/components/dashboard/receipt-items-client";

interface Receipt {
  id: string;
  hotel_id: string;
  billing_id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

interface ReceiptItemPageProps {
  searchParams: {
    from?: string;
    to?: string;
    method?: string;
  };
}

export default async function ReceiptItemsPage({ searchParams }: ReceiptItemPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: hotel } = await supabase.from("hotels").select("id, currency, name").eq("owner_id", user.id).single();

  if (!hotel) redirect("/dashboard");

  // Calculate date range for filtering
  const startDate = searchParams.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to last 30 days
  const endDate = searchParams.to || new Date().toISOString().split('T')[0]; // Default to today
  const paymentMethod = searchParams.method;

  // Fetch receipts for this hotel
  let query = supabase
    .from("receipts")
    .select("*")
    .eq("hotel_id", hotel.id)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (paymentMethod && paymentMethod !== "all") {
    query = query.eq("payment_method", paymentMethod);
  }

  const { data: receipts } = await query;

  return (
    <ReceiptItemsClient
      receipts={receipts || []}
      currency={hotel.currency}
      hotelName={hotel.name}
    />
  );
}
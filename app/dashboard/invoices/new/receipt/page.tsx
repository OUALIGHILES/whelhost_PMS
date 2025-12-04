import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReceiptForm } from "@/components/dashboard/receipt-form";

export default async function NewReceiptPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: hotel } = await supabase.from("hotels").select("id, currency").eq("owner_id", user.id).single();

  if (!hotel) redirect("/dashboard");

  // Fetch billings that don't yet have a receipt
  const { data: billings } = await supabase
    .from("billings")
    .select("*")
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Receipt</h1>
        <p className="text-muted-foreground">Generate a new receipt for a billing entry</p>
      </div>
      <ReceiptForm
        hotelId={hotel.id}
        currency={hotel.currency}
        billings={billings || []}
      />
    </div>
  );
}
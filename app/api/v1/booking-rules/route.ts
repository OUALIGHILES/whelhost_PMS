import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/v1/booking-rules?hotel_id=...
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");

  if (!hotelId) {
    return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 });
  }

  // Verify hotel ownership
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("id", hotelId)
    .eq("owner_id", user.id)
    .single();

  if (hotelError || !hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const { data: bookingRules, error } = await supabase
    .from("booking_rules")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: bookingRules });
}

// POST /api/v1/booking-rules
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { hotel_id, name, rule, applies_to_all_units } = body;

  // Verify hotel ownership
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("id", hotel_id)
    .eq("owner_id", user.id)
    .single();

  if (hotelError || !hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const { data: bookingRule, error } = await supabase
    .from("booking_rules")
    .insert({
      hotel_id,
      name,
      rule,
      applies_to_all_units: applies_to_all_units !== undefined ? applies_to_all_units : true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: bookingRule });
}

// PUT /api/v1/booking-rules/[id]
export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const ruleId = url.pathname.split("/").pop(); // Extract the ID from the URL path

  if (!ruleId) {
    return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const { name, rule, applies_to_all_units } = body;

  // Verify that the rule belongs to a hotel owned by the user
  const { data: existingRule, error: fetchError } = await supabase
    .from("booking_rules")
    .select("hotel_id")
    .eq("id", ruleId)
    .single();

  if (fetchError || !existingRule) {
    return NextResponse.json({ error: "Booking rule not found" }, { status: 404 });
  }

  // Verify hotel ownership
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("id", existingRule.hotel_id)
    .eq("owner_id", user.id)
    .single();

  if (hotelError || !hotel) {
    return NextResponse.json({ error: "Unauthorized to update this rule" }, { status: 403 });
  }

  const { data: bookingRule, error } = await supabase
    .from("booking_rules")
    .update({
      name,
      rule,
      applies_to_all_units: applies_to_all_units !== undefined ? applies_to_all_units : true,
    })
    .eq("id", ruleId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: bookingRule });
}

// DELETE /api/v1/booking-rules/[id]
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const ruleId = url.pathname.split("/").pop(); // Extract the ID from the URL path

  if (!ruleId) {
    return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
  }

  // Verify that the rule belongs to a hotel owned by the user
  const { data: existingRule, error: fetchError } = await supabase
    .from("booking_rules")
    .select("hotel_id")
    .eq("id", ruleId)
    .single();

  if (fetchError || !existingRule) {
    return NextResponse.json({ error: "Booking rule not found" }, { status: 404 });
  }

  // Verify hotel ownership
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("id", existingRule.hotel_id)
    .eq("owner_id", user.id)
    .single();

  if (hotelError || !hotel) {
    return NextResponse.json({ error: "Unauthorized to delete this rule" }, { status: 403 });
  }

  const { error } = await supabase
    .from("booking_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Booking rule deleted successfully" });
}
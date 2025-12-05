"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

// Define types for different settings
export interface HotelSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  paymentMethods: string[];
  taxRate: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserPermission {
  id: string;
  roleName: string;
  permissions: string[];
  description: string;
}

export async function getHotelSettings(): Promise<HotelSettings> {
  const supabase = await createClient();
  const user = await requireAuth();

  // Get the user's hotel
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select(`
      id,
      name,
      address,
      phone,
      email,
      check_in_time,
      check_out_time,
      cancellation_policy,
      payment_methods,
      tax_rate,
      currency,
      created_at,
      updated_at
    `)
    .eq("owner_id", user.id)
    .single();

  if (hotelError || !userHotels) {
    console.error("Error fetching hotel settings:", hotelError);
    // Return default settings if no hotel exists
    return {
      id: "default",
      name: "Default Hotel",
      address: "",
      phone: "",
      email: user.email || "",
      checkInTime: "15:00",
      checkOutTime: "12:00",
      cancellationPolicy: "24 hours before check-in",
      paymentMethods: ["Cash", "Credit Card"],
      taxRate: 15,
      currency: "SAR",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: userHotels.id,
    name: userHotels.name || "Hotel Name",
    address: userHotels.address || "",
    phone: userHotels.phone || "",
    email: userHotels.email || user.email || "",
    checkInTime: userHotels.check_in_time || "15:00",
    checkOutTime: userHotels.check_out_time || "12:00",
    cancellationPolicy: userHotels.cancellation_policy || "24 hours before check-in",
    paymentMethods: userHotels.payment_methods || ["Cash", "Credit Card"],
    taxRate: userHotels.tax_rate || 15,
    currency: userHotels.currency || "SAR",
    createdAt: userHotels.created_at || new Date().toISOString(),
    updatedAt: userHotels.updated_at || new Date().toISOString(),
  };
}

export async function updateHotelSettings(settings: Partial<HotelSettings>): Promise<HotelSettings> {
  const supabase = await createClient();
  const user = await requireAuth();

  // Get the user's hotel to update
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (hotelError || !userHotels) {
    throw new Error("No hotel found for user");
  }

  // Update the hotel settings
  const { data, error } = await supabase
    .from("hotels")
    .update({
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      check_in_time: settings.checkInTime,
      check_out_time: settings.checkOutTime,
      cancellation_policy: settings.cancellationPolicy,
      payment_methods: settings.paymentMethods,
      tax_rate: settings.taxRate,
      currency: settings.currency,
    })
    .eq("id", userHotels.id)
    .select(`
      id,
      name,
      address,
      phone,
      email,
      check_in_time,
      check_out_time,
      cancellation_policy,
      payment_methods,
      tax_rate,
      currency,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error("Error updating hotel settings:", error);
    throw new Error("Failed to update hotel settings: " + error.message);
  }

  return {
    id: data.id,
    name: data.name || "Hotel Name",
    address: data.address || "",
    phone: data.phone || "",
    email: data.email || user.email || "",
    checkInTime: data.check_in_time || "15:00",
    checkOutTime: data.check_out_time || "12:00",
    cancellationPolicy: data.cancellation_policy || "24 hours before check-in",
    paymentMethods: data.payment_methods || ["Cash", "Credit Card"],
    taxRate: data.tax_rate || 15,
    currency: data.currency || "SAR",
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}

export async function getPricingRules(): Promise<PricingRule[]> {
  const supabase = await createClient();
  const user = await requireAuth();

  // Get the user's hotels
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("owner_id", user.id);

  if (hotelError || !userHotels || userHotels.length === 0) {
    console.error("Error fetching user hotels:", hotelError);
    return [];
  }

  const hotelIds = userHotels.map(hotel => hotel.id);

  // Get pricing rules for the user's hotels
  const { data: pricingRules, error: rulesError } = await supabase
    .from("pricing_rules")
    .select(`
      id,
      name,
      description,
      rule_type,
      value,
      start_date,
      end_date,
      is_active,
      created_at
    `)
    .in("hotel_id", hotelIds);

  if (rulesError) {
    console.warn("Error fetching pricing rules:", rulesError.message);
    // If pricing_rules table doesn't exist, return empty array
    return [];
  }

  return pricingRules.map(rule => ({
    id: rule.id,
    name: rule.name,
    description: rule.description || "",
    ruleType: rule.rule_type || "base",
    value: rule.value || 0,
    startDate: rule.start_date || new Date().toISOString().split('T')[0],
    endDate: rule.end_date || new Date().toISOString().split('T')[0],
    isActive: rule.is_active || true,
  }));
}

export async function getUserPermissions(): Promise<UserPermission[]> {
  const supabase = await createClient();
  const user = await requireAuth();

  // Get the user's hotels
  const { data: userHotels, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("owner_id", user.id);

  if (hotelError || !userHotels || userHotels.length === 0) {
    console.error("Error fetching user hotels:", hotelError);
    return [];
  }

  const hotelIds = userHotels.map(hotel => hotel.id);

  // Get user permissions/roles for the user's hotels
  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select(`
      id,
      name as roleName,
      permissions,
      description
    `)
    .in("hotel_id", hotelIds);

  if (rolesError) {
    console.warn("Error fetching user permissions:", rolesError.message);
    // If roles table doesn't exist, return empty array
    return [];
  }

  return roles.map(role => ({
    id: role.id,
    roleName: role.roleName,
    permissions: role.permissions || [],
    description: role.description || "",
  }));
}
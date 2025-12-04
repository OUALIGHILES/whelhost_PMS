export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "guest" | "staff" | "admin" | "owner" | "super_admin"
  is_premium: boolean
  premium_expires_at: string | null
  phone: string | null
  nationality: string | null
  id_type: string | null
  id_number: string | null
  created_at: string
  updated_at: string
}

export interface Hotel {
  id: string
  owner_id: string
  name: string
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  timezone: string
  currency: string
  check_in_time: string
  check_out_time: string
  created_at: string
  updated_at: string
}

export interface RoomType {
  id: string
  hotel_id: string
  name: string
  description: string | null
  base_price: number
  max_occupancy: number
  amenities: string[]
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  hotel_id: string
  room_type_id: string | null
  name: string
  floor: number | null
  status: "available" | "occupied" | "maintenance" | "blocked"
  smart_lock_id: string | null
  notes: string | null
  is_visible: boolean
  created_at: string
  updated_at: string
  room_type?: RoomType
}

export interface Guest {
  id: string
  hotel_id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  id_type: string | null
  id_number: string | null
  nationality: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  hotel_id: string
  unit_id: string | null
  guest_id: string | null
  check_in: string
  check_out: string
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show"
  source: "direct" | "booking_com" | "airbnb" | "expedia" | "channex" | "other"
  adults: number
  children: number
  total_amount: number | null
  paid_amount: number
  notes: string | null
  special_requests: string | null
  external_id: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  checked_in_by: string | null
  checked_out_by: string | null
  created_at: string
  updated_at: string
  unit?: Unit
  guest?: Guest
}

export interface Invoice {
  id: string
  hotel_id: string
  booking_id: string | null
  guest_id: string | null
  invoice_number: string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  subtotal: number
  tax_amount: number
  total_amount: number
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  guest?: Guest
  booking?: Booking
}

export interface Payment {
  id: string
  hotel_id: string
  invoice_id: string | null
  booking_id: string | null
  amount: number
  method: "cash" | "card" | "bank_transfer" | "moyasar" | "other"
  status: "pending" | "completed" | "failed" | "refunded"
  moyasar_payment_id: string | null
  reference: string | null
  notes: string | null
  created_at: string
}

export interface Message {
  id: string
  hotel_id: string
  sender_id: string | null
  recipient_id: string | null
  booking_id: string | null
  subject: string | null
  content: string
  is_read: boolean
  message_type: "internal" | "guest" | "system" | "channel"
  channel_message_id: string | null
  created_at: string
  sender?: Profile
  recipient?: Profile
}

export interface Task {
  id: string
  hotel_id: string
  assigned_to: string | null
  created_by: string | null
  unit_id: string | null
  booking_id: string | null
  title: string
  description: string | null
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
  unit?: Unit
}

export interface SmartLock {
  id: string
  hotel_id: string
  unit_id: string | null
  device_id: string
  name: string
  provider: "ttlock" | "nuki" | "august" | "esp32" | "generic"
  status: "online" | "offline" | "low_battery" | "error"
  battery_level: number | null
  last_activity: string | null
  credentials: Record<string, unknown> | null
  created_at: string
  updated_at: string
  unit?: Unit
}

export interface AccessCode {
  id: string
  smart_lock_id: string
  booking_id: string | null
  code: string
  valid_from: string
  valid_until: string
  is_active: boolean
  issued_to: string | null
  provider_response: Record<string, unknown> | null
  created_at: string
}

export interface Channel {
  id: string
  hotel_id: string
  name: string
  type: "ota" | "direct" | "corporate" | "channex" | "other"
  is_active: boolean
  commission_rate: number
  api_key: string | null
  property_id: string | null
  webhook_secret: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WebhookLog {
  id: string
  hotel_id: string | null
  provider: string
  event_type: string
  external_id: string | null
  payload: Record<string, unknown>
  status: "received" | "processing" | "processed" | "failed"
  error_message: string | null
  retry_count: number
  created_at: string
  processed_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  plan: "monthly" | "yearly"
  status: "active" | "cancelled" | "expired"
  moyasar_subscription_id: string | null
  amount: number
  currency: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export interface BookingRule {
  id: string
  hotel_id: string
  name: string
  rule: string
  applies_to_all_units: boolean
  created_at: string
  updated_at: string
}

// Channex webhook payload types
export interface ChannexBookingPayload {
  external_id: string
  external_unit_id: string
  channel: string
  checkin: string
  checkout: string
  guest: {
    name: string
    email?: string
    phone?: string
  }
  total_amount: number
  currency: string
  status?: string
}

export interface Notification {
  id: string
  hotel_id: string
  user_id: string | null // null for system notifications
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "booking" | "task" | "payment" | "system"
  data: Record<string, unknown> | null // Additional data associated with the notification
  is_read: boolean
  created_at: string
}

export interface ChannexMessagePayload {
  external_id: string
  booking_id: string
  sender: string
  content: string
  timestamp: string
}

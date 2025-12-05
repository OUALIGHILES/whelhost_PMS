-- Complete Hotel Reservation System Schema
-- Drops all existing tables and recreates them with the correct structure

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- First, drop the trigger on auth.users that references our function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop triggers only if they exist (on our tables)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
  DROP TRIGGER IF EXISTS update_hotels_updated_at ON public.hotels;
  DROP TRIGGER IF EXISTS update_room_types_updated_at ON public.room_types;
  DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
  DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
  DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
  DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
  DROP TRIGGER IF EXISTS update_smart_locks_updated_at ON public.smart_locks;
  DROP TRIGGER IF EXISTS update_channels_updated_at ON public.channels;
  DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
  DROP TRIGGER IF EXISTS update_unit_status_on_booking ON public.bookings;
  DROP TRIGGER IF EXISTS update_booking_paid_amount_on_insert ON public.payments;
  DROP TRIGGER IF EXISTS update_booking_paid_amount_on_update ON public.payments;
  DROP TRIGGER IF EXISTS update_booking_paid_amount_on_delete ON public.payments;
EXCEPTION
  WHEN undefined_table OR undefined_object THEN
    -- Ignore errors if tables don't exist yet
    NULL;
END $$;

-- Drop functions only if they exist
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
  DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
  DROP FUNCTION IF EXISTS public.generate_invoice_number(UUID) CASCADE;
  DROP FUNCTION IF EXISTS public.update_unit_status() CASCADE;
  DROP FUNCTION IF EXISTS public.update_booking_paid_amount(UUID) CASCADE;
  DROP FUNCTION IF EXISTS public.update_booking_paid_amount_on_payment_change() CASCADE;
EXCEPTION
  WHEN undefined_function THEN
    -- Ignore if function doesn't exist
    NULL;
END $$;

-- Drop all existing tables in the correct order to avoid foreign key violations
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS smart_locks CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the complete schema

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'guest' CHECK (role IN ('guest', 'staff', 'admin', 'premium')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  phone TEXT,
  location TEXT,
  id_type TEXT,
  id_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotels/Properties table
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'SAR',
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '11:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room Types table
CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  max_occupancy INTEGER DEFAULT 2,
  amenities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units/Rooms table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  floor INTEGER,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'blocked')),
  smart_lock_id TEXT,
  notes TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  base_price DECIMAL(10,2),
  service_charges DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_type TEXT,
  id_number TEXT,
  nationality TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  source TEXT DEFAULT 'direct' CHECK (source IN ('direct', 'booking_com', 'airbnb', 'expedia', 'other')),
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  external_id TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  checked_out_by UUID REFERENCES profiles(id),
  notes TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'bank_transfer', 'moyasar', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  moyasar_payment_id TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  message_type TEXT DEFAULT 'internal' CHECK (message_type IN ('internal', 'guest', 'system')),
  channel_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Locks table
CREATE TABLE public.smart_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT DEFAULT 'generic',
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'low_battery', 'error')),
  battery_level INTEGER,
  credentials JSONB,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Codes table (for smart locks)
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smart_lock_id UUID REFERENCES public.smart_locks(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  issued_to TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels table (booking channels)
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ota', 'direct', 'corporate', 'other')),
  property_id TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  api_key TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  moyasar_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- null for system notifications
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'booking', 'task', 'payment', 'system')),
  data JSONB DEFAULT '{}', -- Additional data associated with the notification
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Logs table
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'received',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON public.bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_units_hotel_id ON public.units(hotel_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_tasks_hotel_id ON public.tasks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_messages_hotel_id ON public.messages(hotel_id);
CREATE INDEX IF NOT EXISTS idx_invoices_hotel_id ON public.invoices(hotel_id);
CREATE INDEX IF NOT EXISTS idx_payments_hotel_id ON public.payments(hotel_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_moyasar_id ON public.payments(moyasar_payment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_hotel_id ON public.notifications(hotel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_idempotency ON public.webhook_logs(provider, external_id, event_type);

-- Create unique index on channels for hotel + type
CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_hotel_type ON channels(hotel_id, type);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Hotels policies
CREATE POLICY "Users can view own hotels" ON public.hotels
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own hotels" ON public.hotels
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own hotels" ON public.hotels
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own hotels" ON public.hotels
  FOR DELETE USING (owner_id = auth.uid());

-- Room Types policies
CREATE POLICY "Users can manage room types of own hotels" ON public.room_types
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Units policies
CREATE POLICY "Users can manage units of own hotels" ON public.units
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Guests policies
CREATE POLICY "Users can manage guests of own hotels" ON public.guests
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Bookings policies
CREATE POLICY "Users can manage bookings of own hotels" ON public.bookings
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Invoices policies
CREATE POLICY "Users can manage invoices of own hotels" ON public.invoices
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Invoice Items policies
CREATE POLICY "Users can manage invoice items of own invoices" ON public.invoice_items
  FOR ALL USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.hotels h ON i.hotel_id = h.id
      WHERE h.owner_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can manage payments of own hotels" ON public.payments
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid() OR
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- Tasks policies
CREATE POLICY "Users can manage tasks of own hotels" ON public.tasks
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
    OR assigned_to = auth.uid()
  );

-- Smart Locks policies
CREATE POLICY "Users can manage smart locks of own hotels" ON public.smart_locks
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Access Codes policies
CREATE POLICY "Users can manage access codes of own hotels" ON public.access_codes
  FOR ALL USING (
    smart_lock_id IN (
      SELECT sl.id FROM public.smart_locks sl
      JOIN public.hotels h ON sl.hotel_id = h.id
      WHERE h.owner_id = auth.uid()
    )
  );

-- Channels policies
CREATE POLICY "Users can manage channels of own hotels" ON public.channels
  FOR ALL USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view notifications for their hotels" ON public.notifications
  FOR SELECT USING (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE owner_id = auth.uid()
    )
    OR
    hotel_id IN (
      SELECT h.id FROM public.hotels h
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can insert notifications for their hotels" ON public.notifications
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notifications for their hotels" ON public.notifications
  FOR UPDATE USING (
    hotel_id IN (
      SELECT id FROM public.hotels WHERE owner_id = auth.uid()
    )
  );

-- Webhook logs policies
CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (true);

-- Functions and Triggers

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, location, id_type, id_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.user_metadata->>'full_name', NEW.user_metadata->>'name', ''),
    COALESCE(NEW.user_metadata->>'avatar_url', NEW.user_metadata->>'avatar', ''),
    COALESCE(NEW.user_metadata->>'phone', ''),
    COALESCE(NEW.user_metadata->>'location', ''),
    COALESCE(NEW.user_metadata->>'id_type', ''),
    COALESCE(NEW.user_metadata->>'id_number', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_types_updated_at
  BEFORE UPDATE ON public.room_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_locks_updated_at
  BEFORE UPDATE ON public.smart_locks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(hotel_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  hotel_prefix TEXT;
  next_number INTEGER;
BEGIN
  SELECT UPPER(LEFT(name, 3)) INTO hotel_prefix FROM public.hotels WHERE id = hotel_uuid;
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE hotel_id = hotel_uuid;
  RETURN hotel_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update unit status based on bookings
CREATE OR REPLACE FUNCTION public.update_unit_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'checked_in' THEN
      UPDATE public.units SET status = 'occupied' WHERE id = NEW.unit_id;
    ELSIF NEW.status IN ('checked_out', 'cancelled') THEN
      UPDATE public.units SET status = 'available' WHERE id = NEW.unit_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unit_status_on_booking
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_unit_status();

-- Function to update the paid amount on a booking based on its payments
CREATE OR REPLACE FUNCTION public.update_booking_paid_amount(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the booking's paid_amount based on the sum of completed payments
  UPDATE public.bookings
  SET paid_amount = COALESCE(
    (SELECT SUM(amount)
     FROM public.payments
     WHERE booking_id = p_booking_id
       AND status = 'completed'),
    0
  )
  WHERE id = p_booking_id;
END;
$$;

-- Create a trigger to automatically update the paid amount when payments are inserted/updated
CREATE OR REPLACE FUNCTION public.update_booking_paid_amount_on_payment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the booking's paid amount after insert/update/delete on payments
  PERFORM update_booking_paid_amount(COALESCE(NEW.booking_id, OLD.booking_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for payment table
CREATE TRIGGER update_booking_paid_amount_on_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_paid_amount_on_payment_change();

CREATE TRIGGER update_booking_paid_amount_on_update
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_paid_amount_on_payment_change();

CREATE TRIGGER update_booking_paid_amount_on_delete
  AFTER DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_paid_amount_on_payment_change();
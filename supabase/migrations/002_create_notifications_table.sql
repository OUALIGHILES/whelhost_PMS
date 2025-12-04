-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  content TEXT,
  message TEXT, -- Keeping this for backward compatibility
  notification_type TEXT DEFAULT 'general' CHECK (notification_type IN ('general', 'message', 'invoice', 'billing', 'booking', 'task', 'payment', 'report')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_hotel_id_idx ON notifications(hotel_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_booking_id_idx ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own hotel notifications" ON public.notifications
  FOR SELECT USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into their own hotel notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hotel notifications" ON public.notifications
  FOR UPDATE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own hotel notifications" ON public.notifications
  FOR DELETE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );
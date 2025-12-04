-- Billing and Receipts Schema for Hotel Reservation App

-- Billings table
CREATE TABLE IF NOT EXISTS public.billings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  billing_id UUID REFERENCES public.billings(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'card')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_billings_hotel_id ON public.billings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_billings_booking_id ON public.billings(booking_id);
CREATE INDEX IF NOT EXISTS idx_billings_category ON public.billings(category);
CREATE INDEX IF NOT EXISTS idx_receipts_hotel_id ON public.receipts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_receipts_billing_id ON public.receipts(billing_id);
CREATE INDEX IF NOT EXISTS idx_receipts_booking_id ON public.receipts(booking_id);

-- Enable Row Level Security
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billings
CREATE POLICY "Users can view their own hotel billings" ON public.billings
  FOR SELECT USING (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into their own hotel billings" ON public.billings
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hotel billings" ON public.billings
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own hotel billings" ON public.billings
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

-- Create RLS policies for receipts
CREATE POLICY "Users can view their own hotel receipts" ON public.receipts
  FOR SELECT USING (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into their own hotel receipts" ON public.receipts
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hotel receipts" ON public.receipts
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own hotel receipts" ON public.receipts
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotels.id FROM public.hotels
      WHERE hotels.owner_id = auth.uid()
    )
  );
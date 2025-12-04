-- Create the bills table if it doesn't already exist

-- First, ensure the 'billings' table exists with the required columns
CREATE TABLE IF NOT EXISTS billings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS billing_hotel_id_idx ON billings(hotel_id);
CREATE INDEX IF NOT EXISTS billing_created_at_idx ON billings(created_at);
CREATE INDEX IF NOT EXISTS billing_date_idx ON billings(date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON billings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for security
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;

-- Create a receipts table for tracking payments
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'card')),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for receipts table
CREATE INDEX IF NOT EXISTS receipts_hotel_id_idx ON receipts(hotel_id);
CREATE INDEX IF NOT EXISTS receipts_created_at_idx ON receipts(created_at);

-- RLS policies for receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their own data
CREATE POLICY "Users can view their own bills"
  ON billings FOR SELECT
  TO authenticated
  USING (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own bills"
  ON billings FOR INSERT
  TO authenticated
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own bills"
  ON billings FOR UPDATE
  TO authenticated
  USING (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own bills"
  ON billings FOR DELETE
  TO authenticated
  USING (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (hotel_id IN (SELECT id FROM hotels WHERE user_id = auth.uid()));
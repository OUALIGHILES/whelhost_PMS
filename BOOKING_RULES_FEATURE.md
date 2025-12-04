# Simple Booking Rules Feature for Hotel Reservation App

This feature allows hotel owners to define and manage simple booking rules in the dashboard settings page. These rules help control booking conditions and policies for their properties.

## SQL Schema Setup

To set up the simplified booking rules functionality, run the following SQL script in the Supabase SQL Editor:

```sql
-- SQL Script to Run in Supabase SQL Editor
-- This script adds booking rules functionality to the hotel reservation system

-- Step 1: Create the booking_rules table
CREATE TABLE IF NOT EXISTS public.booking_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Name of the rule
    rule TEXT NOT NULL, -- The actual rule text
    applies_to_all_units BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_booking_rules_hotel_id ON public.booking_rules (hotel_id);

-- Step 3: Set up Row Level Security (RLS) policies
ALTER TABLE public.booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hotel booking rules" ON public.booking_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hotels h
            WHERE h.id = booking_rules.hotel_id
            AND h.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own hotel booking rules" ON public.booking_rules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hotels h
            WHERE h.id = booking_rules.hotel_id
            AND h.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own hotel booking rules" ON public.booking_rules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.hotels h
            WHERE h.id = booking_rules.hotel_id
            AND h.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own hotel booking rules" ON public.booking_rules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.hotels h
            WHERE h.id = booking_rules.hotel_id
            AND h.owner_id = auth.uid()
        )
    );

-- Step 4: Add updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for booking_rules table
CREATE TRIGGER booking_rules_updated_at
    BEFORE UPDATE ON public.booking_rules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Verify the table was created successfully
SELECT * FROM information_schema.tables WHERE table_name = 'booking_rules';

-- Verify the RLS policies were created
SELECT * FROM pg_policies WHERE tablename = 'booking_rules';

-- Test: Show existing booking rules
SELECT * FROM public.booking_rules LIMIT 10;
```

## How to Use the Booking Rules Feature

1. Log in to the dashboard as a hotel owner
2. Navigate to the Settings page
3. Click on the "Booking Rules" tab
4. Use the form to add new booking rules with the following options:
   - Rule Name: A descriptive name for the rule
   - Rule: The actual text of the booking rule
   - Applies to all units: Toggle to apply the rule to all units in the hotel

## API Endpoints

The booking rules feature includes the following API endpoints:

- `GET /api/v1/booking-rules?hotel_id=...` - Retrieve booking rules for a specific hotel
- `POST /api/v1/booking-rules` - Create a new booking rule
- `PUT /api/v1/booking-rules/[id]` - Update an existing booking rule
- `DELETE /api/v1/booking-rules/[id]` - Delete a booking rule

## Security

- Row Level Security (RLS) ensures that hotel owners can only view, create, update, and delete booking rules for their own hotels
- Authentication is required for all API operations
- All database operations are properly validated and sanitized

## Data Structure

Each booking rule has the following properties:
- id: Unique identifier for the rule
- hotel_id: The hotel this rule applies to
- name: Display name for the rule
- rule: The actual rule text
- applies_to_all_units: Whether the rule applies to all units or not
- created_at/updated_at: Timestamps for record keeping
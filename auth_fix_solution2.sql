-- Solution 2: Alternative approach using Supabase recommended practices
-- This addresses the issue by using the correct RLS policies for auth triggers

-- First, ensure the profiles table has the right structure
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the trigger function with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    phone, 
    location, 
    id_type, 
    id_number
  )
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but return NEW to not break auth flow
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
SET session_replication_role = replica;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the correct RLS policies to allow the trigger to work
-- Remove existing policies that might conflict
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow individual access to own profile data" ON public.profiles;
  DROP POLICY IF EXISTS "Allow service role full access to profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if policies don't exist
    NULL;
END $$;

-- Create RLS policies that allow the auth trigger to work
-- The key is to allow service_role full access which is required for auth triggers
CREATE POLICY "Profiles are viewable by users who created them" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role manages user profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
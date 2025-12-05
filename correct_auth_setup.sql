-- Proper fix for Supabase auth trigger with correct RLS setup

-- First, drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Ensure the profiles table exists with correct structure
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

-- Enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a more permissive RLS policy for the auth trigger to work
-- This allows authenticated users to insert their own profile
-- and also allows service_role to manage profiles
CREATE POLICY "Allow individual access to own profile data" ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a specific policy for service role to bypass RLS
CREATE POLICY "Allow service role full access to profiles" ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create the handle_new_user function with correct security context
-- The SECURITY DEFINER with proper search_path ensures it runs with elevated privileges
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger to run after user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
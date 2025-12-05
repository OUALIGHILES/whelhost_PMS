-- Solution 1: Use a more permissive policy for the auth trigger specifically
-- This is the recommended approach for Supabase authentication triggers

-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function that will handle new user signup
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

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the RLS policies on profiles allow the trigger to work
-- First remove any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual access to own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role full access to profiles" ON public.profiles;

-- Create basic policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Most importantly: Allow the service_role to manage profiles (for the auth trigger)
CREATE POLICY "Service role full access to profiles" ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow insertion for the case where user creates their own profile directly
CREATE POLICY "Allow own profile insertion" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
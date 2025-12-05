-- Diagnostic script to identify the issue with profile creation

-- Check if the profiles table exists and has the correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check RLS status on profiles
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Check if the auth trigger exists
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check existing policies on profiles
SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Test if a manual insert into profiles would work (using service role context)
-- This simulates what the auth trigger does
-- You would need to run this with service_role key privileges
-- INSERT INTO profiles (id, email, full_name) VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User');
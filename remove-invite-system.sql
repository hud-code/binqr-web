-- Remove invite-only system and enable open signup
-- Run this in your Supabase SQL Editor

-- 1. Remove invite-related policies for anonymous users
DROP POLICY IF EXISTS "Allow anon to use invite codes during signup" ON public.invites;
DROP POLICY IF EXISTS "Allow anon to update profiles during signup" ON public.profiles;

-- 2. Allow anonymous users to insert profiles during signup (this is all they need)
CREATE POLICY "Allow anon to create profiles during signup" ON public.profiles
  FOR INSERT TO anon
  WITH CHECK (true);

-- 3. Optional: If you want to keep the invites table but disable the system,
-- you can leave it as is. If you want to completely remove it:
-- DROP TABLE IF EXISTS public.invites CASCADE;
-- DROP TYPE IF EXISTS invite_status CASCADE;

-- 4. Remove invite-related columns from profiles table (optional)
-- Uncomment the lines below if you want to completely remove invite tracking:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS invite_code;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS invited_by;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS invites_remaining;

SELECT 'Open signup enabled! Anyone can now create an account.' as result;
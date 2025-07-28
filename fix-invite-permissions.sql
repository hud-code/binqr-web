-- Fix invite code permissions and policies for signup process
-- Run this in your Supabase SQL Editor

-- 1. Grant execute permissions to anonymous users for signup
GRANT EXECUTE ON FUNCTION use_invite_code(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_code(TEXT) TO anon;

-- 2. Allow anonymous users to update invites during signup process
CREATE POLICY "Allow anon to use invite codes during signup" ON public.invites
  FOR UPDATE TO anon
  USING (status = 'pending' AND expires_at > timezone('utc'::text, now()));

-- 3. Allow anonymous users to insert into profiles during signup  
CREATE POLICY "Allow anon to create profiles during signup" ON public.profiles
  FOR INSERT TO anon
  WITH CHECK (true);

-- 4. Check current invite status
SELECT 'Checking invite KYP8MIIG:' as info;
SELECT * FROM invites WHERE code = 'KYP8MIIG';

-- 5. Test the function (replace the UUID with a test UUID)
SELECT 'Testing use_invite_code function:' as info;
-- Don't run this with real user ID, just for testing
-- SELECT use_invite_code('KYP8MIIG', 'test-uuid-here');

SELECT 'Setup complete!' as result; 
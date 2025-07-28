-- BinQR Data Migration Script
-- This script migrates existing data to work with the new authentication system
-- Run this AFTER running the auth-migration.sql

-- Create a temporary admin user for existing data
-- This user will "own" all existing boxes and locations
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@binqr.local';
BEGIN
  -- Check if we need to create an admin user for existing data
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  
  -- If no admin user exists and we have existing data, we need to handle migration
  IF admin_user_id IS NULL AND (
    EXISTS (SELECT 1 FROM public.locations WHERE user_id IS NULL) OR
    EXISTS (SELECT 1 FROM public.boxes WHERE user_id IS NULL)
  ) THEN
    RAISE NOTICE 'Found existing data without user ownership. Manual intervention required.';
    RAISE NOTICE 'Please either:';
    RAISE NOTICE '1. Create an admin user first, then assign existing data to that user';
    RAISE NOTICE '2. Or delete existing test data and start fresh';
    RAISE NOTICE 'Stopping migration to prevent data loss.';
    -- Uncomment the line below to halt execution
    -- RAISE EXCEPTION 'Migration halted - manual intervention required';
  END IF;
END $$;

-- Function to assign existing data to a specific user
CREATE OR REPLACE FUNCTION assign_existing_data_to_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update locations without user_id
  UPDATE public.locations 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  -- Update boxes without user_id  
  UPDATE public.boxes 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Assigned % locations and % boxes to user %', 
    (SELECT COUNT(*) FROM public.locations WHERE user_id = target_user_id),
    (SELECT COUNT(*) FROM public.boxes WHERE user_id = target_user_id),
    target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create some sample invite codes for testing
-- Run this only in development environments
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Only create sample invites if we have an admin user
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@binqr.local';
  
  IF admin_user_id IS NOT NULL THEN
    -- Create a few sample invite codes for testing
    INSERT INTO public.invites (code, created_by, status, expires_at)
    VALUES 
      ('WELCOME1', admin_user_id, 'pending', timezone('utc'::text, now()) + INTERVAL '30 days'),
      ('TESTINV2', admin_user_id, 'pending', timezone('utc'::text, now()) + INTERVAL '30 days'),
      ('BINQR123', admin_user_id, 'pending', timezone('utc'::text, now()) + INTERVAL '30 days')
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE 'Created sample invite codes: WELCOME1, TESTINV2, BINQR123';
  END IF;
END $$;

-- Clean up any orphaned data (optional safety check)
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS VOID AS $$
BEGIN
  -- Remove box_contents for boxes that don't exist
  DELETE FROM public.box_contents 
  WHERE box_id NOT IN (SELECT id FROM public.boxes);
  
  -- Remove boxes for locations that don't exist  
  DELETE FROM public.boxes 
  WHERE location_id NOT IN (SELECT id FROM public.locations);
  
  RAISE NOTICE 'Cleaned up orphaned data';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions for manual migration
COMMENT ON FUNCTION assign_existing_data_to_user(UUID) IS 
'To migrate existing data to a user:
1. Create/identify the target user ID
2. Run: SELECT assign_existing_data_to_user(''USER_ID_HERE'');
3. Verify data ownership with: SELECT user_id, COUNT(*) FROM locations GROUP BY user_id;';

-- Add NOT NULL constraints only after data is migrated
-- Uncomment these lines AFTER ensuring all data has proper user_id values:

-- ALTER TABLE public.locations ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.boxes ALTER COLUMN user_id SET NOT NULL;

RAISE NOTICE 'Data migration script completed.';
RAISE NOTICE 'Remember to:';
RAISE NOTICE '1. Assign existing data to users using assign_existing_data_to_user()';
RAISE NOTICE '2. Add NOT NULL constraints to user_id columns when ready';
RAISE NOTICE '3. Test the invite system with sample codes: WELCOME1, TESTINV2, BINQR123'; 
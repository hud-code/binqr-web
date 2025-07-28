-- BinQR Authentication Migration
-- This migration adds user authentication support with invite-only system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for invite system
CREATE TYPE invite_status AS ENUM ('pending', 'used', 'expired', 'revoked');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  invite_code TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invites_remaining INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create invites table for managing invite codes
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status invite_status DEFAULT 'pending' NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Add user_id columns to existing tables
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.boxes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_invite_code_idx ON public.profiles(invite_code);
CREATE INDEX IF NOT EXISTS profiles_invited_by_idx ON public.profiles(invited_by);
CREATE INDEX IF NOT EXISTS invites_code_idx ON public.invites(code);
CREATE INDEX IF NOT EXISTS invites_created_by_idx ON public.invites(created_by);
CREATE INDEX IF NOT EXISTS invites_status_idx ON public.invites(status);
CREATE INDEX IF NOT EXISTS locations_user_id_idx ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS boxes_user_id_idx ON public.boxes(user_id);

-- Update existing triggers for profiles
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Drop existing open policies
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can update locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can delete locations" ON public.locations;

DROP POLICY IF EXISTS "Anyone can view boxes" ON public.boxes;
DROP POLICY IF EXISTS "Anyone can insert boxes" ON public.boxes;
DROP POLICY IF EXISTS "Anyone can update boxes" ON public.boxes;
DROP POLICY IF EXISTS "Anyone can delete boxes" ON public.boxes;

DROP POLICY IF EXISTS "Anyone can view box_contents" ON public.box_contents;
DROP POLICY IF EXISTS "Anyone can insert box_contents" ON public.box_contents;
DROP POLICY IF EXISTS "Anyone can update box_contents" ON public.box_contents;
DROP POLICY IF EXISTS "Anyone can delete box_contents" ON public.box_contents;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for invites
CREATE POLICY "Users can view invites they created" ON public.invites
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create invites" ON public.invites
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own invites" ON public.invites
  FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for locations (user-specific)
CREATE POLICY "Users can view their own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON public.locations
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for boxes (user-specific)
CREATE POLICY "Users can view their own boxes" ON public.boxes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boxes" ON public.boxes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boxes" ON public.boxes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boxes" ON public.boxes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for box_contents (through box ownership)
CREATE POLICY "Users can view contents of their own boxes" ON public.box_contents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boxes 
      WHERE boxes.id = box_contents.box_id 
      AND boxes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add contents to their own boxes" ON public.box_contents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boxes 
      WHERE boxes.id = box_contents.box_id 
      AND boxes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contents of their own boxes" ON public.box_contents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.boxes 
      WHERE boxes.id = box_contents.box_id 
      AND boxes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contents from their own boxes" ON public.box_contents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.boxes 
      WHERE boxes.id = box_contents.box_id 
      AND boxes.user_id = auth.uid()
    )
  );

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    -- Generate 8-character alphanumeric code (readable, no confusing chars)
    code := UPPER(
      TRANSLATE(
        encode(gen_random_bytes(6), 'base64'),
        '/+0O1Il', 
        'ABCDEFG'
      )
    );
    code := LEFT(code, 8);
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.invites WHERE invites.code = code) THEN
      done := TRUE;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to validate invite code during signup
CREATE OR REPLACE FUNCTION validate_invite_code(invite_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invites 
    WHERE code = invite_code 
    AND status = 'pending' 
    AND expires_at > timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use an invite code
CREATE OR REPLACE FUNCTION use_invite_code(invite_code TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get the invite record
  SELECT * INTO invite_record 
  FROM public.invites 
  WHERE code = invite_code 
  AND status = 'pending' 
  AND expires_at > timezone('utc'::text, now());
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark invite as used
  UPDATE public.invites 
  SET 
    status = 'used',
    used_by = user_id,
    used_at = timezone('utc'::text, now())
  WHERE code = invite_code;
  
  -- Update user profile with invite info
  UPDATE public.profiles 
  SET 
    invite_code = invite_code,
    invited_by = invite_record.created_by
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invite codes
CREATE OR REPLACE FUNCTION create_invite(creator_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  invites_left INTEGER;
BEGIN
  -- Check if user has invites remaining
  SELECT invites_remaining INTO invites_left 
  FROM public.profiles 
  WHERE id = creator_id;
  
  IF invites_left <= 0 THEN
    RAISE EXCEPTION 'No invites remaining';
  END IF;
  
  -- Generate new code
  new_code := generate_invite_code();
  
  -- Create invite record
  INSERT INTO public.invites (code, created_by)
  VALUES (new_code, creator_id);
  
  -- Decrease remaining invites
  UPDATE public.profiles 
  SET invites_remaining = invites_remaining - 1
  WHERE id = creator_id;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Insert some default locations for new users (these will be user-specific after migration)
-- We'll handle existing data migration separately 
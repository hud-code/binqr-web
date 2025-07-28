# BinQR Authentication Migration Guide

This directory contains SQL migration scripts to add invite-only authentication to the BinQR app.

## 🚀 Migration Overview

The migration transforms BinQR from an open app to an invite-only system with:

- User profiles and authentication via Supabase Auth
- Invite code system (8-character readable codes, 30-day expiry)
- Row Level Security (RLS) for data privacy
- User ownership of boxes and locations

## 📋 Migration Steps

### 1. Run the Authentication Migration

Execute the main migration script in your Supabase SQL editor:

```sql
-- Run this first
\i supabase/auth-migration.sql
```

This will:

- ✅ Create `profiles` table (extends auth.users)
- ✅ Create `invites` table for invite code management
- ✅ Add `user_id` columns to existing tables
- ✅ Set up Row Level Security policies
- ✅ Create invite code generation functions

### 2. Handle Existing Data

If you have existing boxes/locations, run the data migration:

```sql
-- Run this second (if you have existing data)
\i supabase/data-migration.sql
```

#### For Existing Data:

1. **Create an admin user** (via Supabase Auth UI or signup)
2. **Assign existing data** to the admin user:
   ```sql
   SELECT assign_existing_data_to_user('USER_ID_HERE');
   ```
3. **Add NOT NULL constraints** when ready:
   ```sql
   ALTER TABLE public.locations ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE public.boxes ALTER COLUMN user_id SET NOT NULL;
   ```

#### For Fresh Start:

- Delete existing test data and start with authenticated users

### 3. Test the System

Sample invite codes are created for testing:

- `WELCOME1`
- `TESTINV2`
- `BINQR123`

## 🔑 Key Features

### Invite System

- **8-character codes**: Readable format (no confusing 0/O, 1/I/l)
- **30-day expiry**: Automatic expiration
- **5 invites per user**: Default limit (configurable)
- **Tracking**: Full audit trail of invite usage

### Database Functions

- `generate_invite_code()`: Creates unique 8-char codes
- `validate_invite_code(code)`: Checks if code is valid
- `use_invite_code(code, user_id)`: Redeems an invite
- `create_invite(creator_id)`: Creates new invite for user

### Row Level Security

- Users can only see/modify their own data
- Invites are tied to creators
- Box contents inherit permissions from box ownership

## 🛡️ Security Model

```sql
-- Users own their data
auth.uid() = user_id

-- Box contents inherit from box ownership
EXISTS (SELECT 1 FROM boxes WHERE boxes.id = box_contents.box_id AND boxes.user_id = auth.uid())

-- Invite management
auth.uid() = created_by  -- For invite creators
```

## 📊 Database Schema Changes

### New Tables

```sql
-- User profiles (extends auth.users)
profiles (
  id UUID PRIMARY KEY,  -- Links to auth.users.id
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  invite_code TEXT,     -- The code this user used
  invited_by UUID,      -- Who invited this user
  invites_remaining INT DEFAULT 5,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Invite code management
invites (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,     -- 8-character invite code
  created_by UUID,      -- User who created the invite
  used_by UUID,         -- User who used the invite (nullable)
  status invite_status, -- 'pending', 'used', 'expired', 'revoked'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ
)
```

### Updated Tables

```sql
-- Add user ownership
ALTER TABLE locations ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE boxes ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

## 🔄 Rollback Plan

If you need to rollback the migration:

```sql
-- Remove RLS policies and user columns
-- WARNING: This will remove all authentication!

-- Drop new tables
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remove user_id columns
ALTER TABLE public.locations DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.boxes DROP COLUMN IF EXISTS user_id;

-- Restore open policies (temporary - not recommended for production)
-- Re-run the original schema.sql policies
```

## 🧪 Testing

1. **Create invite codes**:

   ```sql
   SELECT create_invite(auth.uid());
   ```

2. **Validate codes**:

   ```sql
   SELECT validate_invite_code('WELCOME1');
   ```

3. **Check user data isolation**:
   - Sign up with different invite codes
   - Verify users only see their own boxes/locations

## 📝 Notes

- **Backup first**: Always backup your database before running migrations
- **Test environment**: Run migrations in a test environment first
- **Supabase Auth**: Ensure Supabase Auth is enabled in your project
- **Environment variables**: Update your app to handle authentication state

## 🚨 Troubleshooting

### Common Issues

1. **"Function auth.uid() does not exist"**

   - Ensure you're running in Supabase (not local PostgreSQL)
   - Check that RLS is enabled

2. **"User has no invites remaining"**

   - Check `profiles.invites_remaining`
   - Update: `UPDATE profiles SET invites_remaining = 5 WHERE id = 'USER_ID';`

3. **"Cannot insert due to RLS policy"**

   - Verify user is authenticated: `SELECT auth.uid();`
   - Check policy conditions match your query

4. **Existing data not visible**
   - Run data migration: `SELECT assign_existing_data_to_user('USER_ID');`
   - Verify user_id values: `SELECT user_id, COUNT(*) FROM locations GROUP BY user_id;`

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify migration ran completely
3. Test with sample invite codes first
4. Check Supabase Auth configuration

**Migration Version**: 1.0  
**Compatible with**: Supabase Auth, PostgreSQL 13+  
**Last Updated**: 2025-01-18

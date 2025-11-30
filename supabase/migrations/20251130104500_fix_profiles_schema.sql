-- Fix the profiles table so it matches the columns used throughout the app
-- and enforce consistent defaults/check constraints.

-- Ensure base columns exist so later ALTER statements succeed
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS login_preference TEXT,
  ADD COLUMN IF NOT EXISTS vai_number TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Normalize JSON shape for profile links and enforce jsonb type/default
UPDATE public.profiles
SET profile_links = COALESCE(profile_links::jsonb, '[]'::jsonb)
WHERE profile_links IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN profile_links TYPE jsonb USING COALESCE(profile_links::jsonb, '[]'::jsonb),
  ALTER COLUMN profile_links SET DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.profile_links IS
  'List of profile links (Linktree-style) stored as a JSON array';

-- Harden login preference to support every UI option (email, password, face, phone OTP)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_login_preference_check;

UPDATE public.profiles
SET login_preference = COALESCE(login_preference, 'email');

ALTER TABLE public.profiles
  ALTER COLUMN login_preference SET DEFAULT 'email',
  ALTER COLUMN login_preference SET NOT NULL,
  ADD CONSTRAINT profiles_login_preference_check
    CHECK (login_preference IN ('facial', 'email', 'password', 'phone_otp'));

COMMENT ON COLUMN public.profiles.login_preference IS
  'Preferred authentication method: facial, email, password, or phone_otp';

-- Track the user''s public role (client, provider, business, or both)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_type_check;

UPDATE public.profiles
SET user_type = COALESCE(NULLIF(user_type, ''), 'client');

ALTER TABLE public.profiles
  ALTER COLUMN user_type SET DEFAULT 'client',
  ALTER COLUMN user_type SET NOT NULL,
  ADD CONSTRAINT profiles_user_type_check
    CHECK (user_type IN ('client', 'provider', 'business', 'both'));

COMMENT ON COLUMN public.profiles.user_type IS
  'Role classification used by discovery filters (client/provider/business/both)';

-- Store the primary V.A.I. identifier and keep it unique when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_vai_number
  ON public.profiles (vai_number)
  WHERE vai_number IS NOT NULL;

COMMENT ON COLUMN public.profiles.vai_number IS
  'Primary V.A.I. identifier returned from ChainPass';

-- Optional free-form location string surfaced on mutual profile views/search
COMMENT ON COLUMN public.profiles.location IS
  'User provided location string displayed on their profile';


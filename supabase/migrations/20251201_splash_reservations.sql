-- =============================================
-- SPLASH RESERVATIONS SYSTEM
-- =============================================

-- COUPON CODES TABLE (for both Vairify and ChainPass coupons)
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                           -- 'vairify_premium' or 'chainpass_vai'
  tier TEXT NOT NULL,                           -- 'founding_council', 'first_movers', 'early_access'
  discount_percent INTEGER NOT NULL,            -- 100, 50, 20, 0
  discount_duration TEXT,                       -- 'forever', '1_year', '6_months', null
  max_uses INTEGER DEFAULT 1,                   -- Usually 1 per coupon
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,                       -- 24 hours after launch
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reservation_id UUID                           -- Links to the reservation that generated it
);

-- SPLASH RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.splash_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Form fields from splash page
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  hear_about_us TEXT,
  role TEXT NOT NULL,                           -- 'provider', 'client'
  
  -- Tier assignment
  tier_reserved TEXT NOT NULL,                  -- 'founding_council', 'first_movers', 'early_access'
  spot_number INTEGER NOT NULL,
  
  -- Generated coupon codes (one for Vairify, one for ChainPass)
  vairify_coupon_code TEXT UNIQUE,              -- 'VF-FC-A7K9M2'
  chainpass_coupon_code TEXT UNIQUE,            -- 'CP-FC-B8L0N3'
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Launch day conversion
  registration_window_opens TIMESTAMPTZ,        -- Launch datetime
  registration_window_closes TIMESTAMPTZ,       -- Launch + 24 hours
  
  -- Conversion tracking
  vairify_converted BOOLEAN DEFAULT false,
  vairify_converted_at TIMESTAMPTZ,
  vairify_user_id UUID,
  
  chainpass_converted BOOLEAN DEFAULT false,
  chainpass_converted_at TIMESTAMPTZ,
  chainpass_vai_number TEXT,
  
  -- Expiry
  expired BOOLEAN DEFAULT false,
  spot_reassigned BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEQUENCE FOR SPOT NUMBERS
CREATE SEQUENCE IF NOT EXISTS reservation_spot_seq START 1;

-- FUNCTION: Generate unique coupon codes and assign spot
CREATE OR REPLACE FUNCTION process_reservation()
RETURNS TRIGGER AS $$
DECLARE
  vf_prefix TEXT;
  cp_prefix TEXT;
  random_suffix TEXT;
  spot INTEGER;
BEGIN
  -- Get next spot number
  SELECT nextval('reservation_spot_seq') INTO spot;
  NEW.spot_number := spot;
  
  -- Auto-assign tier based on spot if not specified
  IF NEW.tier_reserved IS NULL THEN
    IF spot <= 1000 THEN
      NEW.tier_reserved := 'founding_council';
    ELSIF spot <= 3000 THEN
      NEW.tier_reserved := 'first_movers';
    ELSIF spot <= 10000 THEN
      NEW.tier_reserved := 'early_access';
    ELSE
      NEW.tier_reserved := 'public';
    END IF;
  END IF;
  
  -- Set coupon prefixes based on tier
  CASE NEW.tier_reserved
    WHEN 'founding_council' THEN 
      vf_prefix := 'VF-FC-';
      cp_prefix := 'CP-FC-';
    WHEN 'first_movers' THEN 
      vf_prefix := 'VF-FM-';
      cp_prefix := 'CP-FM-';
    WHEN 'early_access' THEN 
      vf_prefix := 'VF-EA-';
      cp_prefix := 'CP-EA-';
    ELSE 
      vf_prefix := 'VF-PB-';
      cp_prefix := 'CP-PB-';
  END CASE;
  
  -- Generate random suffix
  random_suffix := upper(substr(md5(random()::text), 1, 6));
  NEW.vairify_coupon_code := vf_prefix || random_suffix;
  
  random_suffix := upper(substr(md5(random()::text), 1, 6));
  NEW.chainpass_coupon_code := cp_prefix || random_suffix;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER
DROP TRIGGER IF EXISTS trigger_process_reservation ON public.splash_reservations;
CREATE TRIGGER trigger_process_reservation
  BEFORE INSERT ON public.splash_reservations
  FOR EACH ROW
  EXECUTE FUNCTION process_reservation();

-- FUNCTION: Create coupon records after reservation
CREATE OR REPLACE FUNCTION create_reservation_coupons()
RETURNS TRIGGER AS $$
DECLARE
  vf_discount INTEGER;
  vf_duration TEXT;
  cp_discount INTEGER;
BEGIN
  -- Set Vairify Premium discount based on tier
  CASE NEW.tier_reserved
    WHEN 'founding_council' THEN 
      vf_discount := 100;
      vf_duration := 'forever';
      cp_discount := 100;
    WHEN 'first_movers' THEN 
      vf_discount := 100;
      vf_duration := '1_year';
      cp_discount := 50;
    WHEN 'early_access' THEN 
      vf_discount := 100;
      vf_duration := '6_months';
      cp_discount := 20;
    ELSE 
      vf_discount := 0;
      vf_duration := NULL;
      cp_discount := 0;
  END CASE;
  
  -- Create Vairify Premium coupon
  INSERT INTO public.coupon_codes (code, type, tier, discount_percent, discount_duration, reservation_id)
  VALUES (NEW.vairify_coupon_code, 'vairify_premium', NEW.tier_reserved, vf_discount, vf_duration, NEW.id);
  
  -- Create ChainPass VAI coupon (one-time first year only)
  INSERT INTO public.coupon_codes (code, type, tier, discount_percent, discount_duration, reservation_id)
  VALUES (NEW.chainpass_coupon_code, 'chainpass_vai', NEW.tier_reserved, cp_discount, 'first_year_only', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Create coupons after insert
DROP TRIGGER IF EXISTS trigger_create_coupons ON public.splash_reservations;
CREATE TRIGGER trigger_create_coupons
  AFTER INSERT ON public.splash_reservations
  FOR EACH ROW
  EXECUTE FUNCTION create_reservation_coupons();

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.splash_reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_tier ON public.splash_reservations(tier_reserved);
CREATE INDEX IF NOT EXISTS idx_reservations_spot ON public.splash_reservations(spot_number);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupon_codes(type);

-- RLS
ALTER TABLE public.splash_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_reservations" ON public.splash_reservations FOR ALL USING (true);
CREATE POLICY "service_coupons" ON public.coupon_codes FOR ALL USING (true);

-- VIEW: Tier counts for splash page display
CREATE OR REPLACE VIEW public.tier_availability AS
SELECT 
  'founding_council' as tier,
  1000 as total_spots,
  1000 - COUNT(*) FILTER (WHERE tier_reserved = 'founding_council') as remaining
FROM public.splash_reservations
UNION ALL
SELECT 
  'first_movers' as tier,
  2000 as total_spots,
  2000 - COUNT(*) FILTER (WHERE tier_reserved = 'first_movers') as remaining
FROM public.splash_reservations
UNION ALL
SELECT 
  'early_access' as tier,
  7000 as total_spots,
  7000 - COUNT(*) FILTER (WHERE tier_reserved = 'early_access') as remaining
FROM public.splash_reservations;


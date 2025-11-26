CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================
-- Core Tables
-- ==============================

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vai_number text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    bio text,
    avatar_url text,
    tier text NOT NULL DEFAULT 'free',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guardians (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guardian_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guardian_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES public.guardian_groups(id) ON DELETE CASCADE,
    guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    UNIQUE(group_id, guardian_id)
);

CREATE TABLE public.safety_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deactivate_code text NOT NULL,
    decoy_code text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dateguard_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    duration integer NOT NULL,
    status text NOT NULL DEFAULT 'active',
    started_at timestamptz NOT NULL DEFAULT now(),
    location text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vai_check_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code text UNIQUE NOT NULL,
    provider_vai text NOT NULL,
    client_vai text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.encounters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vai_check_session_id uuid NOT NULL REFERENCES public.vai_check_sessions(id) ON DELETE CASCADE,
    party_a_vai text NOT NULL,
    party_b_vai text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
    reviewer_vai text NOT NULL,
    reviewee_vai text NOT NULL,
    communication_rating integer CHECK (communication_rating BETWEEN 1 AND 5),
    respect_rating integer CHECK (respect_rating BETWEEN 1 AND 5),
    safety_rating integer CHECK (safety_rating BETWEEN 1 AND 5),
    accuracy_rating integer CHECK (accuracy_rating BETWEEN 1 AND 5),
    overall_rating numeric(3,2),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_vai text NOT NULL,
    referred_email text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================
-- Row Level Security
-- ==============================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dateguard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vai_check_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles owner read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles owner manage" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Guardians & Groups
CREATE POLICY "Guardians owner read" ON public.guardians FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guardians owner manage" ON public.guardians FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guardian groups owner read" ON public.guardian_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guardian groups owner manage" ON public.guardian_groups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group members owner read" ON public.guardian_group_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.guardian_groups g
        WHERE g.id = guardian_group_members.group_id
        AND g.user_id = auth.uid()
    )
);
CREATE POLICY "Group members owner manage" ON public.guardian_group_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.guardian_groups g
        WHERE g.id = guardian_group_members.group_id
        AND g.user_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.guardian_groups g
        WHERE g.id = guardian_group_members.group_id
        AND g.user_id = auth.uid()
    )
);

-- Safety Codes
CREATE POLICY "Safety codes owner read" ON public.safety_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Safety codes owner manage" ON public.safety_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DateGuard Sessions
CREATE POLICY "DateGuard owner read" ON public.dateguard_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "DateGuard owner manage" ON public.dateguard_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- VAI Check Sessions (public read, service-managed writes)
CREATE POLICY "VAI sessions readable" ON public.vai_check_sessions FOR SELECT USING (true);
CREATE POLICY "VAI sessions insert" ON public.vai_check_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "VAI sessions update" ON public.vai_check_sessions FOR UPDATE USING (true);

-- Encounters
CREATE POLICY "Encounters readable" ON public.encounters FOR SELECT USING (true);
CREATE POLICY "Encounters updatable" ON public.encounters FOR UPDATE USING (true);
CREATE POLICY "Encounters insert" ON public.encounters FOR INSERT WITH CHECK (true);

-- Reviews
CREATE POLICY "Reviews readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews writable" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- Referrals
CREATE POLICY "Referrals readable" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "Referrals writable" ON public.referrals FOR ALL USING (true) WITH CHECK (true);

-- Announcements
CREATE POLICY "Announcements readable" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Announcements writable" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- Feature Flags
CREATE POLICY "Feature flags readable" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Feature flags writable" ON public.feature_flags FOR ALL USING (true) WITH CHECK (true);


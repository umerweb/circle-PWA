-- Circle Fund Database Schema
-- Supabase Postgres Migration

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    mobilepay_number TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'collector', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'da')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookup and filtering
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON public.profiles(is_demo);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);

-- 2. Monthly Funds Table
CREATE TABLE IF NOT EXISTS public.monthly_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    title TEXT NOT NULL,
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    collected_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_contribution NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'closed')),
    payment_instructions TEXT,
    mobilepay_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_monthly_funds_year_month UNIQUE(year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_funds_year_month ON public.monthly_funds(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_funds_status ON public.monthly_funds(status);
CREATE INDEX IF NOT EXISTS idx_monthly_funds_collector ON public.monthly_funds(collector_id);

-- 3. Contributions Table
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES public.monthly_funds(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 50.00 CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reported', 'confirmed', 'exempt')),
    is_collector_contribution BOOLEAN NOT NULL DEFAULT false,
    reported_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_reference TEXT,
    member_note TEXT,
    exception_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contributions_fund_member UNIQUE(fund_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_contributions_fund ON public.contributions(fund_id);
CREATE INDEX IF NOT EXISTS idx_contributions_member ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_is_collector ON public.contributions(is_collector_contribution);

-- 4. Collector Volunteers
CREATE TABLE IF NOT EXISTS public.collector_volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_month INTEGER NOT NULL CHECK (target_month BETWEEN 1 AND 12),
    target_year INTEGER NOT NULL CHECK (target_year >= 2024),
    mobilepay_number TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_member ON public.collector_volunteers(member_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_target ON public.collector_volunteers(target_year, target_month);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.collector_volunteers(status);

-- 5. Beneficiaries Table
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    alias_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('medical', 'education', 'emergency', 'living_support', 'other')),
    reason TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    contact_info TEXT,
    total_allocated NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_allocated >= 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_category ON public.beneficiaries(category);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_is_anonymous ON public.beneficiaries(is_anonymous);

-- 6. Distributions Table
CREATE TABLE IF NOT EXISTS public.distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES public.monthly_funds(id) ON DELETE SET NULL,
    beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_reference TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_distributions_fund ON public.distributions(fund_id);
CREATE INDEX IF NOT EXISTS idx_distributions_beneficiary ON public.distributions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON public.distributions(distribution_date);

-- 7. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES public.monthly_funds(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'annual')),
    period_label TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER,
    total_expected NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_collected NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_distributed NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_outstanding NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    member_count INTEGER NOT NULL DEFAULT 0,
    paying_member_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
    summary_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_period ON public.reports(year, month);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    actor_id UUID,
    actor_email TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_da TEXT NOT NULL,
    message_en TEXT NOT NULL,
    message_da TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'collection_opened', 'collector_assigned', 'distribution_made', 'report_published', 'general')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 10. Member Invitations Table
CREATE TABLE IF NOT EXISTS public.member_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.member_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.member_invitations(email);

-- Enable Row Level Security (RLS) on all tables in public schema
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_invitations ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.monthly_funds TO anon;
GRANT SELECT ON public.reports TO anon;

-- RLS Policies
-- Profiles: Any authenticated user can read profiles (members list). Users can update their own profile.
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Monthly funds: Viewable by authenticated and anon (public overview)
CREATE POLICY "Monthly funds are viewable by all" ON public.monthly_funds
    FOR SELECT USING (true);

-- Contributions: Viewable by authenticated
CREATE POLICY "Contributions viewable by authenticated" ON public.contributions
    FOR SELECT TO authenticated USING (true);

-- Beneficiaries: Non-anonymous viewable, anonymous view details controlled
CREATE POLICY "Beneficiaries viewable by authenticated" ON public.beneficiaries
    FOR SELECT TO authenticated USING (true);

-- Distributions: Viewable by authenticated
CREATE POLICY "Distributions viewable by authenticated" ON public.distributions
    FOR SELECT TO authenticated USING (true);

-- Reports: Viewable by all when published, authenticated when draft
CREATE POLICY "Reports viewable by public when published" ON public.reports
    FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

-- Notifications: Users see notifications for themselves or broadcast (recipient_id IS NULL)
CREATE POLICY "Users see own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (recipient_id IS NULL OR recipient_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ));

-- Audit Logs: Viewable by authenticated
CREATE POLICY "Audit logs viewable by authenticated" ON public.audit_logs
    FOR SELECT TO authenticated USING (true);

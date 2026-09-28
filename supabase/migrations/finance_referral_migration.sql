-- 1. Create affiliate_profiles table
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    account_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for affiliate_profiles
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate profile" 
ON public.affiliate_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate profile" 
ON public.affiliate_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate profile" 
ON public.affiliate_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Create affiliate_withdrawals table
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for affiliate_withdrawals
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" 
ON public.affiliate_withdrawals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" 
ON public.affiliate_withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Alter referrals table to link with withdrawals
-- Add withdrawal_id to track which withdrawal request claims this referral
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES public.affiliate_withdrawals(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user_id ON public.affiliate_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_withdrawal_id ON public.referrals(withdrawal_id);

-- Trigger for updated_at on affiliate_profiles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_affiliate_profiles_updated_at ON public.affiliate_profiles;
CREATE TRIGGER trigger_affiliate_profiles_updated_at
BEFORE UPDATE ON public.affiliate_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_affiliate_withdrawals_updated_at ON public.affiliate_withdrawals;
CREATE TRIGGER trigger_affiliate_withdrawals_updated_at
BEFORE UPDATE ON public.affiliate_withdrawals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

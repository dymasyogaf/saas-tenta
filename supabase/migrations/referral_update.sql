-- 1. Create Sequence for Referral Codes
CREATE SEQUENCE IF NOT EXISTS referral_code_seq START 1;

-- 2. Function to generate sequential code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  next_val INT;
  formatted_code TEXT;
BEGIN
  SELECT nextval('referral_code_seq') INTO next_val;
  formatted_code := 'TENTA-Ref' || LPAD(next_val::text, 4, '0');
  RETURN formatted_code;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Referrals table to track the relationship and reward status
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending_reward' CHECK (status IN ('pending_reward', 'reward_given', 'failed')),
  reward_amount NUMERIC DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Set up Row Level Security (RLS) for referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals (as referrer)" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referral (as referee)" 
ON public.referrals FOR SELECT 
USING (auth.uid() = referee_id);

-- Insert and Update will be handled by the server (Service Role)

-- 5. Function khusus untuk Dev (Reset Sequence)
CREATE OR REPLACE FUNCTION reset_referral_sequence()
RETURNS void AS $$
BEGIN
  -- Hapus data dari tabel referrals dan referral_codes (karena ini khusus reset dev)
  DELETE FROM public.referrals WHERE id IS NOT NULL;
  DELETE FROM public.referral_codes WHERE user_id IS NOT NULL;
  
  -- Reset sequence kembali ke 1 menggunakan setval (tidak butuh ownership)
  PERFORM setval('referral_code_seq', 1, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

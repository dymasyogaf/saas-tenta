-- Create ad_budget_requests table
CREATE TABLE IF NOT EXISTS public.ad_budget_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ad_budget_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budget requests" ON public.ad_budget_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget requests" ON public.ad_budget_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admin handles updates via service role

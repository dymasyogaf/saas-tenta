-- Supabase Schema for Tentaklik SaaS
-- Run this script in your Supabase SQL Editor

-- 1. Create Tables

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  pin_hash TEXT,
  is_2fa_enabled BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Accounts
CREATE TABLE IF NOT EXISTS public.ad_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saldo (Balance)
CREATE TABLE IF NOT EXISTS public.saldo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0 NOT NULL,
  pending_balance NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Mutasi Saldo)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'withdraw', 'transfer', 'payment', 'refund')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_gateway_ref TEXT, -- Reference from Duidku
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Issues (Iklan Bermasalah)
CREATE TABLE IF NOT EXISTS public.ad_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE NOT NULL,
  campaign_id TEXT,
  platform TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Account Requests (Pengajuan Akun Iklan)
CREATE TABLE IF NOT EXISTS public.ad_account_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Meta Ads', 'TikTok Ads', 'Google Ads')),
  account_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'processing', 'approved', 'rejected')),
  rejection_reason TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Row Level Security (RLS) Policies

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Policies for Users (Profiles)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for Bank Accounts
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- Policies for Ad Accounts
CREATE POLICY "Users can view own ad accounts" ON public.ad_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ad accounts" ON public.ad_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ad accounts" ON public.ad_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ad accounts" ON public.ad_accounts FOR DELETE USING (auth.uid() = user_id);

-- Policies for Saldo
CREATE POLICY "Users can view own saldo" ON public.saldo FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update to Saldo should be handled by secure server functions, not direct client inserts

-- Policies for Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
-- Insert to transactions will usually be done from backend webhook

-- Policies for Ad Issues
CREATE POLICY "Users can view own ad issues" ON public.ad_issues FOR SELECT USING (auth.uid() = user_id);

-- Policies for Ad Account Requests
CREATE POLICY "Users can view own ad account requests" ON public.ad_account_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ad account requests" ON public.ad_account_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Update only allowed for admin (handled via service role in server route if needed, or by admin compliance)

-- Policies for Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Referral Codes
CREATE POLICY "Users can view own referral codes" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);

-- 3. Trigger to Auto-create User Profile and Saldo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  
  -- Insert initial zero balance for new user
  INSERT INTO public.saldo (user_id, balance, pending_balance)
  VALUES (new.id, 0, 0);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Enable Realtime for Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

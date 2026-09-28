-- Migration: Add user_package_subscriptions table & multi-package stacking logic
-- Run this script in your Supabase SQL Editor

-- 1. Add package_expires_at to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS package_expires_at TIMESTAMPTZ;

-- 2. Create user_package_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_package_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL, -- 'starter', 'growth', 'scale'
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for user_package_subscriptions
ALTER TABLE public.user_package_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own package subscriptions" ON public.user_package_subscriptions;
CREATE POLICY "Users can view their own package subscriptions" 
ON public.user_package_subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to package subscriptions" ON public.user_package_subscriptions;
CREATE POLICY "Service role full access to package subscriptions" 
ON public.user_package_subscriptions FOR ALL 
TO service_role 
USING (true) WITH CHECK (true);

-- 3. Function to evaluate & sync user highest active package tier
CREATE OR REPLACE FUNCTION update_user_highest_package(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_highest_pkg TEXT := 'starter';
  v_highest_limit NUMERIC := 5000000;
  v_highest_expires TIMESTAMPTZ;
BEGIN
  -- Search for unexpired subscriptions ordered by tier priority:
  -- Scale (3) > Growth (2) > Starter (1), then longest expiration date
  SELECT * INTO v_sub
  FROM user_package_subscriptions
  WHERE user_id = p_user_id
    AND expires_at > NOW()
  ORDER BY 
    CASE package_type
      WHEN 'scale' THEN 3
      WHEN 'growth' THEN 2
      WHEN 'starter' THEN 1
      ELSE 0
    END DESC,
    expires_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_highest_pkg := v_sub.package_type;
    v_highest_expires := v_sub.expires_at;
    v_highest_limit := CASE v_highest_pkg
      WHEN 'starter' THEN 5000000
      WHEN 'growth' THEN 15000000
      WHEN 'scale' THEN 999999999
      ELSE 5000000
    END;

    -- Set highest tier active subscription as is_active = true, others = false
    UPDATE user_package_subscriptions
    SET is_active = (id = v_sub.id), updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Sync users table
    UPDATE users
    SET
      active_package = v_highest_pkg,
      package_weekly_limit = v_highest_limit,
      package_expires_at = v_highest_expires,
      updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    -- If no unexpired subscription, set is_active = false
    UPDATE user_package_subscriptions
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'active_package', v_highest_pkg,
    'package_weekly_limit', v_highest_limit,
    'package_expires_at', v_highest_expires
  );
END;
$$;

-- 4. Function to switch active package manually
CREATE OR REPLACE FUNCTION switch_user_active_package(
  p_user_id UUID,
  p_package_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  -- Find an unexpired subscription for p_package_type
  SELECT * INTO v_sub
  FROM user_package_subscriptions
  WHERE user_id = p_user_id
    AND package_type = p_package_type
    AND expires_at > NOW()
  ORDER BY expires_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tidak ada paket aktif untuk jenis ini');
  END IF;

  -- Set chosen subscription as active
  UPDATE user_package_subscriptions
  SET is_active = (id = v_sub.id), updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Update users table active_package and weekly limit
  UPDATE users
  SET
    active_package = v_sub.package_type,
    package_weekly_limit = CASE
      WHEN v_sub.package_type = 'starter' THEN 5000000
      WHEN v_sub.package_type = 'growth' THEN 15000000
      WHEN v_sub.package_type = 'scale' THEN 999999999
      ELSE 0
    END,
    package_expires_at = v_sub.expires_at,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'active_package', v_sub.package_type,
    'expires_at', v_sub.expires_at
  );
END;
$$;

-- 5. Update process_topup_success function
CREATE OR REPLACE FUNCTION process_topup_success(
  p_transaction_id UUID,
  p_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
  v_new_balance NUMERIC;
  v_sub RECORD;
  v_final_expires TIMESTAMPTZ;
BEGIN
  -- Lock transaction row
  SELECT * INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  -- Idempotency: already processed
  IF v_tx.status IN ('success', 'failed') THEN
    RETURN json_build_object('success', true, 'already_processed', true, 'status', v_tx.status);
  END IF;

  -- Mark transaction as success
  UPDATE transactions
  SET status = 'success', updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Atomic balance increment
  UPDATE saldo
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = v_tx.user_id
  RETURNING balance INTO v_new_balance;

  -- Update user package subscriptions if applicable
  IF v_tx.package_selected IS NOT NULL AND v_tx.package_selected <> '' THEN
    -- Check if user already has an active (unexpired) subscription for THIS EXACT package_type
    SELECT * INTO v_sub
    FROM user_package_subscriptions
    WHERE user_id = v_tx.user_id 
      AND package_type = v_tx.package_selected
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1;

    IF FOUND THEN
      -- SAME PACKAGE TYPE: Extend the expiration date (+28 days)
      v_final_expires := v_sub.expires_at + INTERVAL '28 days';

      UPDATE user_package_subscriptions
      SET expires_at = v_final_expires,
          updated_at = NOW()
      WHERE id = v_sub.id;
    ELSE
      -- DIFFERENT PACKAGE TYPE / NEW PURCHASE:
      v_final_expires := NOW() + INTERVAL '28 days';

      -- Insert a new subscription for this package (without deactivating existing unexpired ones)
      INSERT INTO user_package_subscriptions (user_id, package_type, expires_at, is_active)
      VALUES (v_tx.user_id, v_tx.package_selected, v_final_expires, false);
    END IF;

    -- Automatically evaluate and sync users table with highest active tier
    PERFORM update_user_highest_package(v_tx.user_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'user_id', v_tx.user_id,
    'package', v_tx.package_selected
  );
END;
$$;

-- 5. Normalisasi Data User: Reset semua user ke paket Starter Bawaan (1 Paket Aktif)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.users LOOP
    DELETE FROM public.user_package_subscriptions WHERE user_id = r.id;
    
    -- Set paket Starter default (sisa 28 hari)
    INSERT INTO public.user_package_subscriptions (user_id, package_type, expires_at, is_active)
    VALUES (r.id, 'starter', NOW() + INTERVAL '28 days', true);

    -- Sync data tabel users
    UPDATE public.users
    SET 
      active_package = 'starter',
      package_weekly_limit = 5000000,
      package_expires_at = NOW() + INTERVAL '28 days'
    WHERE id = r.id;
  END LOOP;
END $$;

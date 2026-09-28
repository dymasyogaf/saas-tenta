-- ============================================================
-- RPC Functions untuk Atomic Operations
-- Deploy manual ke Supabase SQL Editor
-- Tanggal: 29 Juli 2026
-- ============================================================

-- 1. PROCESS TOPUP SUCCESS
-- Atomically: mark transaction success + add balance
-- Mencegah double-credit dari webhook/check-status race condition
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
BEGIN
  -- Lock transaction row to prevent concurrent processing
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

  -- Update user package if applicable (with 28-day expiration & no-downgrade protection)
  IF v_tx.package_selected IS NOT NULL THEN
    DECLARE
      v_curr_package TEXT;
      v_curr_expires TIMESTAMPTZ;
      v_curr_tier INT := 0;
      v_new_tier INT := 0;
      v_final_package TEXT;
      v_base_time TIMESTAMPTZ;
    BEGIN
      SELECT active_package, package_expires_at
      INTO v_curr_package, v_curr_expires
      FROM users WHERE id = v_tx.user_id;

      -- Map tier ranks: starter=1, growth=2, scale=3
      IF v_curr_package = 'starter' THEN v_curr_tier := 1;
      ELSIF v_curr_package = 'growth' THEN v_curr_tier := 2;
      ELSIF v_curr_package = 'scale' THEN v_curr_tier := 3;
      END IF;

      IF v_tx.package_selected = 'starter' THEN v_new_tier := 1;
      ELSIF v_tx.package_selected = 'growth' THEN v_new_tier := 2;
      ELSIF v_tx.package_selected = 'scale' THEN v_new_tier := 3;
      END IF;

      -- If current package is still active (not expired) and has a higher rank, keep higher rank
      IF v_curr_expires IS NOT NULL AND v_curr_expires > NOW() AND v_curr_tier > v_new_tier THEN
        v_final_package := v_curr_package;
      ELSE
        v_final_package := v_tx.package_selected;
      END IF;

      -- Calculate extension base time: sisa hari + 28 hari (if still active), or NOW() + 28 hari (if expired/new)
      IF v_curr_expires IS NOT NULL AND v_curr_expires > NOW() THEN
        v_base_time := v_curr_expires;
      ELSE
        v_base_time := NOW();
      END IF;

      UPDATE users
      SET
        active_package = v_final_package,
        package_weekly_limit = CASE
          WHEN v_final_package = 'starter' THEN 5000000
          WHEN v_final_package = 'growth' THEN 15000000
          WHEN v_final_package = 'scale' THEN 999999999
          ELSE 0
        END,
        package_expires_at = v_base_time + INTERVAL '28 days',
        updated_at = NOW()
      WHERE id = v_tx.user_id;
    END;
  END IF;

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'user_id', v_tx.user_id,
    'package', v_tx.package_selected
  );
END;
$$;

-- Hanya service_role yang boleh memanggil fungsi ini
REVOKE EXECUTE ON FUNCTION process_topup_success(UUID, NUMERIC) FROM PUBLIC;

-- 2. PROCESS TOPUP FAILED
-- Mark transaction as failed (with row lock for safety)
CREATE OR REPLACE FUNCTION process_topup_failed(
  p_transaction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  SELECT * INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  IF v_tx.status IN ('success', 'failed') THEN
    RETURN json_build_object('success', true, 'already_processed', true, 'status', v_tx.status);
  END IF;

  UPDATE transactions
  SET status = 'failed', updated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN json_build_object('success', true, 'status', 'failed');
END;
$$;

-- Hanya service_role yang boleh memanggil fungsi ini
REVOKE EXECUTE ON FUNCTION process_topup_failed(UUID) FROM PUBLIC;

-- 3. ALLOCATE BALANCE
-- Atomically: check balance, deduct saldo, add ad account limit, insert transaction
-- Mencegah uang hilang jika salah satu step gagal
CREATE OR REPLACE FUNCTION allocate_balance(
  p_user_id UUID,
  p_ad_account_id TEXT,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo RECORD;
  v_ad_account RECORD;
  v_new_balance NUMERIC;
  v_new_limit NUMERIC;
BEGIN
  IF p_amount < 10000 THEN
    RETURN json_build_object('success', false, 'error', 'Nominal alokasi minimal Rp 10.000');
  END IF;

  -- Lock saldo row
  SELECT * INTO v_saldo
  FROM saldo
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Data saldo tidak ditemukan');
  END IF;

  IF v_saldo.balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Saldo utama tidak mencukupi');
  END IF;

  -- Lock ad account row
  SELECT * INTO v_ad_account
  FROM ad_accounts
  WHERE account_id = p_ad_account_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Akun Iklan tidak ditemukan atau tidak valid');
  END IF;

  -- Deduct balance
  v_new_balance := v_saldo.balance - p_amount;
  UPDATE saldo
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add limit to ad account
  v_new_limit := COALESCE(v_ad_account.limit_amount, 0) + p_amount;
  UPDATE ad_accounts
  SET limit_amount = v_new_limit
  WHERE id = v_ad_account.id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, status, description)
  VALUES (p_user_id, 'transfer', p_amount, 'success',
    COALESCE(p_description, 'Alokasi Saldo ke Akun Iklan ' || p_ad_account_id));

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'new_limit', v_new_limit
  );
END;
$$;

-- Hanya service_role yang boleh memanggil fungsi ini
REVOKE EXECUTE ON FUNCTION allocate_balance(UUID, TEXT, NUMERIC, TEXT) FROM PUBLIC;

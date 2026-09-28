-- Migration: Add USD Package fields and Currency column for total IDR/USD separation

-- 1. Add currency column to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

-- Update existing transactions based on payment gateway / reference
UPDATE transactions 
SET currency = 'USD' 
WHERE (payment_gateway_ref LIKE 'NP-%' OR payment_gateway_ref LIKE 'USDT-%' OR description LIKE '%NOWPayments%' OR description LIKE '%Binance%');

-- 2. Add currency column to user_package_subscriptions
ALTER TABLE user_package_subscriptions
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

-- 3. Add USD package tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS usd_active_package TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS usd_package_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS usd_package_weekly_limit NUMERIC DEFAULT 0;

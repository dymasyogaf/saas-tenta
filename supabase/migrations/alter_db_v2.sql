-- Migrasi V2: Penambahan Fitur Sewa Akun & Update Status Pengajuan

-- 1. Update tabel ad_account_requests
ALTER TABLE public.ad_account_requests ADD COLUMN IF NOT EXISTS subscription_months INTEGER DEFAULT 1;
ALTER TABLE public.ad_account_requests ADD COLUMN IF NOT EXISTS rental_fee NUMERIC DEFAULT 0;

-- Hapus constraint lama
ALTER TABLE public.ad_account_requests DROP CONSTRAINT IF EXISTS ad_account_requests_status_check;

-- Tambahkan constraint baru yang mendukung 'payment_pending'
ALTER TABLE public.ad_account_requests ADD CONSTRAINT ad_account_requests_status_check CHECK (status IN ('payment_pending', 'pending_review', 'processing', 'approved', 'rejected'));


-- 2. Update tabel ad_accounts (Masa kedaluwarsa sewa)
ALTER TABLE public.ad_accounts ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

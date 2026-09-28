-- Tambahkan kolom usd_balance dan usd_pending_balance ke tabel saldo
ALTER TABLE public.saldo
ADD COLUMN IF NOT EXISTS usd_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS usd_pending_balance NUMERIC DEFAULT 0;

-- Catat pesan sukses
SELECT 'Migrasi berhasil: Kolom usd_balance dan usd_pending_balance telah ditambahkan ke tabel saldo.' as message;

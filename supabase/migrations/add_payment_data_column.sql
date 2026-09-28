-- Tambah kolom untuk menyimpan data pembayaran yang belum selesai
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_url text,
ADD COLUMN IF NOT EXISTS payment_data jsonb;

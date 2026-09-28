-- Migration: Add is_sandbox column to transactions table
-- Jalankan di Supabase Dashboard > SQL Editor

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_sandbox boolean NOT NULL DEFAULT false;

-- Komentar: 
-- Default false agar semua transaksi lama tetap dianggap produksi.
-- Transaksi baru dari localhost/sandbox akan di-set true oleh backend.

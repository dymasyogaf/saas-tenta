-- ============================================================
-- Tabel system_health untuk Supabase Keepalive
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- Buat tabel system_health (1 row permanen, tidak bertambah)
CREATE TABLE IF NOT EXISTS public.system_health (
  id TEXT PRIMARY KEY DEFAULT 'keepalive',
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  description TEXT DEFAULT 'Auto-ping untuk mencegah Supabase pause'
);

-- Insert row awal (tidak duplikat jika sudah ada)
INSERT INTO public.system_health (id, last_ping, description)
VALUES ('keepalive', NOW(), 'Auto-ping untuk mencegah Supabase pause')
ON CONFLICT (id) DO NOTHING;

-- Aktifkan RLS untuk tabel ini (tabel internal, akses hanya via service_role)
-- Service role bypass RLS secara otomatis, jadi tidak perlu policy tambahan
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Verifikasi
SELECT * FROM public.system_health;

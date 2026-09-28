-- ========================================================
-- SISTEM AUDIT LOGS
-- ========================================================

-- 1. Buat tabel audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Aktifkan RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Hanya Super Admin yang bisa melihat log audit
CREATE POLICY "Super admin can read audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- (Catatan: Proses INSERT dilakukan via server menggunakan Service Role yang mem-bypass RLS)

-- Update 3: Broadcast History Architecture

-- 1. Create Broadcasts Table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add broadcast_id to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE CASCADE;

-- Enable RLS for broadcasts (only admins/super_admin can view)
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can manage broadcasts" ON public.broadcasts FOR ALL USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin'
);

-- 3. Drop old 3-param version (PostgreSQL overloads, doesn't replace different signatures)
DROP FUNCTION IF EXISTS public.broadcast_notification(TEXT, TEXT, TEXT);

-- Create new 4-param version
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_title TEXT,
  p_message TEXT,
  p_target_role TEXT,
  p_sender_id UUID
) RETURNS UUID AS $$
DECLARE
  v_broadcast_id UUID;
BEGIN
  -- Insert into broadcasts table
  INSERT INTO public.broadcasts (title, message, target_role, created_by)
  VALUES (p_title, p_message, p_target_role, p_sender_id)
  RETURNING id INTO v_broadcast_id;

  -- Insert into notifications table
  INSERT INTO public.notifications (user_id, type, title, message, broadcast_id)
  SELECT id, 'system_update', p_title, p_message, v_broadcast_id
  FROM auth.users
  WHERE 
    (p_target_role = 'all')
    OR
    (p_target_role = 'admin_only' AND raw_user_meta_data->>'role' IS NOT NULL AND raw_user_meta_data->>'role' != 'client')
    OR
    (p_target_role NOT IN ('all', 'admin_only') AND (raw_user_meta_data->>'role' = p_target_role OR raw_user_meta_data->>'role' = 'super_admin'));

  RETURN v_broadcast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

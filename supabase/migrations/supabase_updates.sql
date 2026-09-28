
-- Update 1: Add weekly_spend to ad_accounts
ALTER TABLE public.ad_accounts ADD COLUMN IF NOT EXISTS weekly_spend NUMERIC DEFAULT 0;

-- Update 2: Broadcast Notification Function
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_title TEXT,
  p_message TEXT,
  p_target_role TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  SELECT id, 'system_update', p_title, p_message
  FROM auth.users
  WHERE 
    (p_target_role = 'all')
    OR
    (p_target_role = 'admin_only' AND raw_user_meta_data->>'role' IS NOT NULL AND raw_user_meta_data->>'role' != 'client')
    OR
    (p_target_role NOT IN ('all', 'admin_only') AND (raw_user_meta_data->>'role' = p_target_role OR raw_user_meta_data->>'role' = 'super_admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

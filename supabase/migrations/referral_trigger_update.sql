-- 1. Update the handle_new_user trigger to support automatic referral tracking

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_ref_code TEXT;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  
  -- Insert initial zero balance for new user
  INSERT INTO public.saldo (user_id, balance, pending_balance)
  VALUES (new.id, 0, 0);

  -- Automatic Referral Tracking
  v_ref_code := new.raw_user_meta_data->>'ref_code';
  IF v_ref_code IS NOT NULL AND v_ref_code != '' THEN
    -- Look up the referrer using the code
    SELECT user_id INTO v_referrer_id FROM public.referral_codes WHERE code ILIKE v_ref_code LIMIT 1;
    
    -- Ensure the referrer is not themselves (though impossible on signup) and referrer exists
    IF v_referrer_id IS NOT NULL AND v_referrer_id != new.id THEN
      INSERT INTO public.referrals (referrer_id, referee_id, referral_code, status)
      VALUES (v_referrer_id, new.id, v_ref_code, 'pending_reward')
      ON CONFLICT DO NOTHING; -- prevent duplicates just in case
    END IF;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

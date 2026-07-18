import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NUXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

supabase.from('transactions').select('*').then(({ data, error }) => {
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
});

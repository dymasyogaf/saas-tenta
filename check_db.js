import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pjmsnphhnporuownasxe.supabase.co'
const SUPABASE_SERVICE_KEY = 'sb_secret_zAeoyrBjAV0F7BaydxR4OA_7p7VTv6R'
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function wipe() {
  console.log('Wiping ad_accounts...')
  const { data: accounts } = await supabase.from('ad_accounts').select('id')
  if (accounts) {
    for (const acc of accounts) {
      await supabase.from('ad_accounts').delete().eq('id', acc.id)
    }
  }

  console.log('Wiping ad_account_requests...')
  const { data: reqs } = await supabase.from('ad_account_requests').select('id')
  if (reqs) {
    for (const r of reqs) {
      await supabase.from('ad_account_requests').delete().eq('id', r.id)
    }
  }
  
  console.log('Done wiping!')
}

wipe()

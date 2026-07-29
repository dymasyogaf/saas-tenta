import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pjmsnphhnporuownasxe.supabase.co',
  'sb_secret_zAeoyrBjAV0F7BaydxR4OA_7p7VTv6R'
)

async function test() {
  const { data: users, error } = await supabase.from('users').select('id, full_name, email, verification_status').limit(20)
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }
  
  console.table(users)
  const targetId = users[0].id // Try deleting the first user
  
  console.log('Attempting to delete user:', targetId)
  
  const { error: authError } = await supabase.auth.admin.deleteUser(targetId)
  console.log('auth.admin.deleteUser error:', authError)

  const { error: dbError } = await supabase.from('users').delete().eq('id', targetId)
  console.log('public.users delete error:', dbError)
}

test()

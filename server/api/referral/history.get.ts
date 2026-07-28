import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const uid = user?.id || (user as any)?.sub
  
  if (!uid) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // 1. Dapatkan daftar teman (referrals) beserta detail usernya
    const { data: referrals, error } = await (supabase as any)
      .from('referrals')
      .select(`
        created_at,
        status,
        users!referee_id (
          email,
          full_name
        )
      `)
      .eq('referrer_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Mask emails and prepare data
    const history = (referrals || []).map((r: any) => {
      // Handle the users array if it comes as an array (usually an object for single relation)
      const userDetail = Array.isArray(r.users) ? r.users[0] : r.users
      const email = userDetail?.email || 'user@unknown.com'
      
      let maskedEmail = email
      if (email.includes('@')) {
        const [name, domain] = email.split('@')
        if (name.length > 3) {
          maskedEmail = name.substring(0, 3) + '***@' + domain
        } else {
          maskedEmail = name[0] + '***@' + domain
        }
      }
      
      return {
        date: r.created_at,
        email: maskedEmail,
        status: r.status, // 'pending_reward', 'reward_given'
        reward: r.status === 'reward_given' ? '10% Saldo' : 'Pending'
      }
    })

    const totalRegistered = history.length
    const totalActive = history.filter((h: any) => h.status === 'reward_given').length

    return {
      success: true,
      totalEarned: 0, // Mock: belum ada logic hitungan pasti
      totalRegistered,
      totalActive,
      history
    }
  } catch (error: any) {
    console.error('Error fetching referral history:', error)
    return { success: false, message: error.message }
  }
})

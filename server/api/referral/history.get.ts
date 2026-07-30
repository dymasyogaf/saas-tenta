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
        reward_amount,
        is_claimed,
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
        reward: r.reward_amount ? `Rp ${Number(r.reward_amount).toLocaleString('id-ID')}` : (r.status === 'reward_given' ? 'Rp 0' : 'Pending'),
        is_claimed: r.is_claimed
      }
    })

    const totalRegistered = history.length
    const totalActive = history.filter((h: any) => h.status === 'reward_given').length
    
    // Hitung total penghasilan dan yang bisa dicairkan
    const totalEarned = (referrals || []).reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0)
    const availableToClaim = (referrals || []).filter(r => r.status === 'reward_given' && !r.is_claimed).reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0)

    return {
      success: true,
      totalEarned,
      availableToClaim,
      totalRegistered,
      totalActive,
      history
    }
  } catch (error: any) {
    console.error('Error fetching referral history:', error)
    return { success: false, message: error.message }
  }
})

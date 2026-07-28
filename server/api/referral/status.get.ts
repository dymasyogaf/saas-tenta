import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // 1. Dapatkan data batas waktu 60 hari
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('created_at')
      .eq('id', uid)
      .single()

    let daysRemaining = 0
    let canSubmit = false

    if (userData) {
      const createdAt = new Date(userData.created_at)
      const now = new Date()
      const diffTime = now.getTime() - createdAt.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      daysRemaining = Math.max(0, 60 - diffDays)
      canSubmit = daysRemaining > 0
    }

    // 2. Cek apakah user sudah jadi Affiliate (punya kode)
    const { data: myCode } = await (supabase as any)
      .from('referral_codes')
      .select('code')
      .eq('user_id', uid)
      .single()

    // 3. Cek apakah user sudah pernah submit kode teman
    const { data: submittedCode } = await (supabase as any)
      .from('referrals')
      .select('referral_code, status')
      .eq('referee_id', uid)
      .single()

    if (submittedCode) {
      canSubmit = false // Sudah pernah submit, tidak bisa lagi meskipun harinya masih ada
    }

    return {
      success: true,
      isAffiliate: !!myCode,
      myReferralCode: myCode ? myCode.code : null,
      hasSubmittedCode: !!submittedCode,
      submittedCode: submittedCode ? submittedCode.referral_code : null,
      daysRemaining,
      canSubmit
    }
  } catch (error: any) {
    console.error('Referral Status Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server'
    })
  }
})

import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      return { success: true, subscriptions: [] }
    }

    const userId = user.id || (user as any).sub
    const supabaseAdmin = serverSupabaseServiceRole<any>(event)

    // Sync user's highest active package tier
    await syncUserHighestPackage(supabaseAdmin, userId)

    const now = new Date().toISOString()
    const { data: subs, error } = await supabaseAdmin
      .from('user_package_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('expires_at', { ascending: false })

    if (error || !subs || subs.length === 0) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('active_package, package_expires_at')
        .eq('id', userId)
        .single()

      if (userData?.active_package && userData?.package_expires_at) {
        const diffMs = new Date(userData.package_expires_at).getTime() - Date.now()
        if (diffMs > 0) {
          const daysRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
          return {
            success: true,
            subscriptions: [{
              id: 'fallback-1',
              package_type: userData.active_package,
              expires_at: userData.package_expires_at,
              is_active: true,
              days_remaining: daysRemaining
            }]
          }
        }
      }
      return { success: true, subscriptions: [] }
    }

    const formatted = (subs || []).map((s: any) => {
      const diffMs = new Date(s.expires_at).getTime() - Date.now()
      const daysRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
      return {
        id: s.id,
        package_type: s.package_type,
        expires_at: s.expires_at,
        is_active: s.is_active,
        days_remaining: daysRemaining
      }
    })

    return {
      success: true,
      subscriptions: formatted
    }
  } catch (err: any) {
    console.error('Error fetching active subscriptions:', err)
    return { success: true, subscriptions: [] }
  }
})

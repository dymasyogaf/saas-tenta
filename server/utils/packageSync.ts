import type { SupabaseClient } from '@supabase/supabase-js'

export const PACKAGE_TIER_PRIORITY: Record<string, number> = {
  scale: 3,
  growth: 2,
  starter: 1
}

export const PACKAGE_LIMIT_MAP: Record<string, number> = {
  scale: 999999999,
  growth: 15000000,
  starter: 5000000
}

/**
 * Evaluates all unexpired subscriptions for a user and updates the users table
 * to use the HIGHEST active package tier (Scale > Growth > Starter).
 */
export async function syncUserHighestPackage(supabaseAdmin: SupabaseClient<any>, userId: string) {
  try {
    const now = new Date().toISOString()
    const { data: subs, error } = await supabaseAdmin
      .from('user_package_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now)

    if (error || !subs || subs.length === 0) {
      return null
    }

    // Sort by tier priority (highest first), then longest expiration date
    const sortedSubs = [...subs].sort((a: any, b: any) => {
      const pA = PACKAGE_TIER_PRIORITY[a.package_type?.toLowerCase()] || 0
      const pB = PACKAGE_TIER_PRIORITY[b.package_type?.toLowerCase()] || 0
      if (pB !== pA) return pB - pA
      return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
    })

    const highestSub = sortedSubs[0]
    const highestPkg = highestSub.package_type?.toLowerCase() || 'starter'
    const highestLimit = PACKAGE_LIMIT_MAP[highestPkg] || 5000000
    const highestExpires = highestSub.expires_at

    // Mark highest sub as is_active = true, others as false
    for (const s of subs) {
      const isActive = (s.id === highestSub.id)
      if (s.is_active !== isActive) {
        await supabaseAdmin
          .from('user_package_subscriptions')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', s.id)
      }
    }

    // Sync users table
    await supabaseAdmin
      .from('users')
      .update({
        active_package: highestPkg,
        package_weekly_limit: highestLimit,
        package_expires_at: highestExpires,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    return {
      active_package: highestPkg,
      package_weekly_limit: highestLimit,
      package_expires_at: highestExpires
    }
  } catch (err) {
    console.error(`Failed to sync highest package for user ${userId}:`, err)
    return null
  }
}

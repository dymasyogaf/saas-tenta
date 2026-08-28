import type { SupabaseClient } from '@supabase/supabase-js'

export const PACKAGE_TIER_PRIORITY: Record<string, number> = {
  scale: 3,
  growth: 2,
  starter: 1
}

export const PACKAGE_LIMIT_MAP_IDR: Record<string, number> = {
  scale: 999999999,
  growth: 15000000,
  starter: 5000000
}

export const PACKAGE_LIMIT_MAP_USD: Record<string, number> = {
  scale: 999999999,
  growth: 50000,
  starter: 10000
}

/**
 * Evaluates all unexpired subscriptions for a user and updates the users table
 * to use the HIGHEST active package tier (Scale > Growth > Starter), separately for IDR and USD.
 */
export async function syncUserHighestPackage(supabaseAdmin: SupabaseClient<any>, userId: string, currency: 'IDR' | 'USD' = 'IDR') {
  try {
    const now = new Date().toISOString()
    
    // Fetch subscriptions filtered by currency (or fallback for IDR if currency column not yet set)
    let query = supabaseAdmin
      .from('user_package_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now)

    if (currency === 'USD') {
      query = query.eq('currency', 'USD')
    } else {
      query = query.or('currency.eq.IDR,currency.is.null')
    }

    const { data: subs, error } = await query

    if (error || !subs || subs.length === 0) {
      if (currency === 'USD') {
        await supabaseAdmin
          .from('users')
          .update({
            usd_active_package: null,
            usd_package_weekly_limit: 0,
            usd_package_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      } else {
        await supabaseAdmin
          .from('users')
          .update({
            active_package: null,
            package_weekly_limit: 0,
            package_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
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
    const limitMap = currency === 'USD' ? PACKAGE_LIMIT_MAP_USD : PACKAGE_LIMIT_MAP_IDR
    const highestLimit = limitMap[highestPkg] || (currency === 'USD' ? 10000 : 5000000)
    const highestExpires = highestSub.expires_at

    // Mark highest sub as is_active = true for this currency, others as false
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
    if (currency === 'USD') {
      await supabaseAdmin
        .from('users')
        .update({
          usd_active_package: highestPkg,
          usd_package_weekly_limit: highestLimit,
          usd_package_expires_at: highestExpires,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      await supabaseAdmin
        .from('users')
        .update({
          active_package: highestPkg,
          package_weekly_limit: highestLimit,
          package_expires_at: highestExpires,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }

    return {
      active_package: highestPkg,
      package_weekly_limit: highestLimit,
      package_expires_at: highestExpires
    }
  } catch (err) {
    console.error(`Failed to sync highest package for user ${userId} (${currency}):`, err)
    return null
  }
}


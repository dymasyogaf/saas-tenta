import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { package_type } = body

    if (!package_type || !['starter', 'growth', 'scale'].includes(package_type)) {
      throw createError({ statusCode: 400, message: 'Package type tidak valid' })
    }

    const userId = user.id || (user as any).sub
    const supabaseAdmin = serverSupabaseServiceRole<any>(event)

    // Try calling RPC switch_user_active_package
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('switch_user_active_package', {
      p_user_id: userId,
      p_package_type: package_type
    })

    if (rpcError) {
      console.warn('RPC switch_user_active_package error, falling back to direct update:', rpcError.message)

      const host = getRequestHost(event) || ''
      const isGlobal = host.startsWith('area.') || body.currency === 'USD'
      const currency = isGlobal ? 'USD' : 'IDR'

      // Fallback: direct database updates
      let subQuery = supabaseAdmin
        .from('user_package_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('package_type', package_type)
        .gt('expires_at', new Date().toISOString())

      if (currency === 'USD') {
        subQuery = subQuery.eq('currency', 'USD')
      } else {
        subQuery = subQuery.or('currency.eq.IDR,currency.is.null')
      }

      const { data: sub, error: subError } = await subQuery
        .order('expires_at', { ascending: false })
        .limit(1)
        .single()

      if (subError || !sub) {
        throw createError({ statusCode: 404, message: `Tidak ada langganan ${package_type} (${currency}) yang sedang aktif` })
      }

      // Deactivate user subscriptions for this currency
      let deactQuery = supabaseAdmin
        .from('user_package_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (currency === 'USD') {
        deactQuery = deactQuery.eq('currency', 'USD')
      } else {
        deactQuery = deactQuery.or('currency.eq.IDR,currency.is.null')
      }
      await deactQuery

      // Activate chosen subscription
      await supabaseAdmin
        .from('user_package_subscriptions')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', sub.id)

      // Update users table
      const limitMapIDR: Record<string, number> = {
        starter: 5000000,
        growth: 15000000,
        scale: 999999999
      }
      const limitMapUSD: Record<string, number> = {
        starter: 10000,
        growth: 50000,
        scale: 999999999
      }

      if (currency === 'USD') {
        await supabaseAdmin
          .from('users')
          .update({
            usd_active_package: package_type,
            usd_package_weekly_limit: limitMapUSD[package_type] || 0,
            usd_package_expires_at: sub.expires_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      } else {
        await supabaseAdmin
          .from('users')
          .update({
            active_package: package_type,
            package_weekly_limit: limitMapIDR[package_type] || 0,
            package_expires_at: sub.expires_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }

      return {
        success: true,
        active_package: package_type,
        currency,
        expires_at: sub.expires_at
      }
    }

    if (rpcResult && rpcResult.success === false) {
      throw createError({ statusCode: 400, message: rpcResult.error || 'Gagal mengubah paket aktif' })
    }

    return {
      success: true,
      active_package: package_type,
      details: rpcResult
    }
  } catch (err: any) {
    console.error('Error switching active package:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Gagal mengubah paket aktif'
    })
  }
})

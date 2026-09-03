import { serverSupabaseServiceRole } from '#supabase/server'
import { syncUserHighestPackage } from '../../utils/packageSync'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const paymentId = query.paymentId as string

  if (!paymentId) {
    throw createError({ statusCode: 400, statusMessage: 'paymentId is required' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.nowpaymentsApiKey || process.env.NOWPAYMENTS_API_KEY || process.env.NUXT_NOWPAYMENTS_API_KEY

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'NOWPayments API Key not configured' })
  }

  try {
    const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('NOWPayments status check error:', result)
      throw createError({
        statusCode: response.status,
        statusMessage: result.message || 'Failed to check payment status'
      })
    }

    // If payment confirmed/finished, sync database and credit USD balance immediately
    if (['finished', 'confirmed'].includes(result.payment_status) && result.order_id) {
      try {
        const supabase = serverSupabaseServiceRole<any>(event)
        const { data: trx } = await supabase
          .from('transactions')
          .select('id, user_id, amount, package_selected, status')
          .eq('payment_gateway_ref', result.order_id)
          .maybeSingle()

        if (trx && trx.status === 'pending') {
          await supabase
            .from('transactions')
            .update({ status: 'success', currency: 'USD', updated_at: new Date().toISOString() })
            .eq('id', trx.id)

          const { data: saldo } = await supabase
            .from('saldo')
            .select('usd_balance')
            .eq('user_id', trx.user_id)
            .maybeSingle()

          const currentUsd = Number(saldo?.usd_balance || 0)
          const newUsd = currentUsd + Number(trx.amount || 0)

          await supabase
            .from('saldo')
            .upsert({ user_id: trx.user_id, usd_balance: newUsd, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

          if (trx.package_selected) {
            const expiresAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
            try {
              await supabase
                .from('user_package_subscriptions')
                .insert({
                  user_id: trx.user_id,
                  package_type: trx.package_selected,
                  expires_at: expiresAt,
                  is_active: true,
                  currency: 'USD'
                })
            } catch (err) {
              console.error('Error inserting USD package subscription:', err)
            }
          }

          await syncUserHighestPackage(supabase, trx.user_id, 'USD')
        }
      } catch (err) {
        console.error('Failed to sync NOWPayments status to DB:', err)
      }
    }

    return {
      paymentId: result.payment_id,
      status: result.payment_status,
      payAddress: result.pay_address,
      payAmount: result.pay_amount,
      actuallyPaid: result.actually_paid,
      payCurrency: result.pay_currency,
      orderId: result.order_id
    }
  } catch (error: any) {
    console.error('Error checking NOWPayments status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to check payment status'
    })
  }
})

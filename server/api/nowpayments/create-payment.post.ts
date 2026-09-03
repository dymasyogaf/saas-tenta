import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { amount, packageType } = body

  if (!amount || amount < 30) {
    throw createError({ statusCode: 400, statusMessage: 'Minimal deposit layanan $30' })
  }

  const netAmount = parseFloat(amount)

  const supabase = serverSupabaseServiceRole<any>(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const userId = user.id || (user as any).sub

  let selectedPkg = packageType
  if (!selectedPkg || !['starter', 'growth', 'scale'].includes(selectedPkg)) {
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('usd_active_package, active_package')
        .eq('id', userId)
        .single()
      
      if (userProfile?.usd_active_package && ['starter', 'growth', 'scale'].includes(userProfile.usd_active_package)) {
        selectedPkg = userProfile.usd_active_package
      } else if (userProfile?.active_package && ['starter', 'growth', 'scale'].includes(userProfile.active_package)) {
        selectedPkg = userProfile.active_package
      }
    } catch (e) {
      console.warn('Could not fetch user active package:', e)
    }
  }

  // Fallback if still undetermined
  if (!selectedPkg || !['starter', 'growth', 'scale'].includes(selectedPkg)) {
    if (netAmount >= 51000) selectedPkg = 'scale'
    else if (netAmount >= 11000) selectedPkg = 'growth'
    else selectedPkg = 'starter'
  }

  // Exact fee percentage per package: Starter = 5%, Growth = 4%, Scale = 3%
  let feePercentage = 0.05
  if (selectedPkg === 'scale') {
    feePercentage = 0.03
  } else if (selectedPkg === 'growth') {
    feePercentage = 0.04
  } else {
    feePercentage = 0.05
  }

  const feeAmount = netAmount * feePercentage
  const paymentAmount = netAmount + feeAmount

  const config = useRuntimeConfig()
  const apiKey = config.nowpaymentsApiKey || process.env.NOWPAYMENTS_API_KEY || process.env.NUXT_NOWPAYMENTS_API_KEY

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'NOWPayments API Key not configured' })
  }

  const merchantOrderId = `NP-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  try {
    // Create payment via NOWPayments API
    const npResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        price_amount: paymentAmount,
        price_currency: 'usdttrc20',
        pay_currency: 'usdttrc20',
        order_id: merchantOrderId,
        order_description: `Deposit Layanan Iklan (USD) via USDT TRC-20 (Paket ${selectedPkg})`,
        ipn_callback_url: config.nowpaymentsWebhookUrl || 'https://area.tentaklik.com/api/nowpayments/webhook'
      })
    })

    const result = await npResponse.json()

    if (!npResponse.ok || !result.payment_id) {
      console.error('NOWPayments API Error:', result)
      throw createError({
        statusCode: 400,
        statusMessage: `NOWPayments Error: ${result.message || result.statusCode || 'Failed to create payment'}`
      })
    }

    // Direct 1:1 USDT parity matching paymentAmount
    const rawPayAmount = result.pay_amount ? parseFloat(result.pay_amount) : paymentAmount
    const finalPayAmount = rawPayAmount || paymentAmount

    // Save transaction to DB
    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'topup',
        amount: netAmount,
        fee_amount: feeAmount,
        package_selected: selectedPkg,
        status: 'pending',
        currency: 'USD',
        payment_gateway_ref: merchantOrderId,
        description: `Deposit Layanan Iklan (USD) via USDT TRC-20 (Paket ${selectedPkg})`,
        payment_data: {
          paymentId: result.payment_id,
          payAddress: result.pay_address,
          payAmount: finalPayAmount,
          merchantOrderId,
          netAmount,
          feeAmount,
          totalAmount: paymentAmount,
          packageType: selectedPkg,
          expirationEstimate: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      })

    if (dbError) {
      console.error('Error insert transaction:', dbError)
      throw createError({ statusCode: 500, statusMessage: `Gagal mencatat transaksi: ${dbError.message}` })
    }

    return {
      success: true,
      paymentId: result.payment_id,
      payAddress: result.pay_address,
      payAmount: finalPayAmount,
      merchantOrderId,
      netAmount,
      feeAmount,
      totalAmount: paymentAmount,
      packageType: selectedPkg,
      expirationEstimate: new Date(Date.now() + 60 * 60 * 1000).toISOString() // ~60 minutes
    }
  } catch (error: any) {
    console.error('Error create NOWPayments payment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Terjadi kesalahan saat memproses pembayaran'
    })
  }
})

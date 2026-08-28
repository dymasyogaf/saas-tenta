export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const paymentId = query.paymentId as string

  if (!paymentId) {
    throw createError({ statusCode: 400, statusMessage: 'paymentId is required' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.nowpaymentsApiKey

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

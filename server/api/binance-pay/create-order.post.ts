import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { amount, packageType } = body

  if (!amount || amount < 30) {
    throw createError({ statusCode: 400, statusMessage: 'Minimal deposit layanan $30' })
  }

  // Validasi Paket dan Hitung Fee
  let feePercentage = 0;
  let minAmount = 0;
  let maxAmount = Infinity;

  if (packageType === 'starter') {
    feePercentage = 0.05; // 5%
    minAmount = 30;
    maxAmount = 10000;
  } else if (packageType === 'growth') {
    feePercentage = 0.04; // 4%
    minAmount = 11000;
    maxAmount = 50000;
  } else if (packageType === 'scale') {
    feePercentage = 0.03; // 3%
    minAmount = 51000;
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Paket tidak valid.' })
  }

  const netAmount = parseFloat(amount);
  if (netAmount < minAmount || netAmount > maxAmount) {
    throw createError({ statusCode: 400, statusMessage: `Nominal untuk paket ${packageType} harus antara $${minAmount} dan $${maxAmount}` })
  }

  const feeAmount = netAmount * feePercentage;
  const paymentAmount = netAmount + feeAmount;
  
  const supabase = serverSupabaseServiceRole<any>(event)
  const user = await serverSupabaseUser(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const userId = user.id || (user as any).sub

  const config = useRuntimeConfig()
  const apiKey = config.binancePayApiKey
  const secretKey = config.binancePaySecretKey

  if (!apiKey || !secretKey) {
    throw createError({ statusCode: 500, statusMessage: 'Binance Pay API Key not configured' })
  }

  const merchantOrderId = `USDT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  
  const appProtocol = getRequestProtocol(event) || 'https'
  const appHost = getRequestHost(event)
  const appBaseUrl = `${appProtocol}://${appHost}`

  const binanceBody = {
    env: {
      terminalType: 'WEB'
    },
    merchantTradeNo: merchantOrderId,
    orderAmount: paymentAmount.toFixed(2), // Exact 2 decimal places
    currency: 'USDT',
    goods: {
      goodsType: '02',
      goodsCategory: 'Z000',
      referenceGoodsId: packageType,
      goodsName: `Layanan Iklan Digital ${packageType.toUpperCase()}`,
      goodsDetail: `Deposit Layanan Iklan (USD)`
    },
    returnUrl: `${appBaseUrl}/dashboard/topup`,
    cancelUrl: `${appBaseUrl}/dashboard/topup`
  }

  const timestamp = Date.now().toString()
  const nonce = crypto.randomBytes(16).toString('hex')
  const payloadToSign = timestamp + '\n' + nonce + '\n' + JSON.stringify(binanceBody) + '\n'
  const signature = crypto.createHmac('sha512', secretKey).update(payloadToSign).digest('hex').toUpperCase()

  const endpoint = 'https://bpay.binanceapi.com/binancepay/openapi/v2/order'

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-Sn': apiKey,
        'BinancePay-Signature': signature
      },
      body: JSON.stringify(binanceBody)
    })

    const result = await response.json()

    if (result.status === 'SUCCESS' && result.data) {
      // Simpan transaksi (Note: We use transaction type topup_usd if needed, or we just rely on currency/gateway info)
      const { error: dbError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'topup',
          amount: netAmount, 
          fee_amount: feeAmount,
          package_selected: packageType,
          status: 'pending',
          payment_gateway_ref: merchantOrderId,
          description: `Deposit Layanan Iklan (USD) via Binance Pay (Paket ${packageType})`
        })

      if (dbError) {
        console.error('Error insert transaction:', dbError)
        throw createError({ statusCode: 500, statusMessage: `Gagal mencatat transaksi: ${dbError.message}` })
      }

      return {
        success: true,
        paymentUrl: result.data.checkoutUrl,
        reference: result.data.prepayId,
        merchantOrderId,
        paymentAmount,
        netAmount,
        feeAmount,
        packageType
      }
    } else {
      console.error('Binance Pay Error:', result)
      throw createError({ statusCode: 400, statusMessage: `Binance Pay Error: ${result.errorMessage || 'Failed to create order'}` })
    }

  } catch (error: any) {
    console.error('Error create binance payment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Terjadi kesalahan saat memproses pembayaran'
    })
  }
})

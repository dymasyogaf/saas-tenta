import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import crypto from 'node:crypto'
import { sendVaEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  // 1. Ambil body dari request frontend
  const body = await readBody(event)
  const { amount, method, packageType } = body

  if (!amount || amount < 10000) {
    throw createError({ statusCode: 400, statusMessage: 'Minimal deposit layanan Rp 10.000' })
  }

  const netAmount = parseInt(amount);

  // Hitung Fee Persentase murni berdasarkan nominal topup per-transaksi
  let feePercentage = 0.05; // Default 5% (Starter nominal: < 5jt)
  if (netAmount >= 15000000) {
    feePercentage = 0.035; // 3.5% (Scale nominal: >= 15jt)
  } else if (netAmount >= 5000000) {
    feePercentage = 0.045; // 4.5% (Growth nominal: 5jt - 15jt)
  }

  // Tentukan selectedPackage untuk transaksi (jika dikirim dari frontend, atau di-infer dari nominal)
  let selectedPkg = packageType;
  if (!selectedPkg || !['starter', 'growth', 'scale'].includes(selectedPkg)) {
    if (netAmount >= 15000000) selectedPkg = 'scale';
    else if (netAmount >= 5000000) selectedPkg = 'growth';
    else selectedPkg = 'starter';
  }

  const feeAmount = Math.round(netAmount * feePercentage);
  const paymentAmount = netAmount + feeAmount;
  // Catatan: Karena ini di backend Nuxt (Nitro), kita bisa baca headers token
  // Namun untuk keamanan penuh, kita gunakan service_role untuk menulis ke tabel transactions
  const supabase = serverSupabaseServiceRole<any>(event)
  
  // Kita mengekstrak data dari token sesi yang tervalidasi
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const userId = user.id || (user as any).sub
  const userEmail = user.email || 'member@tentaklik.com'
  const userName = user.user_metadata?.full_name || 'Member Tentaklik'
  const userPhone = user.user_metadata?.phone || ''

  // 3. Konfigurasi Duitku
  const config = useRuntimeConfig()
  const merchantCode = config.duidkuMerchantCode || process.env.DUIDKU_MERCHANT_CODE
  const apiKey = config.duidkuApiKey || process.env.DUIDKU_API_KEY
  const isProduction = process.env.DUIDKU_IS_PRODUCTION === 'true'

  if (!merchantCode || !apiKey) {
    console.error('[Duitku] Error: Merchant Code atau API Key belum dikonfigurasi di Environment Variable')
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Layanan pembayaran Duitku belum dikonfigurasi dengan benar di server.' 
    })
  }

  // 4. Siapkan Data Transaksi
  const merchantOrderId = `TP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  
  // Signature = MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
  const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  const signature = crypto.createHash('md5').update(signatureString).digest('hex')

  const baseUrlDuitku = isProduction ? 'https://passport.duitku.com' : 'https://sandbox.duitku.com'
  const endpoint = `${baseUrlDuitku}/webapi/api/merchant/v2/inquiry`

  // Buat URL secara dinamis sesuai lingkungan aplikasi saat ini (localhost atau domain live)
  const appProtocol = getRequestProtocol(event) || 'https'
  const appHost = getRequestHost(event)
  const appBaseUrl = `${appProtocol}://${appHost}`

  const callbackUrl = `${appBaseUrl}/api/duidku/callback`
  const returnUrl = `${appBaseUrl}/dashboard/topup`

  const payload: any = {
    merchantCode,
    paymentAmount,
    merchantOrderId,
    productDetails: 'Layanan Manajemen Iklan Digital Tentaklik',
    additionalParam: '',
    merchantUserInfo: userId,
    customerVaName: userName || 'Member Tentaklik',
    email: 'billing@tentaklik.com', // Kirim ke email dummy agar Duitku tidak kirim email ke customer
    phoneNumber: userPhone || '',
    itemDetails: [
      {
        name: 'Layanan Manajemen Iklan Digital',
        price: paymentAmount,
        quantity: 1
      }
    ],
    customerDetail: {
      firstName: userName || 'Member',
      lastName: 'Tentaklik',
      email: 'billing@tentaklik.com', // Dummy email ke Duitku
      phoneNumber: userPhone || '',
    },
    callbackUrl,
    returnUrl,
    signature,
    expiryPeriod: 60 // 60 menit
  }

  payload.paymentMethod = method || 'OV' // 'OV' adalah kode untuk OVO

  // 5. Kirim Request ke Duitku dengan Timeout Controller (15 detik)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[Duitku] Gateway returned HTTP error:', response.status, errText)
      throw createError({
        statusCode: 502,
        statusMessage: `Payment gateway Duitku merespon error (HTTP ${response.status}). Silakan coba beberapa saat lagi.`
      })
    }

    const result = await response.json()

    if (result.statusCode === '00') {
      // 6. Simpan transaksi berstatus 'pending' ke Supabase
      const methodNames: Record<string, string> = {
        'M2': 'Mandiri Virtual Account',
        'I1': 'BNI Virtual Account',
        'B1': 'BSI Virtual Account',
        'A1': 'ATM Bersama',
        'FT': 'Alfamart / Pegadaian',
        'IR': 'Indomaret',
        'BC': 'BCA Virtual Account',
        'BM': 'Mandiri Virtual Account',
        'BR': 'BRI Virtual Account',
        'OV': 'OVO',
        'SA': 'ShopeePay',
        'DA': 'DANA',
        'SP': 'QRIS',
      }
      const paymentName = methodNames[method] || 'Payment Gateway'

      // Kode Bank berdasarkan metode pembayaran
      const bankCodes: Record<string, string> = {
        'M2': '008', 'BM': '008',
        'I1': '009',
        'B1': '427',
        'BC': '014',
        'BR': '002',
        'A1': '166',
        'FT': '', 'IR': '',
      }

      const paymentData = {
        method,
        paymentName,
        paymentAmount,
        netAmount,
        feeAmount,
        packageType: selectedPkg,
        bankCode: bankCodes[method] || null,
        vaNumber: result.vaNumber || result.paymentCode || null,
        paymentCode: result.paymentCode || result.vaNumber || null,
        merchantOrderId
      }

      const { error: dbError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'topup',
          amount: netAmount, // Simpan saldo bersih
          fee_amount: feeAmount,
          package_selected: selectedPkg,
          status: 'pending',
          currency: 'IDR',
          payment_gateway_ref: result.reference,
          description: `Pembayaran Layanan Iklan via ${paymentName} (Paket ${selectedPkg})`,
          is_sandbox: !isProduction,
          payment_url: result.paymentUrl || null,
          payment_data: paymentData
        })

      if (dbError) {
        console.error('Error insert transaction:', dbError)
        throw createError({ statusCode: 500, statusMessage: `Gagal mencatat transaksi di database internal: ${dbError.message}` })
      }

      // Kirim email notifikasi VA ke customer (brand Tentaklik, bukan Duitku)
      // Dijalankan secara async agar tidak memperlambat respons ke frontend
      sendVaEmail({
        to: userEmail,
        customerName: userName || 'Member Tentaklik',
        paymentName,
        vaNumber: result.vaNumber || null,
        paymentCode: result.paymentCode || null,
        netAmount,
        feeAmount,
        paymentAmount,
        packageType,
        merchantOrderId,
        expiryMinutes: 60,
        productDetails: 'Layanan Manajemen Iklan Digital',
      }).catch((err: Error) => console.error('[Email] Error kirim VA email:', err))

      // Berhasil — kembalikan data VA agar frontend bisa tampil halaman custom
      return {
        success: true,
        paymentUrl: result.paymentUrl,
        reference: result.reference,
        merchantOrderId,
        // Data untuk halaman custom VA
        vaNumber: result.vaNumber || result.paymentCode || null,
        paymentCode: result.paymentCode || result.vaNumber || null,
        bankCode: bankCodes[method] || null,
        paymentName,
        paymentMethod: method,
        paymentAmount,
        netAmount,
        feeAmount,
        packageType,
        expiryMinutes: 60,
      }
    } else {
      console.error('Duitku Error:', result)
      throw createError({ statusCode: 400, statusMessage: `Duitku: ${result.statusMessage || result.Message || 'Gagal dari payment gateway'}` })
    }

  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('Error create payment:', error)
    if (error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Koneksi ke gateway pembayaran Duitku mengalami timeout (lebih dari 15 detik). Silakan coba beberapa saat lagi.'
      })
    }
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Terjadi kesalahan saat memproses pembayaran'
    })
  }
})

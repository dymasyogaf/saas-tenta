import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const phone = body.phone

  if (!phone) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor telepon diperlukan' })
  }

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sesi tidak valid. Silakan login terlebih dahulu.' })
  }

  const userId = user.id || (user as any).sub
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'User ID tidak ditemukan pada sesi Anda.' })
  }

  const supabase = await serverSupabaseClient(event)

  const otpCode = crypto.randomInt(100000, 999999).toString()
  
  // Expiry time (5 minutes from now)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  // 2. Save OTP to user's record
  const { error: updateError } = await (supabase as any)
    .from('users')
    .update({
      otp_code: otpCode,
      otp_expires_at: expiresAt,
      otp_attempts: 0
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Supabase Update Error:', updateError)
    throw createError({ statusCode: 400, statusMessage: 'Gagal menyimpan OTP: ' + updateError.message })
  }

  // 3. Send OTP via Fonnte
  const config = useRuntimeConfig()
  const fonnteToken = config.fonnteApiToken

  if (!fonnteToken) {
    console.warn('[OTP DEV MODE] Fonnte Token is missing. OTP simulated.')
    return { success: true, message: 'OTP dikirim (Simulasi Dev)' }
  }

  try {
    const params = new URLSearchParams()
    params.append('target', phone.replace('+', ''))
    params.append('message', `TENTAKLIK\nKode Verifikasi (OTP) Anda adalah: *${otpCode}*\n\nJangan berikan kode ini kepada siapapun. Kode ini berlaku selama 5 menit.`)
    params.append('countryCode', '62')

    console.log('Sending OTP via Fonnte to:', phone, 'Token:', fonnteToken ? 'EXISTS' : 'EMPTY')

    const response: any = await $fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken
      },
      body: params
    })

    console.log('Fonnte Response:', response)

    if (!response || response.status === false) {
      console.error('Fonnte Rejected:', response)
      throw new Error(response?.reason || 'Unknown error from Fonnte')
    }

    return { success: true, message: 'OTP berhasil dikirim melalui WhatsApp.' }
  } catch (err: any) {
    console.error('Fonnte API Error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Gagal mengirim pesan WhatsApp.' })
  }
})

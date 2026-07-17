import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const phone = body.phone
  const otp = body.code || body.otp // Dukung payload .code atau .otp

  if (!phone || !otp) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor telepon dan OTP diperlukan' })
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

  const { data: dbUser, error: dbError } = await (supabase as any)
    .from('users')
    .select('id, otp_code, otp_expires_at')
    .eq('id', userId)
    .single()

  if (dbError || !dbUser) {
    throw createError({ statusCode: 404, statusMessage: 'Data OTP tidak ditemukan.' })
  }

  // 2. Verify OTP code
  const dbOtp = String((dbUser as any).otp_code).trim()
  const inputOtp = String(otp).replace(/\s/g, '').trim()

  if (dbOtp !== inputOtp) {
    throw createError({ statusCode: 400, statusMessage: 'OTP salah mohon coba lagi' })
  }

  // 3. Verify Expiry
  const now = new Date()
  const expiresAt = new Date((dbUser as any).otp_expires_at)

  if (now > expiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Kode OTP sudah kadaluarsa. Silakan kirim ulang.' })
  }

  // 4. Mark phone as verified and clear OTP data (also update the phone number in DB if it was empty)
  const { error: updateError } = await (supabase as any)
    .from('users')
    .update({ 
      phone: phone, // Save the phone number to the profile if it was verified successfully
      phone_verified: true,
      otp_code: null,
      otp_expires_at: null
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Supabase Update Error:', updateError)
    throw createError({ statusCode: 500, statusMessage: 'Gagal memperbarui status verifikasi di database: ' + updateError.message })
  }

  return { success: true, message: 'Verifikasi berhasil!' }
})

import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const body = await readBody(event)
  const { code } = body

  if (!code) {
    throw createError({ statusCode: 400, message: 'Kode referral tidak boleh kosong' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // 1. Dapatkan data pengguna (untuk cek batas 60 hari)
    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .select('created_at')
      .eq('id', uid)
      .single()

    if (userError || !userData) {
      throw createError({ statusCode: 500, message: 'Gagal memuat data pengguna' })
    }

    const createdAt = new Date(userData.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 60) {
      throw createError({ statusCode: 400, message: 'Batas waktu memasukkan kode referral sudah lewat (Maks. 60 hari dari pendaftaran)' })
    }

    // 2. Cek apakah user sudah pernah submit kode
    const { data: existingReferral } = await (supabase as any)
      .from('referrals')
      .select('id')
      .eq('referee_id', uid)
      .single()

    if (existingReferral) {
      throw createError({ statusCode: 400, message: 'Anda sudah pernah menggunakan kode referral sebelumnya' })
    }

    // 3. Cek apakah kode valid dan ada
    const { data: refCodeData } = await (supabase as any)
      .from('referral_codes')
      .select('user_id, code')
      .ilike('code', code)
      .single()

    if (!refCodeData) {
      throw createError({ statusCode: 400, message: 'Kode referral tidak ditemukan' })
    }

    // 4. Cek apakah ini kode milik sendiri
    if (refCodeData.user_id === uid) {
      throw createError({ statusCode: 400, message: 'Tidak dapat menggunakan kode referral Anda sendiri' })
    }

    // 5. Masukkan ke tabel referrals
    const { error: insertError } = await (supabase as any)
      .from('referrals')
      .insert({
        referrer_id: refCodeData.user_id,
        referee_id: uid,
        referral_code: refCodeData.code,
        status: 'pending_reward'
      })

    if (insertError) {
      console.error('Insert Referral Error:', insertError)
      throw createError({ statusCode: 500, message: 'Gagal memproses kode referral' })
    }

    return {
      success: true,
      message: 'Kode referral berhasil diterapkan. Anda mendapat diskon 20% untuk pembayaran pertama!'
    }
  } catch (error: any) {
    console.error('Referral Submit Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server'
    })
  }
})

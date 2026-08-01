import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = serverSupabaseServiceRole<any>(event)
    const body = await readBody(event)
    const { userId, status, message } = body

    if (!userId || !status) {
      throw createError({ statusCode: 400, message: 'Bad Request: userId and status are required' })
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({ verification_status: status })
      .eq('id', userId)

    if (updateError) throw updateError

    // Insert notification
    const title = status === 'verified' ? 'Verifikasi Disetujui' : 'Verifikasi Ditolak'
    const notifMessage = status === 'verified' 
      ? 'Selamat! Data identitas Anda telah disetujui. Anda sekarang dapat mengakses semua fitur.'
      : message || 'Maaf, verifikasi identitas Anda ditolak. Silakan periksa kembali dan ajukan ulang.'

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'verification',
        title,
        message: notifMessage
      })

    if (notifError) throw notifError

    return { success: true }
  } catch (error: any) {
    console.error('Error verifying user:', error)
    throw createError({ statusCode: 500, message: error.message || 'Internal Server Error' })
  }
})

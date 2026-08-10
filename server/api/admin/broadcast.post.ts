import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  // Hanya super_admin yang bisa kirim broadcast (atau sesuaikan dengan kebutuhan)
  const user = await requireAdmin(event, ['super_admin'])
  
  const body = await readBody(event)
  const { title, message, targetRole } = body

  if (!title || !message || !targetRole) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Semua kolom (Judul, Pesan, Target) wajib diisi.'
    })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)

  try {
    const senderId = user.id || (user as any).user_id || (user as any).sub
    
    // Panggil fungsi SQL (RPC) untuk mem-broadcast notifikasi secara efisien
    const { data: broadcastId, error } = await supabase.rpc('broadcast_notification', {
      p_title: title,
      p_message: message,
      p_target_role: targetRole,
      p_sender_id: senderId
    })

    if (error) throw error

    return { success: true, message: 'Pengumuman berhasil dikirim', broadcastId }
  } catch (error: any) {
    console.error('Broadcast failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengirim pengumuman'
    })
  }
})

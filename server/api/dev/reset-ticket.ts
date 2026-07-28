import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Pengaman: Jangan biarkan ini dijalankan di production
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden in production' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // 1. Hapus semua data dari ticket_replies terlebih dahulu agar tidak ada konflik foreign key
    const { error: errorReplies } = await supabase
      .from('ticket_replies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Trick untuk menghapus semua data (Supabase JS butuh filter)

    if (errorReplies) throw errorReplies

    // 2. Hapus semua data dari support_tickets
    const { error: errorTickets } = await supabase
      .from('support_tickets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (errorTickets) throw errorTickets

    return { 
      success: true, 
      message: 'Semua tiket dan balasan berhasil dihapus. Database bersih dan siap untuk dimulai dari TKT-0001.' 
    }
  } catch (error: any) {
    console.error('Error resetting tickets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal melakukan reset tiket'
    })
  }
})

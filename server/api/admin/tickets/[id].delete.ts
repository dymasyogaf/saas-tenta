import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    // Hapus semua balasan tiket terlebih dahulu (hindari foreign key constraint error)
    const { error: repliesError } = await supabase
      .from('ticket_replies')
      .delete()
      .eq('ticket_id', ticketId)

    if (repliesError) throw repliesError

    // Hapus tiket
    const { error: ticketError } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId)

    if (ticketError) throw ticketError

    return { success: true, message: 'Tiket berhasil dihapus' }
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal menghapus tiket'
    })
  }
})

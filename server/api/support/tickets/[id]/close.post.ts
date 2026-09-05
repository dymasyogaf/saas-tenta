import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { sendPushToUser } from '../../../../utils/webPush'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  try {
    // Ambil info tiket sebelum close
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id, subject, ticket_number')
      .eq('id', ticketId)
      .single()

    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', ticketId)

    if (error) throw error

    // Notifikasi real-time: Tiket Ditutup
    if (ticket?.user_id) {
      const notifTitle = 'Tiket Bantuan Ditutup'
      const notifMessage = `Tiket "${ticket.subject || ''}" (${ticket.ticket_number || ''}) telah ditutup. Jika Anda masih memerlukan bantuan, silakan buat tiket baru.`

      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'ticket_closed',
        title: notifTitle,
        message: notifMessage,
        created_at: new Date().toISOString()
      })

      sendPushToUser(event, ticket.user_id, {
        title: notifTitle,
        body: notifMessage,
        url: '/dashboard/support',
        tag: `ticket-closed-${ticketId}`
      }).catch(() => {})
    }

    return { success: true, message: 'Tiket berhasil ditutup' }
  } catch (error: any) {
    console.error('Error closing ticket:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal menutup tiket'
    })
  }
})

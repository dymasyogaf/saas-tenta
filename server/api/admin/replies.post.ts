import { serverSupabaseServiceRole } from '#supabase/server'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const body = await readBody(event)
  const { ticket_id, content, status, attachments } = body

  if (!ticket_id || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID dan isi balasan wajib diisi' })
  }

  // Sanitasi HTML
  const safeContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['u']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class']
    }
  })

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    const adminName = user.user_metadata?.full_name || 'Admin Support'
    const userId = user.id || (user as any).sub
    const userRole = user.user_metadata?.role as string || 'admin'

    // Ambil info tiket
    const { data: ticket, error: fetchErr } = await supabase
      .from('support_tickets')
      .select('assigned_to_role')
      .eq('id', ticket_id)
      .single()
      
    if (fetchErr) throw fetchErr

    if (userRole !== 'super_admin' && userRole !== 'admin_compliance') {
      if (ticket.assigned_to_role !== userRole) {
        throw createError({ statusCode: 403, statusMessage: 'Tiket ini belum didelegasikan ke tim Anda. Harap tunggu arahan Tim Audit.' })
      }
    }

    // 1. Simpan balasan
    const { error: replyError } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id,
        user_id: userId,
        sender_name: adminName,
        content: safeContent,
        is_staff: true,
        attachments: attachments || []
      })

    if (replyError) throw replyError

    // 2. Update status tiket jika ada
    if (status) {
      const { error: statusError } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticket_id)

      if (statusError) throw statusError
    }

    return { success: true, message: 'Balasan berhasil dikirim' }
  } catch (error: any) {
    console.error('Error submitting reply:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengirim balasan'
    })
  }
})


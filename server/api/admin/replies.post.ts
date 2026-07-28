import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const role = user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'admin_compliance') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

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
      '*': ['class', 'style']
    }
  })

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    const adminName = user.user_metadata?.full_name || 'Admin Support'
    const userId = user.id || (user as any).sub

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

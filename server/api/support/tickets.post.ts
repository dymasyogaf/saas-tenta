import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { subject, category, description, priority, attachments } = body
  
  if (!subject || !category || !description) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi' })
  }

  // Sanitasi HTML untuk mencegah XSS
  const safeDescription = sanitizeHtml(description, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['u']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class']
    }
  })

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  try {
    const userId = user.id || (user as any).sub

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        ticket_number: ticketNumber,
        subject,
        category,
        description: safeDescription,
        status: 'open',
        priority: priority || 'normal',
        attachments: attachments || []
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, message: 'Tiket berhasil dibuat', data }
  } catch (error: any) {
    console.error('Error creating ticket:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal membuat tiket'
    })
  }
})

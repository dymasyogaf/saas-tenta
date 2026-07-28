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
      '*': ['class', 'style']
    }
  })

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // Hitung jumlah tiket yang ada untuk membuat nomor urut (TKT-0001, TKT-0002, dst)
  const { count } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })

  const nextNum = (count || 0) + 1
  const ticketNumber = `TKT-${String(nextNum).padStart(4, '0')}`

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

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const body = await readBody(event)
  const { content, attachments } = body
  
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Pesan balasan tidak boleh kosong' })
  }

  const safeContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['u']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'style']
    }
  })

  // We use service role to fetch user data for sender_name without dealing with extra RLS rules for this specific op
  const supabase = await serverSupabaseServiceRole<any>(event)
  const userId = user.id || (user as any).sub

  try {
    // Check if user is staff (fetch from users table)
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name, email')
      .eq('id', userId)
      .single()
      
    const isStaff = userData?.role && ['super_admin', 'admin_compliance', 'admin_ads_ops', 'admin_finance'].includes(userData.role)
    const senderName = isStaff ? 'Tim Support' : (userData?.full_name || userData?.email || 'Klien')

    // Insert reply
    const { data, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        sender_name: senderName,
        content: safeContent,
        is_staff: !!isStaff,
        attachments: attachments || []
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, message: 'Balasan terkirim', data }
  } catch (error: any) {
    console.error('Error sending reply:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengirim balasan'
    })
  }
})

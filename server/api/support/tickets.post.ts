import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { subject, category, description, attachments } = body
  
  if (!subject || !category || !description) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // Generate random ticket number, e.g. TKT-10294
  const ticketNumber = 'TKT-' + Math.floor(10000 + Math.random() * 90000)

  try {
    const userId = user.id || (user as any).sub

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        ticket_number: ticketNumber,
        subject,
        category,
        description,
        status: 'open',
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

import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const role = user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'admin_compliance') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { ticket_id, status } = body
  
  if (!ticket_id || !status) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID dan Status wajib diisi' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticket_id)

    if (error) throw error

    return { success: true, message: 'Status tiket berhasil diperbarui' }
  } catch (error: any) {
    console.error('Error updating ticket status:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal memperbarui tiket'
    })
  }
})

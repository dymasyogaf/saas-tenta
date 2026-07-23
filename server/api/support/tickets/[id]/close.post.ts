import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', ticketId)

    if (error) throw error

    return { success: true, message: 'Tiket berhasil ditutup' }
  } catch (error: any) {
    console.error('Error closing ticket:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal menutup tiket'
    })
  }
})

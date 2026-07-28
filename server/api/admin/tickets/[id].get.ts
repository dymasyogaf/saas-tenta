import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const role = user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'admin_compliance') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    // Get ticket details with user info
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*, users(full_name, email)')
      .eq('id', ticketId)
      .single()

    if (ticketError) throw ticketError
    
    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (repliesError) throw repliesError

    return { 
      success: true, 
      data: {
        ...ticket,
        replies: replies || []
      } 
    }
  } catch (error: any) {
    console.error('Error fetching admin ticket details:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengambil detail tiket'
    })
  }
})

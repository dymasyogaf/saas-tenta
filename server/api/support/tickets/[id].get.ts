import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { fetchTicketDetails } from '../../../utils/support'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const supabase = await serverSupabaseClient<any>(event)
  const userId = user.id || (user as any).sub

  try {
    const data = await fetchTicketDetails(supabase, ticketId, false)

    return { 
      success: true, 
      data
    }
  } catch (error: any) {
    console.error('Error fetching ticket details:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengambil detail tiket'
    })
  }
})

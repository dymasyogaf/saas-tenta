import { serverSupabaseServiceRole } from '#supabase/server'
import { fetchTicketDetails } from '../../../utils/support'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, statusMessage: 'ID tiket diperlukan' })

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    const data = await fetchTicketDetails(supabase, ticketId, true)

    return { 
      success: true, 
      data
    }
  } catch (error: any) {
    console.error('Error fetching admin ticket details:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengambil detail tiket'
    })
  }
})

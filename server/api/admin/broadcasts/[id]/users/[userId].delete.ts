import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['super_admin'])
  
  const broadcastId = getRouterParam(event, 'id')
  const userId = getRouterParam(event, 'userId')
  
  if (!broadcastId || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'Broadcast ID and User ID required' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // Delete the specific notification for this user and broadcast
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('broadcast_id', broadcastId)
    .eq('user_id', userId)
    
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, message: 'Notification removed for this user' }
})

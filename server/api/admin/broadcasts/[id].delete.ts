import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['super_admin'])
  
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // By deleting from broadcasts, ON DELETE CASCADE will automatically delete associated notifications
  const { error } = await supabase
    .from('broadcasts')
    .delete()
    .eq('id', id)
    
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, message: 'Broadcast deleted successfully' }
})

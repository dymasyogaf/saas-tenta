import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['super_admin'])
  
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // Get all users who have a notification from this broadcast
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, users(full_name, email, role)')
    .eq('broadcast_id', id)
    
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})

import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['super_admin'])
  
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const body = await readBody(event)
  const { title, message } = body

  if (!title || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Title and message required' })
  }

  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // 1. Update broadcasts table
  const { error: broadcastErr } = await supabase
    .from('broadcasts')
    .update({ title, message })
    .eq('id', id)
    
  if (broadcastErr) throw createError({ statusCode: 500, statusMessage: broadcastErr.message })

  // 2. Update all associated notifications
  const { error: notifErr } = await supabase
    .from('notifications')
    .update({ title, message })
    .eq('broadcast_id', id)

  if (notifErr) throw createError({ statusCode: 500, statusMessage: notifErr.message })

  return { success: true, message: 'Broadcast updated successfully' }
})

import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['super_admin'])
  
  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // Get all broadcasts ordered by created_at descending
  const { data: broadcasts, error } = await supabase
    .from('broadcasts')
    .select(`
      id,
      title,
      message,
      target_role,
      created_at,
      created_by
    `)
    .order('created_at', { ascending: false })
    
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  
  if (!broadcasts || broadcasts.length === 0) return []

  // Ambil ID unik dari pembuat pengumuman
  const userIds = [...new Set(broadcasts.map(b => b.created_by).filter(Boolean))]

  let usersMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)
      
    if (usersData) {
      usersMap = usersData.reduce((acc: any, u: any) => {
        acc[u.id] = u
        return acc
      }, {})
    }
  }

  // Gabungkan data
  const result = broadcasts.map(b => ({
    ...b,
    created_by: b.created_by ? usersMap[b.created_by] : null
  }))

  return result
})

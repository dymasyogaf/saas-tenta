import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const queryUserId = query.userId as string

  let finalUserId = queryUserId
  
  if (!finalUserId) {
    const user = await serverSupabaseUser(event)
    if (user) {
      const uId = user.id || (user as any).sub
      if (uId && uId !== 'undefined') {
        finalUserId = uId
      }
    }
  }

  if (!finalUserId || finalUserId === 'undefined' || finalUserId === 'MISSING') {
    console.log('API /api/notifications Unauthorized. No valid User ID.')
    console.log('DEBUG USER FROM CLIENT:', query.debugUser)
    return []
  }
  
  // Use service role to completely bypass RLS to ensure data delivery
  const supabase = serverSupabaseServiceRole(event)
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', finalUserId)
    .order('created_at', { ascending: false })
    .limit(10)
    
  if (error) {
    console.error('Error fetching notifications:', error)
    throw createError({ statusCode: 500, message: error.message })
  }
  
  return data
})

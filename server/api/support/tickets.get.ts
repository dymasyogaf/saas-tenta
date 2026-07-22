import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const supabase = await serverSupabaseClient<any>(event)
  
  try {
    const userId = user.id || (user as any).sub

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error fetching tickets:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengambil tiket'
    })
  }
})

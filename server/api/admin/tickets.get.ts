import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_compliance'])
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // Join dengan users untuk mendapatkan nama client
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, users!inner(full_name, email)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Error fetching admin tickets:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal mengambil tiket'
    })
  }
})

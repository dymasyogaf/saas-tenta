import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Hanya Super Admin dan Compliance yang bisa akses
  const role = user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'admin_compliance') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

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

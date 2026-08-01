import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone, full_name, verification_status, verification_details, created_at, updated_at')
      .eq('verification_status', 'pending')
      .order('updated_at', { ascending: false })
      
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching pending verifications:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data verifikasi'
    })
  }
})

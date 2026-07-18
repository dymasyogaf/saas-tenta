import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // 1. Ambil data semua user yang BUKAN client (atau role tidak null dan bukan client)
    const { data: staffData, error: staffErr } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .neq('role', 'client')
      .order('created_at', { ascending: false })

    if (staffErr) throw staffErr
    
    // Fallback: juga saring di memori jika ada yang null
    const filtered = (staffData || []).filter((u: any) => u.role && u.role !== 'client')

    return filtered
  } catch (error: any) {
    console.error('Error fetching staff list:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data staf'
    })
  }
})

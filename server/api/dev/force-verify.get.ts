import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ verification_status: 'verified' })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update semua user (gunakan UUID valid untuk bypass filter Supabase)
      
    if (error) throw error

    return { success: true, message: 'Berhasil memverifikasi semua user' }
  } catch (error: any) {
    console.error('Force verify error:', error)
    return { success: false, error: error.message }
  }
})

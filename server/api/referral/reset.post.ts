import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const uid = user?.id || (user as any)?.sub
  
  if (!uid) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // Memanggil fungsi RPC untuk menghapus semua data referral & mereset sequence ke 1
    const { error } = await (supabase as any).rpc('reset_referral_sequence')
    
    if (error) {
      console.error('RPC Error:', error)
      throw error
    }

    return { success: true, message: 'Data referral dan nomor urut (sequence) berhasil direset ke 0001' }
  } catch (error: any) {
    console.error('Error resetting referral data:', error)
    return { success: false, message: error.message }
  }
})

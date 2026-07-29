import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Hanya admin atau super_admin yang bisa menghapus user
  await requireAdmin(event, ['super_admin', 'admin'])
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID Klien tidak valid' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    // Menghapus user dari Supabase Auth
    // Jika ada constraint ON DELETE CASCADE, ini juga akan menghapus dari tabel public.users
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    
    // Walaupun gagal di auth (misal user tidak ditemukan), kita tetap coba hapus dari public.users untuk cleanup
    const { error: dbError } = await supabase.from('users').delete().eq('id', id)
    
    if (authError && dbError) {
      throw new Error(authError.message || dbError.message)
    }

    return { success: true, message: 'Klien berhasil dihapus sepenuhnya' }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Gagal menghapus klien' })
  }
})

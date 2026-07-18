import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { action } = body

    if (action === 'promote') {
      const { user_id, role } = body
      if (!user_id || !role) throw new Error('User ID dan Role wajib diisi')

      // Update tabel public.users
      const { error } = await supabase
        .from('users')
        .update({ role: role })
        .eq('id', user_id)

      if (error) throw error
      return { success: true, message: 'Berhasil mengubah jabatan klien' }
    } 
    
    else if (action === 'create') {
      const { email, password, full_name, role } = body
      if (!email || !password || !role) throw new Error('Email, Password, dan Role wajib diisi')

      // 1. Create Auth User via Supabase Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto confirm
        user_metadata: {
          full_name: full_name,
          role: role
        }
      })

      if (authError) throw authError
      const newUserId = authData.user.id

      // 2. Karena trigger otomatis membuat baris di public.users sebagai 'client',
      // kita harus segera menimpanya dengan role yang benar.
      const { error: updateErr } = await supabase
        .from('users')
        .update({ role: role, full_name: full_name })
        .eq('id', newUserId)

      if (updateErr) {
        console.error('Gagal update role di public.users, tapi auth berhasil dibuat', updateErr)
      }

      return { success: true, message: 'Berhasil membuat akun staf baru' }
    }
    
    else {
      throw new Error('Aksi tidak valid')
    }

  } catch (error: any) {
    console.error('Error in staff operation:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Terjadi kesalahan sistem'
    })
  }
})

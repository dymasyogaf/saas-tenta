import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  try {
    const targetEmail = 'dymas@alfatihah.com'
    const targetPassword = 'Dymasyogaf260204'

    // 1. Ambil semua user dari Auth Supabase
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    let targetUser = users.find((u: any) => u.email === targetEmail)

    // 2. Jika akun belum pernah didaftarkan, kita buatkan akunnya langsung dari belakang layar
    if (!targetUser) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true,
        user_metadata: { role: 'super_admin', full_name: 'Super Admin Dymas' }
      })
      if (createError) throw createError
      targetUser = newUser.user
    } else {
      // Jika sudah ada, pastikan metadata dan passwordnya diupdate
      await supabase.auth.admin.updateUserById(targetUser.id, {
        password: targetPassword,
        user_metadata: { role: 'super_admin' }
      })
    }

    if (!targetUser) throw new Error("Gagal mendapatkan/membuat target user")

    // 3. Pastikan user tersebut punya baris di tabel public.users dan jadikan super_admin
    const { data: existingRow } = await (supabase as any).from('users').select('id').eq('id', targetUser.id).maybeSingle()
    if (!existingRow) {
      await (supabase as any).from('users').insert({ 
        id: targetUser.id, 
        email: targetEmail, 
        role: 'super_admin',
        full_name: 'Super Admin Dymas'
      })
    } else {
      await (supabase as any).from('users').update({ role: 'super_admin' }).eq('id', targetUser.id)
    }

    // 4. Jadikan semua akun LAINNYA sebagai 'client' biasa (downgrade)
    for (const u of users) {
      if (u.id !== targetUser.id) {
        // Downgrade di metadata
        await supabase.auth.admin.updateUserById(u.id, {
          user_metadata: { role: 'client' }
        })
        // Downgrade di tabel public.users
        await (supabase as any).from('users').update({ role: 'client' }).eq('id', u.id)
      }
    }

    return { 
      success: true, 
      message: 'EKSEKUSI BERHASIL! Akun dymas@alfatihah.com telah dibuat dan menjadi Super Admin tunggal. Akun lain telah diturunkan menjadi Client.',
      targetUser: targetUser.email
    }
  } catch (error: any) {
    return { success: false, message: error.message, error }
  }
})

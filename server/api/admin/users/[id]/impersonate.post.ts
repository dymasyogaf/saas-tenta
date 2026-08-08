import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Hanya super_admin yang bisa impersonate (masuk sebagai user lain)
  await requireAdmin(event, ['super_admin'])
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID Klien tidak valid' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)
  const body = await readBody(event) || {}
  const redirectTo = body.redirectTo || 'https://member.tentaklik.com/confirm'

  try {
    // Dapatkan data user (khususnya email) untuk membuat magic link
    const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(id)
    
    if (authError || !userAuth || !userAuth.user) {
      throw new Error(authError?.message || 'User tidak ditemukan di sistem Auth')
    }

    const userEmail = userAuth.user.email
    if (!userEmail) {
       throw new Error('User tidak memiliki email yang valid untuk login.')
    }

    // Buat magic link khusus untuk user ini tanpa mengirimkan email
    // 'generateLink' hanya menghasilkan link dan tidak otomatis mengirim email.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: redirectTo
      }
    })

    if (linkError) {
      throw new Error(linkError.message)
    }

    if (!linkData || !linkData.properties || !linkData.properties.action_link) {
        throw new Error('Gagal menghasilkan link login.')
    }

    const actionLink = linkData.properties.action_link
    let accessToken = null
    let refreshToken = null

    // Lakukan HTTP GET ke actionLink untuk mendapatkan URL redirect akhir yang berisi token
    try {
      const response = await fetch(actionLink, { redirect: 'manual' })
      const redirectUrl = response.headers.get('Location')
      
      if (redirectUrl && redirectUrl.includes('#')) {
        const hashParams = new URLSearchParams(redirectUrl.split('#')[1])
        accessToken = hashParams.get('access_token')
        refreshToken = hashParams.get('refresh_token')
      }
    } catch (e) {
      console.error('Gagal mengekstrak token dari action link', e)
    }

    if (!accessToken || !refreshToken) {
      throw new Error('Gagal mengekstrak sesi dari magic link')
    }

    return { 
        success: true, 
        message: 'Sesi impersonate berhasil dibuat',
        accessToken,
        refreshToken
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Gagal membuat sesi login user' })
  }
})

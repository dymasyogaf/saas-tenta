import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  // Hanya super_admin atau admin_compliance (Tim Audit) yang boleh akses
  await requireAdmin(event, ['admin_compliance'])
  
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID klien tidak valid' })

  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, full_name, created_at, verification_status, verification_details, phone')
      .eq('id', id)
      .single()

    if (userErr) throw userErr
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Klien tidak ditemukan' })

    const details = user.verification_details || {}
    let ktpUrl = null
    let pasphotoUrl = null

    // Generate Signed URLs jika file_path tersedia
    if (details.ktp_url) {
      const { data } = await supabase.storage.from('kyc_documents').createSignedUrl(details.ktp_url, 3600)
      ktpUrl = data?.signedUrl || null
    }
    
    if (details.pasphoto_url) {
      const { data } = await supabase.storage.from('kyc_documents').createSignedUrl(details.pasphoto_url, 3600)
      pasphotoUrl = data?.signedUrl || null
    }

    return {
      success: true,
      data: {
        ...user,
        verification_details: {
          ...details,
          ktp_signed_url: ktpUrl,
          pasphoto_signed_url: pasphotoUrl
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching client details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Gagal mengambil detail klien'
    })
  }
})

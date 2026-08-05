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
    
    // Generate signed URLs untuk gambar KYC karena bucket private
    const verificationsWithSignedUrls = await Promise.all(data.map(async (user: any) => {
      if (user.verification_details) {
        const details = { ...user.verification_details }
        
        // Generate KTP signed URL
        if (details.ktp_url && !details.ktp_url.startsWith('http')) {
          const { data: ktpSigned } = await supabase.storage.from('kyc_documents').createSignedUrl(details.ktp_url, 3600)
          if (ktpSigned?.signedUrl) details.ktp_url = ktpSigned.signedUrl
        }
        
        // Generate Pasphoto signed URL
        if (details.pasphoto_url && !details.pasphoto_url.startsWith('http')) {
          const { data: pasSigned } = await supabase.storage.from('kyc_documents').createSignedUrl(details.pasphoto_url, 3600)
          if (pasSigned?.signedUrl) details.pasphoto_url = pasSigned.signedUrl
        }
        
        user.verification_details = details
      }
      return user
    }))
    
    return verificationsWithSignedUrls || []
  } catch (error: any) {
    console.error('Error fetching pending verifications:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data verifikasi'
    })
  }
})

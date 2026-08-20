import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { ktp_base64, pasphoto_base64, ktp_mime, pasphoto_mime, userId, nama, nik, tanggal_lahir } = body

  if (!ktp_base64 || !pasphoto_base64 || !userId) {
    throw createError({ statusCode: 400, message: 'Data foto tidak lengkap' })
  }

  const authenticatedUserId = user.id || (user as any).sub
  if (authenticatedUserId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: tidak dapat upload untuk user lain' })
  }
  
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedMimes.includes(ktp_mime) || !allowedMimes.includes(pasphoto_mime)) {
    throw createError({ statusCode: 400, message: 'Format file harus JPG atau PNG' })
  }


  const maxBase64Length = 7_000_000 // ~5MB file
  if (ktp_base64.length > maxBase64Length || pasphoto_base64.length > maxBase64Length) {
    throw createError({ statusCode: 400, message: 'Ukuran file maksimal 5MB' })
  }

  const supabase = serverSupabaseServiceRole(event)

  try {
    const ktpBuffer = Buffer.from(ktp_base64, 'base64')
    const pasphotoBuffer = Buffer.from(pasphoto_base64, 'base64')

    const ktpExt = ktp_mime.split('/')[1] || 'bin'
    const pasExt = pasphoto_mime.split('/')[1] || 'bin'

    const ktpFileName = `${userId}/ktp_${Date.now()}.${ktpExt}`
    const pasPhotoFileName = `${userId}/pasphoto_${Date.now()}.${pasExt}`

    const { error: ktpErr } = await supabase.storage.from('kyc_documents').upload(ktpFileName, ktpBuffer, { contentType: ktp_mime, upsert: true })
    if (ktpErr) throw ktpErr

    const { error: pasErr } = await supabase.storage.from('kyc_documents').upload(pasPhotoFileName, pasphotoBuffer, { contentType: pasphoto_mime, upsert: true })
    if (pasErr) throw pasErr

    // Update database (Bypass RLS)
    // Simpan raw path, BUKAN publicUrl, karena bucket sekarang private.
    const { error: dbErr } = await (supabase as any).from('users').update({
      verification_status: 'pending',
      verification_details: {
        name: nama,
        nik: nik,
        dob: tanggal_lahir,
        ktp_url: ktpFileName,
        pasphoto_url: pasPhotoFileName
      }
    }).eq('id', userId)

    if (dbErr) throw dbErr

    return {
      success: true,
      message: 'KYC data successfully saved to Supabase'
    }
  } catch (error: any) {
    console.error('Error uploading to storage:', error)
    throw createError({ statusCode: 500, message: error.message })
  }
})

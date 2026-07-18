import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  try {
    // 1. Buat bucket 'kyc_documents'
    const { error: bucketError } = await supabase.storage.createBucket('kyc_documents', {
      public: true, // Publik agar bisa ditampilkan di UI Admin tanpa Signed URL yang rumit
      fileSizeLimit: 5242880, // 5MB limit
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
    })

    // Hiraukan error jika bucket sudah ada
    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }

    return { 
      success: true, 
      message: 'EKSEKUSI BERHASIL! Supabase Storage bucket "kyc_documents" telah disiapkan. Semua gambar eKYC selanjutnya akan aman tersimpan di sini.' 
    }
  } catch (error: any) {
    return { success: false, message: error.message, error }
  }
})

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { request_id, ad_account_id } = body

    if (!request_id || !ad_account_id) {
      throw new Error('Request ID dan Ad Account ID wajib diisi')
    }

    // 1. Ambil data details yang lama agar tidak ter-override (hilang)
    const { data: request, error: fetchErr } = await supabase
      .from('ad_account_requests')
      .select('details')
      .eq('id', request_id)
      .single()

    if (fetchErr || !request) throw new Error('Data pengajuan tidak ditemukan')

    const currentDetails = request.details || {}

    // 2. Gabungkan details lama dengan ad_account_id yang baru
    const updatedDetails = {
      ...currentDetails,
      ad_account_id: ad_account_id,
      assigned_at: new Date().toISOString()
    }

    // 3. Update database
    const { error: updateErr } = await supabase
      .from('ad_account_requests')
      .update({ details: updatedDetails })
      .eq('id', request_id)

    if (updateErr) throw updateErr

    return { success: true, message: 'ID Akun Iklan berhasil disimpan' }

  } catch (error: any) {
    console.error('Error in ads ops update:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal menyimpan ID Akun Iklan'
    })
  }
})

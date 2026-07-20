import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { action, request_id, ad_account_id, reason } = body

    if (!request_id) {
      throw new Error('Request ID wajib diisi')
    }

    if (action === 'approve') {
      const { error } = await supabase
        .from('ad_account_requests')
        .update({ status: 'processing' })
        .eq('id', request_id)
      if (error) throw error
      return { success: true, message: 'Pengajuan disetujui, lanjut ke tahap eksekusi' }
    }
    
    if (action === 'reject') {
      const { error } = await supabase
        .from('ad_account_requests')
        .update({ status: 'rejected', notes: reason || 'Ditolak oleh Tim Ads Ops' })
        .eq('id', request_id)
      if (error) throw error
      return { success: true, message: 'Pengajuan ditolak' }
    }

    if (action === 'save_id') {
      if (!ad_account_id) throw new Error('Ad Account ID wajib diisi')
      
      const { data: request, error: fetchErr } = await supabase
        .from('ad_account_requests')
        .select('details')
        .eq('id', request_id)
        .single()

      if (fetchErr || !request) throw new Error('Data pengajuan tidak ditemukan')

      const updatedDetails = {
        ...(request.details || {}),
        ad_account_id: ad_account_id,
        assigned_at: new Date().toISOString()
      }

      const { error: updateErr } = await supabase
        .from('ad_account_requests')
        .update({ 
          details: updatedDetails,
          status: 'approved'
        })
        .eq('id', request_id)

      if (updateErr) throw updateErr
      return { success: true, message: 'ID Akun Iklan berhasil disimpan' }
    }

    throw new Error('Aksi tidak valid')

  } catch (error: any) {
    console.error('Error in ads ops update:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal menyimpan ID Akun Iklan'
    })
  }
})

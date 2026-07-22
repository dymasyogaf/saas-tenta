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
        .select('user_id, platform, account_name, details')
        .eq('id', request_id)
        .single()

      if (fetchErr || !request) throw new Error('Data pengajuan tidak ditemukan')

      // SANITIZE: Pembersihan & Format Otomatis Ad Account ID
      let cleanAdAccountId = ad_account_id.trim()
      const platStr = (request.platform || '').toLowerCase()
      let dbPlatform = 'meta'

      if (platStr.includes('google')) {
        dbPlatform = 'google'
        // Google Ads harus ANGKA MURNI tanpa strip (contoh: 8637792435)
        cleanAdAccountId = cleanAdAccountId.replace(/[^0-9]/g, '')
      } else if (platStr.includes('tiktok')) {
        dbPlatform = 'tiktok'
        // TikTok murni angka
        cleanAdAccountId = cleanAdAccountId.replace(/[^0-9]/g, '')
      } else {
        // Meta (Facebook)
        dbPlatform = 'meta'
        // Meta sekarang juga dipaksa hanya angka murni
        cleanAdAccountId = cleanAdAccountId.replace(/[^0-9]/g, '')
      }

      const updatedDetails = {
        ...(request.details || {}),
        ad_account_id: cleanAdAccountId,
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

      // Cek apakah akun ini sudah pernah dimasukkan (mencegah duplikat jika diklik berulang kali)
      const { data: existingAcc } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('account_id', cleanAdAccountId)
        .eq('platform', dbPlatform)
        .single()

      if (!existingAcc) {
        // Fetch nama user untuk standarisasi penamaan akun
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', request.user_id)
          .single()
        
        const userName = userData?.full_name || 'Client'
        
        // Hitung jumlah akun (nomor urut) yang dimiliki user untuk platform ini
        const { count: existingCount } = await supabase
          .from('ad_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', request.user_id)
          .eq('platform', dbPlatform)
          
        const nextNumber = (existingCount || 0) + 1
        
        // Buat Prefix Naming Convention
        let prefix = 'TENTA-BM'
        if (dbPlatform === 'google') prefix = 'TENTA-GA'
        if (dbPlatform === 'tiktok') prefix = 'TENTA-TT'
        
        const formattedAccountName = `${prefix}-${userName}-${nextNumber}`

        const { error: insertErr } = await supabase
          .from('ad_accounts')
          .insert({
            user_id: request.user_id,
            platform: dbPlatform,
            account_id: cleanAdAccountId,
            account_name: formattedAccountName,
            status: 'active'
          })

        if (insertErr) {
          console.error('Gagal memasukkan akun ke ad_accounts:', insertErr)
        }
      }

      return { success: true, message: 'ID Akun Iklan berhasil disimpan dan akun aktif' }
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

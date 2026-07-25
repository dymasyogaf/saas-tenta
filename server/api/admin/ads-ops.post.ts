import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { action, request_id, ad_account_id, ad_account_name, reason } = body

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
      // 1. Release hold (kembalikan pending_balance)
      const { data: request } = await supabase
        .from('ad_account_requests')
        .select('user_id, rental_fee, status')
        .eq('id', request_id)
        .single()
        
      if (request && (request.status === 'pending_review' || request.status === 'processing')) {
        const { data: saldoData } = await supabase.from('saldo').select('pending_balance').eq('user_id', request.user_id).single()
        if (saldoData) {
          const newPending = Number(saldoData.pending_balance) - Number(request.rental_fee || 0)
          await supabase.from('saldo').update({ pending_balance: newPending }).eq('user_id', request.user_id)
        }
      }

      // 2. Update status ke rejected
      const { error } = await supabase
        .from('ad_account_requests')
        .update({ status: 'rejected', rejection_reason: reason || 'Ditolak oleh Tim Ads Ops' })
        .eq('id', request_id)
      if (error) throw error
      return { success: true, message: 'Pengajuan ditolak dan saldo dikembalikan' }
    }

    if (action === 'save_id') {
      if (!ad_account_id) throw new Error('ID Akun wajib diisi')
      
      const { data: request, error: fetchErr } = await supabase
        .from('ad_account_requests')
        .select('user_id, platform, account_name, details, rental_fee, subscription_months')
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

      // Finalisasi Pemotongan Saldo
      const { data: saldoData } = await supabase
        .from('saldo')
        .select('balance, pending_balance')
        .eq('user_id', request.user_id)
        .single()
        
      if (saldoData) {
        const fee = Number(request.rental_fee || 0)
        const newBalance = Number(saldoData.balance) - fee
        const newPending = Number(saldoData.pending_balance) - fee
        
        await supabase
          .from('saldo')
          .update({ balance: newBalance, pending_balance: newPending })
          .eq('user_id', request.user_id)
          
        await supabase.from('transactions').insert({
          user_id: request.user_id,
          amount: fee,
          type: 'payment',
          status: 'success',
          description: 'Pembayaran Sewa Akun Iklan',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      // Cek apakah akun ini sudah pernah dimasukkan (mencegah duplikat jika diklik berulang kali)
      const { data: existingAcc } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('account_id', cleanAdAccountId)
        .eq('platform', dbPlatform)
        .single()

      if (!existingAcc) {
        let formattedAccountName = ad_account_name ? ad_account_name.trim() : `Ad Account ${cleanAdAccountId}`
        
        if (dbPlatform === 'google') {
          try {
            const config = useRuntimeConfig()
            const googleDevToken = config.googleAdsDevToken
            const accessToken = await getValidGoogleAccessToken()
            
            if (googleDevToken && accessToken && googleDevToken !== 'your_google_dev_token') {
              const query = `SELECT customer.descriptive_name FROM customer LIMIT 1`
              const gResponse: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${cleanAdAccountId}/googleAds:searchStream`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'developer-token': googleDevToken,
                  'login-customer-id': '6445325844',
                  'Content-Type': 'application/json'
                },
                body: { query }
              })

              if (Array.isArray(gResponse) && gResponse.length > 0) {
                const firstBatch = gResponse[0]
                if (firstBatch.results && firstBatch.results.length > 0) {
                  const customer = firstBatch.results[0].customer
                  if (customer && customer.descriptiveName) {
                    formattedAccountName = customer.descriptiveName
                  }
                }
              }
            }
          } catch (e: any) {
            console.error('Gagal mengambil nama dari Google Ads API:', e.message || e)
          }
        }
        
        const months = Number(request.subscription_months || 1)
        const expiresAt = new Date()
        // 1 Bulan dipukul rata = 30 Hari
        expiresAt.setDate(expiresAt.getDate() + (months * 30))

        const { error: insertErr } = await supabase
          .from('ad_accounts')
          .insert({
            user_id: request.user_id,
            platform: dbPlatform,
            account_id: cleanAdAccountId,
            account_name: formattedAccountName,
            status: 'active',
            subscription_expires_at: expiresAt.toISOString()
          })

        if (insertErr) {
          console.error('Gagal memasukkan akun ke ad_accounts:', insertErr)
        }
      }

      return { success: true, message: 'ID Akun Iklan berhasil disimpan dan akun aktif' }
    }

    if (action === 'delete') {
      const { data: request } = await supabase
        .from('ad_account_requests')
        .select('details, user_id, status, rental_fee')
        .eq('id', request_id)
        .single()
        
      if (request && (request.status === 'pending_review' || request.status === 'processing')) {
        const { data: saldoData } = await supabase.from('saldo').select('pending_balance').eq('user_id', request.user_id).single()
        if (saldoData) {
          const newPending = Number(saldoData.pending_balance) - Number(request.rental_fee || 0)
          await supabase.from('saldo').update({ pending_balance: newPending }).eq('user_id', request.user_id)
        }
      }
      
      const accountId = request?.details?.ad_account_id
      if (accountId) {
        await supabase
          .from('ad_accounts')
          .delete()
          .eq('account_id', accountId)
      }

      const { error } = await supabase
        .from('ad_account_requests')
        .delete()
        .eq('id', request_id)
        
      if (error) throw error
      
      return { success: true, message: 'Akun iklan dan pengajuan berhasil dihapus' }
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

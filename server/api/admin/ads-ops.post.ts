import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_ads_ops'])
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
        .select('user_id, rental_fee, status, details')
        .eq('id', request_id)
        .single()
        
      if (request && (request.status === 'pending_review' || request.status === 'processing')) {
        const isUsd = request.details?.currency === 'USD'
        const selectFields = isUsd ? 'usd_pending_balance' : 'pending_balance'
        const { data: saldoData } = await supabase.from('saldo').select(selectFields).eq('user_id', request.user_id).single() as { data: any }
        if (saldoData) {
          if (isUsd) {
            const newPending = Number(saldoData.usd_pending_balance || 0) - Number(request.rental_fee || 0)
            await supabase.from('saldo').update({ usd_pending_balance: newPending }).eq('user_id', request.user_id)
          } else {
            const newPending = Number(saldoData.pending_balance || 0) - Number(request.rental_fee || 0)
            await supabase.from('saldo').update({ pending_balance: newPending }).eq('user_id', request.user_id)
          }
        }
      }

      // 2. Update status ke rejected
      const { error } = await supabase
        .from('ad_account_requests')
        .update({ status: 'rejected', rejection_reason: reason || 'Ditolak oleh Tim Ads Ops' })
        .eq('id', request_id)
      if (error) throw error

      if (request && request.user_id) {
        // 3. Beri notifikasi ke user
        await supabase.from('notifications').insert({
          user_id: request.user_id,
          type: 'system',
          title: 'Pengajuan Akun Ditolak',
          message: reason || 'Mohon maaf, pengajuan pembuatan akun iklan Anda ditolak. Saldo telah dikembalikan ke Ad Balance Anda.'
        })
      }

      return { success: true, message: 'Pengajuan ditolak dan saldo dikembalikan' }
    }

    if (action === 'save_id') {
      if (!ad_account_id) throw new Error('ID Akun wajib diisi')
      
      const { data: request, error: fetchErr } = await supabase
        .from('ad_account_requests')
        .select('user_id, platform, account_name, details, rental_fee, subscription_months, status')
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
        ad_account_name: ad_account_name || '',
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

      // Finalisasi Pemotongan Saldo (Hanya jika belum approved sebelumnya)
      if (request.status !== 'approved') {
        const isUsd = request.details?.currency === 'USD'
        const selectFields = isUsd ? 'usd_balance, usd_pending_balance' : 'balance, pending_balance'
        
        const { data: saldoData } = await supabase
          .from('saldo')
          .select(selectFields)
          .eq('user_id', request.user_id)
          .single() as { data: any }
          
        if (saldoData) {
          const fee = Number(request.rental_fee || 0)
          
          if (isUsd) {
            const newBalance = Number(saldoData.usd_balance || 0) - fee
            const newPending = Number(saldoData.usd_pending_balance || 0) - fee
            await supabase
              .from('saldo')
              .update({ usd_balance: newBalance, usd_pending_balance: newPending })
              .eq('user_id', request.user_id)
          } else {
            const newBalance = Number(saldoData.balance || 0) - fee
            const newPending = Number(saldoData.pending_balance || 0) - fee
            await supabase
              .from('saldo')
              .update({ balance: newBalance, pending_balance: newPending })
              .eq('user_id', request.user_id)
          }
            
          await supabase.from('transactions').insert({
            user_id: request.user_id,
            amount: fee,
            type: 'payment',
            status: 'success',
            description: isUsd ? 'Pembayaran Sewa Akun Iklan (USD)' : 'Pembayaran Sewa Akun Iklan',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }

      // Ambil Ad Account ID lama jika ada (berarti ini adalah proses EDIT ID)
      const oldAdAccountId = request.details?.ad_account_id

      // Jika admin memasukkan nama secara manual, jadikan ini sebagai default awal
      let formattedAccountName = ad_account_name ? ad_account_name : `Ad Account ${cleanAdAccountId}`
        
      if (dbPlatform === 'meta') {
        // AUTO-FETCH: Ambil nama akun dari Meta Graph API
          try {
            const config = useRuntimeConfig()
            const metaToken = config.metaAccessToken
            
            if (metaToken && metaToken !== 'your_meta_token' && metaToken !== '') {
              const metaAccResponse: any = await $fetch(`https://graph.facebook.com/v19.0/act_${cleanAdAccountId}`, {
                params: {
                  fields: 'name',
                  access_token: metaToken
                }
              })
              
              if (metaAccResponse?.name) {
                formattedAccountName = metaAccResponse.name
              }
            }
          } catch (e: any) {
            console.error('Gagal mengambil nama dari Meta Ads API:', e.message || e)
          }
        } else if (dbPlatform === 'tiktok') {
          // AUTO-FETCH: Ambil nama akun dari TikTok Business API
          try {
            const config = useRuntimeConfig()
            const tiktokToken = config.tiktokAccessToken
            
            if (tiktokToken && tiktokToken !== 'your_tiktok_token' && tiktokToken !== '') {
              const ttResponse: any = await $fetch(`https://business-api.tiktok.com/open_api/v1.3/advertiser/info/`, {
                method: 'GET',
                headers: {
                  'Access-Token': tiktokToken
                },
                params: {
                  advertiser_ids: JSON.stringify([cleanAdAccountId]),
                  fields: JSON.stringify(['name'])
                }
              })
              
              if (ttResponse.code === 0 && ttResponse.data?.list?.length > 0) {
                const advName = ttResponse.data.list[0].name
                if (advName) {
                  formattedAccountName = advName
                }
              }
            }
          } catch (e: any) {
            console.error('Gagal mengambil nama dari TikTok Ads API:', e.message || e)
          }
        } else if (dbPlatform === 'google') {
          // AUTO-FETCH: Ambil nama akun dari Google Ads API (sudah ada sebelumnya)
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
        // 1 Bulan = 4 Minggu = 28 Hari (agar siklus limit mingguan selalu pas)
        expiresAt.setDate(expiresAt.getDate() + (months * 28))

        // Cek apakah ID Akun ini sudah terdaftar untuk user yang berbeda
        const { data: existingAcc } = await supabase
          .from('ad_accounts')
          .select('user_id')
          .eq('account_id', cleanAdAccountId)
          .eq('platform', dbPlatform)
          .single()

        if (existingAcc && existingAcc.user_id !== request.user_id) {
          throw new Error('ID Akun Iklan ini sudah terdaftar untuk klien lain! Harap periksa kembali.')
        }

        // Kalau ada oldAdAccountId yang berbeda, berarti admin sedang edit/mengganti ID.
        // Hapus akun lama (jika ada) milik user ini dengan ID lama.
        if (oldAdAccountId && oldAdAccountId !== cleanAdAccountId) {
          await supabase
            .from('ad_accounts')
            .delete()
            .eq('account_id', oldAdAccountId)
            .eq('platform', dbPlatform)
            .eq('user_id', request.user_id)
        }

        let upsertErr;
        if (existingAcc) {
          const { error } = await supabase
            .from('ad_accounts')
            .update({
              account_name: formattedAccountName,
              status: 'active',
              subscription_expires_at: expiresAt.toISOString()
            })
            .eq('account_id', cleanAdAccountId)
            .eq('platform', dbPlatform)
            .eq('user_id', request.user_id);
          upsertErr = error;
        } else {
          const { error } = await supabase
            .from('ad_accounts')
            .insert({
              user_id: request.user_id,
              platform: dbPlatform,
              account_id: cleanAdAccountId,
              account_name: formattedAccountName,
              status: 'active',
              subscription_expires_at: expiresAt.toISOString()
            });
          upsertErr = error;
        }

        if (upsertErr) {
          console.error('Gagal menyimpan ke database ad_accounts:', upsertErr)
          throw new Error('Gagal menyimpan ke database: ' + upsertErr.message)
        }

        // Beri notifikasi ke user bahwa akun telah aktif/diperbarui
        const notifTitle = (oldAdAccountId && oldAdAccountId !== cleanAdAccountId) ? 'Perubahan ID Akun Iklan' : 'Akun Iklan Telah Aktif'
        let platformInstruction = `Silakan cek email Anda untuk menerima (accept) akses akun whitelist, kemudian cek dan kelola akun melalui dashboard Platform.`
        if (dbPlatform === 'meta') {
           platformInstruction = `Silakan buka <a href="https://business.facebook.com/" target="_blank" class="text-orange-600 font-bold underline">Meta Business Manager</a> untuk menerima akses akun, atau cek undangan di email Anda.`
        } else if (dbPlatform === 'google') {
           platformInstruction = `Silakan cek email Anda untuk menerima undangan akses akun Google Ads, kemudian kelola akun melalui dashboard Platform.`
        } else if (dbPlatform === 'tiktok') {
           platformInstruction = `Silakan cek email Anda untuk menerima undangan akses akun TikTok Ads, kemudian kelola akun melalui dashboard Platform.`
        }

        const notifMsg = (oldAdAccountId && oldAdAccountId !== cleanAdAccountId)
          ? `Tim Iklan telah memperbarui ID Akun Iklan Anda menjadi <strong>${cleanAdAccountId}</strong> (<strong>${formattedAccountName}</strong>).`
          : `Selamat! Pengajuan akun iklan Anda berhasil disetujui. <strong>${formattedAccountName}</strong> telah aktif dan dapat digunakan selama <strong>${months * 28} hari</strong>. ${platformInstruction}`
        
        await supabase.from('notifications').insert({
          user_id: request.user_id,
          type: 'system',
          title: notifTitle,
          message: notifMsg
        })

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

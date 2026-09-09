import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event, ['admin_finance', 'admin_compliance'])
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // Ambil seluruh riwayat transaksi untuk Tim Keuangan (Finance) serta data akun iklan
    const [{ data, error }, { data: adAccounts }, { data: adRequests }] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          id, 
          user_id, 
          type, 
          amount, 
          fee_amount,
          is_sandbox,
          status, 
          currency,
          payment_gateway_ref,
          description,
          created_at,
          users(full_name, email)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('ad_accounts')
        .select('account_id, platform, account_name, user_id'),
      supabase
        .from('ad_account_requests')
        .select('id, user_id, platform, account_name, rental_fee, created_at, details')
    ])

    if (error) throw error

    // Fallback jika foreign key users() gagal
    let transactions: any[] = data || []
    
    if (transactions.length > 0 && !transactions[0].users) {
      const userIds = [...new Set(transactions.map(t => t.user_id))]
      const { data: usersData } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
      
      transactions = transactions.map(t => {
        const u = usersData?.find(user => user.id === t.user_id)
        return { ...t, users: u || { full_name: 'Unknown', email: 'Unknown' } }
      })
    }

    // Hapus transaksi pending yang kadaluwarsa (lebih dari 60 menit)
    const now = new Date().getTime()
    const validData = []
    const toDelete = []
    
    for (const tx of transactions) {
      if (tx.status === 'pending' && (tx.type === 'topup' || tx.type === 'subscription')) {
        const txTime = new Date(tx.created_at).getTime()
        if (now - txTime > 60 * 60 * 1000) {
          toDelete.push(tx.id)
          continue
        }
      }
      validData.push(tx)
    }

    if (toDelete.length > 0) {
      // Hapus di background (non-blocking)
      supabase.from('transactions').delete().in('id', toDelete).then()
    }

    const resultWithCurrency = validData.map(tx => {
      const txRef = tx.payment_gateway_ref || ''
      const rawDesc = tx.description || ''
      const desc = rawDesc.toLowerCase()
      const isUsdTrx = tx.currency === 'USD' || txRef.startsWith('NP-') || txRef.startsWith('USDT-') || desc.includes('usdt') || desc.includes('nowpayments') || desc.includes('binance')

      let category = tx.type
      let categoryLabel = 'Pembayaran'
      let platform: 'google' | 'meta' | 'tiktok' | null = null
      let platformLabel: string | null = null
      let accountName: string | null = null

      if (tx.type === 'topup') {
        category = 'topup'
        categoryLabel = 'Top Up Saldo'
      } else if (tx.type === 'withdraw') {
        category = 'withdraw'
        categoryLabel = 'Pencairan Saldo'
      } else if (tx.type === 'affiliate_commission') {
        category = 'affiliate_commission'
        categoryLabel = 'Komisi Afiliasi'
      } else if (tx.type === 'refund' || desc.includes('refund')) {
        category = 'refund'
        categoryLabel = 'Refund Saldo'
      } else if (tx.type === 'payment' || desc.includes('alokasi') || desc.includes('sewa') || desc.includes('tagihan')) {
        if (desc.includes('alokasi') || desc.includes('budget allocation')) {
          category = 'allocation'
          categoryLabel = 'Alokasi Anggaran'
        } else if (desc.includes('perpanjangan sewa')) {
          category = 'extension'
          categoryLabel = 'Perpanjangan Sewa'
        } else if (desc.includes('sewa akun')) {
          category = 'rental'
          categoryLabel = 'Sewa Akun Iklan'
        } else if (desc.includes('tagihan') || desc.includes('release')) {
          category = 'release'
          categoryLabel = 'Tagihan Iklan'
        }

        // Deteksi Platform Iklan (Google Ads / Facebook Ads / TikTok Ads)
        if (desc.includes('(google)') || desc.includes('google ads') || desc.includes('gads') || desc.includes('google')) {
          platform = 'google'
          platformLabel = 'Google Ads'
        } else if (desc.includes('(meta)') || desc.includes('facebook') || desc.includes('meta ads') || desc.includes('fb ads') || desc.includes('(fb)')) {
          platform = 'meta'
          platformLabel = 'Facebook Ads'
        } else if (desc.includes('(tiktok)') || desc.includes('tiktok')) {
          platform = 'tiktok'
          platformLabel = 'TikTok Ads'
        }

        // Cek kecocokan ad_accounts berdasarkan ID akun di deskripsi
        if (!platform && adAccounts) {
          const foundAcc = adAccounts.find((a: any) => a.account_id && desc.includes(a.account_id.toLowerCase()))
          if (foundAcc) {
            const p = (foundAcc.platform || '').toLowerCase()
            platform = p.includes('google') ? 'google' : p.includes('tiktok') ? 'tiktok' : 'meta'
            platformLabel = platform === 'google' ? 'Google Ads' : platform === 'tiktok' ? 'TikTok Ads' : 'Facebook Ads'
            accountName = foundAcc.account_name || null
          }
        }

        // Cek kecocokan dengan data ad_account_requests
        if (!platform && adRequests) {
          const txTime = new Date(tx.created_at).getTime()
          const userReqs = adRequests.filter((r: any) => r.user_id === tx.user_id)
          if (userReqs.length > 0) {
            userReqs.sort((a: any, b: any) => Math.abs(new Date(a.created_at).getTime() - txTime) - Math.abs(new Date(b.created_at).getTime() - txTime))
            const closestReq = userReqs[0]
            const reqPlat = (closestReq.platform || '').toLowerCase()
            if (reqPlat.includes('google')) {
              platform = 'google'
              platformLabel = 'Google Ads'
            } else if (reqPlat.includes('tiktok')) {
              platform = 'tiktok'
              platformLabel = 'TikTok Ads'
            } else {
              platform = 'meta'
              platformLabel = 'Facebook Ads'
            }
            if (closestReq.details?.ad_account_name) {
              accountName = closestReq.details.ad_account_name
            }
          }
        }

        // Ekstrak nama akun dari format "- [Nama Akun] (platform)"
        if (!accountName) {
          const match = rawDesc.match(/-\s*([^()]+?)\s*\((google|meta|facebook|tiktok)/i)
          if (match && match[1]) {
            accountName = match[1].trim()
          }
        }
      }

      return {
        ...tx,
        currency: isUsdTrx ? 'USD' : 'IDR',
        transaction_category: category,
        category_label: categoryLabel,
        ad_platform: platform,
        ad_platform_label: platformLabel,
        ad_account_name: accountName
      }
    })

    // Mode Finance: akun testing (Dymas Yoga & Super Admin Dymas) otomatis disaring di server
    const isSuperAdmin = adminUser.user_metadata?.role === 'super_admin'
    const finalTransactions = isSuperAdmin
      ? resultWithCurrency
      : resultWithCurrency.filter(tx => {
          const name = (tx.users?.full_name || '').toLowerCase()
          const email = (tx.users?.email || '').toLowerCase()
          const uid = tx.user_id
          if (uid === 'a978c0ff-8959-4dd7-b641-42e4f5103d15' || uid === 'f6f1883f-252d-484e-bfcb-ef648a677f28') return false
          if (name.includes('dymas') || email.includes('dymasyoga11') || email.includes('dymas@alfatihah')) return false
          return true
        })

    return finalTransactions
  } catch (error: any) {
    console.error('Error fetching finance transactions:', error)

    if (error?.code === 'PGRST303') {
      console.warn('Mengabaikan error JWT masa depan sementara, mengembalikan data kosong.')
      return []
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data transaksi keuangan'
    })
  }
})

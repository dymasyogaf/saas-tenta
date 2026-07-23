import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface AdIssue {
  id: string
  ad_account_id: string
  account_name: string
  campaign_id?: string
  campaign_name?: string
  platform: string
  issue_type: 'OUT_OF_BALANCE' | 'BANNED' | 'REJECTED' | 'POLICY_VIOLATION'
  description: string
  action_url?: string
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient(event)
  
  // 1. Ambil semua akun iklan pengguna yang aktif
  const { data: adAccounts, error: accountsError } = await supabase
    .from('ad_accounts')
    .select('id, platform, account_id, account_name, saldo')
    .eq('user_id', user.id)
    .in('status', ['active', 'pending'])

  if (accountsError) {
    throw createError({ statusCode: 500, message: 'Gagal memuat akun iklan' })
  }

  const issues: AdIssue[] = []

  // 2. Deteksi Saldo Habis (OUT_OF_BALANCE)
  if (adAccounts) {
    for (const account of adAccounts) {
      if (Number(account.saldo) <= 0) {
        issues.push({
          id: `bal_${account.id}`,
          ad_account_id: account.id,
          account_name: account.account_name || account.account_id,
          platform: account.platform,
          issue_type: 'OUT_OF_BALANCE',
          description: `Iklan Anda di akun ${account.account_name || account.account_id} telah dihentikan karena saldo telah habis (Rp 0). Harap segera lakukan Top Up atau Alokasi Saldo untuk mengaktifkannya kembali.`,
          action_url: '/dashboard/saldo'
        })
      }
    }
  }

  // 3. Deteksi Error API Iklan (Meta/Google)
  const config = useRuntimeConfig()
  const metaToken = config.metaAccessToken

  if (adAccounts && metaToken && metaToken !== 'your_meta_token') {
    const metaAccounts = adAccounts.filter(a => a.platform === 'meta')
    
    for (const account of metaAccounts) {
      try {
        const actId = account.account_id.startsWith('act_') ? account.account_id : `act_${account.account_id}`
        
        // Panggil Meta API untuk mendapatkan status kampanye
        // efektif_status yang bermasalah: DISAPPROVED, PENDING_REVIEW, CAMPAIGN_PAUSED (jika karena error)
        // Note: Untuk MVP kita fetch secara umum, real-world butuh endpoint /campaigns?fields=effective_status,issues_info
        const metaRes: any = await $fetch(`https://graph.facebook.com/v19.0/${actId}/campaigns`, {
          params: {
            fields: 'id,name,effective_status,issues_info',
            access_token: metaToken
          }
        })
        
        const campaigns = metaRes.data || []
        
        for (const camp of campaigns) {
          if (camp.effective_status === 'DISAPPROVED' || camp.effective_status === 'WITH_ISSUES') {
            const issueDesc = camp.issues_info && camp.issues_info.length > 0 
              ? camp.issues_info[0].error_message 
              : 'Kampanye ini melanggar kebijakan Meta atau tidak disetujui.'
              
            issues.push({
              id: `api_${camp.id}`,
              ad_account_id: account.id,
              account_name: account.account_name || account.account_id,
              campaign_id: camp.id,
              campaign_name: camp.name,
              platform: 'meta',
              issue_type: 'REJECTED',
              description: issueDesc,
              action_url: `https://business.facebook.com/adsmanager/manage/campaigns?act=${account.account_id}`
            })
          }
        }
      } catch (error) {
        console.error(`Gagal mengambil issue untuk Meta Ad Account ${account.account_id}`, error)
        // Jika token invalid atau account restricted, kita bisa tangkap errornya di sini
      }
    }
  }

  return {
    success: true,
    data: issues
  }
})

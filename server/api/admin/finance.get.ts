import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'admin_compliance'])
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // Ambil seluruh riwayat transaksi untuk Tim Keuangan (Finance)
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false })

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
      const txDesc = tx.description || ''
      const isUsdTrx = tx.currency === 'USD' || txRef.startsWith('NP-') || txRef.startsWith('USDT-') || txDesc.includes('USDT') || txDesc.includes('NOWPayments') || txDesc.includes('Binance')
      return {
        ...tx,
        currency: isUsdTrx ? 'USD' : 'IDR'
      }
    })

    return resultWithCurrency
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

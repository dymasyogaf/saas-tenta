import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance'])
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
        status, 
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

    return transactions
  } catch (error: any) {
    console.error('Error fetching finance transactions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data transaksi keuangan'
    })
  }
})

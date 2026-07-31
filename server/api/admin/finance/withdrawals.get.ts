import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance'])
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { data, error } = await supabase
      .from('affiliate_withdrawals')
      .select(`
        id, 
        user_id, 
        amount, 
        status, 
        rejection_reason,
        created_at,
        users(email),
        affiliate_profiles(full_name, bank_name, bank_account, account_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error: any) {
    console.error('Error fetching affiliate withdrawals:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data pengajuan pencairan'
    })
  }
})

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'admin_compliance'])
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { data, error } = await supabase
      .from('affiliate_profiles')
      .select(`
        user_id, 
        full_name, 
        bank_name, 
        bank_account, 
        account_name, 
        created_at,
        users(email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error: any) {
    console.error('Error fetching affiliate profiles:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data rekening afiliasi'
    })
  }
})

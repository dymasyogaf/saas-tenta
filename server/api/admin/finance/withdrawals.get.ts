import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'admin_compliance'])
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
        users (
          email,
          affiliate_profiles (full_name, bank_name, bank_account, account_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Map the nested users.affiliate_profiles back to the root level for the frontend
    const mappedData = data?.map((item: any) => {
      // In PostgREST, a one-to-one reverse relationship might come back as an array
      let profile = item.users?.affiliate_profiles
      if (Array.isArray(profile)) {
        profile = profile[0]
      }
      
      return {
        ...item,
        users: { email: item.users?.email },
        affiliate_profiles: profile || null
      }
    }) || []

    return mappedData
  } catch (error: any) {
    console.error('Error fetching affiliate withdrawals:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data pengajuan pencairan'
    })
  }
})

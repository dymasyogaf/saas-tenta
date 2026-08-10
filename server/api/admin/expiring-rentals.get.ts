import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*, users!inner(full_name, phone)')
      .eq('status', 'active')
      .not('subscription_expires_at', 'is', null)
      .lte('subscription_expires_at', sevenDaysFromNow.toISOString())
      .order('subscription_expires_at', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error: any) {
    console.error('Error fetching expiring rentals:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data sewa mau habis'
    })
  }
})

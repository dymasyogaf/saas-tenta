import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  try {
    const { data, error } = await supabase.from('affiliate_profiles').select('*').limit(1)
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error }
  }
})

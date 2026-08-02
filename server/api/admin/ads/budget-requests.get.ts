import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)

  // Fetch ad_budget_requests joined with users and ad_accounts
  const { data, error } = await supabase
    .from('ad_budget_requests')
    .select(`
      id,
      amount,
      status,
      rejection_reason,
      created_at,
      updated_at,
      users:user_id ( id, email, full_name ),
      ad_accounts:ad_account_id ( id, account_id, account_name, platform )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil data request anggaran',
    })
  }

  return data
})
